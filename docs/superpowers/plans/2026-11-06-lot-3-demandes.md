# Lot 3 · Demandes du site · Plan d'exécution

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Chaque demande envoyée sur interfaze.fr devient, dans HubFaze, une personne, une société, une opportunité et une tâche « Répondre sous 48 h ». L'étape de l'opportunité revient dans `leads.status`, et le statut changé sur le site fait avancer l'opportunité.

**Architecture:**
- **Côté site** (`interfaze-site`) : une migration ajoute à `leads` une colonne `crm_id`, une colonne `updated_at` et un trigger `notify_hubfaze()`. À chaque insertion, modification ou suppression, ce trigger poste la ligne vers HubFaze avec `pg_net`, sauf si l'écriture vient de HubFaze (en-tête `x-sync-origin: hubfaze`). Un test pgTAP vérifie ce comportement.
- **Côté HubFaze** (app `interfaze`) : une route publique `site-webhook` vérifie le secret et transmet l'événement à des utilitaires testés avec un client simulé. Une fonction sur `opportunity.updated` renvoie l'étape vers Supabase par son API REST.

**Tech Stack:** TypeScript, `twenty-sdk` 2.38.0, Vitest. PostgreSQL 17 avec `pg_net` et Supabase Vault. pgTAP. PostgREST.

**Spec:** `docs/superpowers/specs/2026-11-04-hubfaze-crm-interfaze-design.md` (§4.1 champs techniques, §5.1, §5.2, §5.3, §5.6, §11 lot 3).

## Périmètre

- **Reporté au lot 4** : le rapprochement toutes les 15 minutes et le Journal de synchro (§5.5), ainsi que la règle des 3 ans appliquée par le rapprochement. Ici, la règle des 3 ans ne s'applique qu'à l'événement de suppression.
- **Reporté au lot 7** : la mise à jour de la page Confidentialité et les secrets du Supabase de production.

## Global Constraints

- Règles des lots 1 et 2 : UUID v4 neufs, aucun import de `twenty-shared` dans `src/logic-functions`, règles de `CLAUDE.md`, commits sans mention d'IA, Node 24 (`. …/scratchpad/node24/env.sh`).
- **Contrôles à chaque tâche de l'app** : `yarn test:unit`, `yarn typecheck`, `yarn twenty build` et `yarn lint`.
- **Variables de l'app** (§5.6), dans `applicationVariables` de `defineApplication`, lues par `process.env` :
  - `SUPABASE_URL`, l'URL du projet sans `/rest/v1` ;
  - `SUPABASE_SECRET_KEY`, secrète ;
  - `HUBFAZE_WEBHOOK_SECRET`, secrète ;
  - `LEAD_OWNER_EMAIL`, l'e-mail du membre responsable des demandes.
- **Appels à Supabase** :
  - adresse `${SUPABASE_URL}/rest/v1/leads?id=eq.<id>` ;
  - en-têtes `apikey: <clé>`, `x-sync-origin: hubfaze`, `Content-Type: application/json` et `Prefer: return=minimal`, plus `Authorization: Bearer <clé>` seulement si la clé est un JWT (trois segments séparés par des points). Les clés `sb_secret_…` passent uniquement par `apikey`.
- **Le dépôt du site** demande un accès en écriture (`add_repo` en mode `push`). Le travail se fait sur la branche `claude/hubfaze-demandes` d'`interfaze-site`, jamais sur `master`.
- **Correspondances** (§4.1) :
  - besoin : `probleme|web|shop|app|smart` → `PROBLEM|WEB|SHOP|APP|SMART` ;
  - source : `accueil|contact|offre:web|offre:shop|offre:app|offre:smart` → `HOME|CONTACT|OFFER_WEB|OFFER_SHOP|OFFER_APP|OFFER_SMART` ;
  - délai : `asap|1-3-mois|sans-date` → `ASAP|ONE_TO_THREE_MONTHS|NO_DATE` ;
  - étape → statut : `NEW_REQUEST` → `new`, `DISCUSSION` et `QUOTE_SENT` → `in_progress`, `WON` et `LOST` → `done`.

## Review Focus

1. **Une demande reçue deux fois** (événement rejoué) ne crée ni deuxième opportunité, ni deuxième note, ni deuxième tâche. Test en tâche 4.
2. **Une société écrite autrement** (« boulangerie émile » contre « Boulangerie Émile  ») est retrouvée, pas dupliquée. Test en tâche 3.
3. **Un téléphone saisi librement** (« 06 12 34 56 78 », « +33 6… », « 0612345678 », un numéro étranger ou vide) ne fait jamais échouer la création de la personne. Test en tâche 3.
4. **Un statut changé sur le site** en même temps qu'une étape changée dans HubFaze ne fait pas boucler les deux côtés. Test en tâche 6 et en intégration.
5. **Un appel au webhook sans le bon secret**, ou avec un corps invalide, est refusé sans rien créer. Test en tâche 6.

---

### Task 1: Migration du site et test pgTAP

**Files (dépôt `interfaze-site`, branche `claude/hubfaze-demandes`):**
- Create: `supabase/migrations/20261106100000_synchro_hubfaze_demandes.sql`
- Create: `supabase/tests/synchro_hubfaze_demandes.test.sql`

**Interfaces:**
- Produces :
  - `public.notify_hubfaze()`, une fonction trigger réutilisée au lot 4 pour les suivis ;
  - le corps posté : `{ "table": <nom de la table>, "type": "INSERT"|"UPDATE"|"DELETE", "record": <ligne après ou null>, "old_record": <ligne avant ou null> }` ;
  - l'en-tête `x-hubfaze-secret` ;
  - les secrets Vault `hubfaze_webhook_url` et `hubfaze_webhook_secret`.

- [ ] **Step 1: Écrire le test pgTAP qui échoue**

Le fichier est une transaction `begin … rollback`, avec `select plan(N)`. Il vérifie :
- `has_column('public', 'leads', 'crm_id')` et `has_column('public', 'leads', 'updated_at')` ;
- `has_trigger('public', 'leads', 'leads_notify_hubfaze')` ;
- **sans secrets Vault**, une insertion dans `leads` ne met rien dans `net.http_request_queue` et ne lève aucune erreur ;
- **avec les deux secrets** (`vault.create_secret`), une insertion met exactement une requête en file, vers l'URL du secret, avec l'en-tête `x-hubfaze-secret` et un corps dont `type = 'INSERT'` et `record ->> 'ref'` vaut la référence insérée ;
- **après `select set_config('request.headers', '{"x-sync-origin":"hubfaze"}', true)`**, une mise à jour ne met rien en file ;
- **une mise à jour de `status`** fait avancer `updated_at` ;
- **sous `set local role anon`**, `select` sur `leads` échoue toujours (`throws_ok`).

- [ ] **Step 2: Vérifier l'échec** sur la base de test (voir l'Annexe).
  Run: `psql … -f supabase/tests/synchro_hubfaze_demandes.test.sql`
  Expected: des lignes `not ok`.

- [ ] **Step 3: Écrire la migration**

- `alter table public.leads add column crm_id uuid unique, add column updated_at timestamptz not null default now()`, puis le trigger `set_updated_at` sur `leads` ;
- `create extension if not exists pg_net with schema extensions` ;
- `notify_hubfaze()` en `plpgsql`, `security definer`, `search_path = ''` :
  1. elle sort tout de suite si `current_setting('request.headers', true)::jsonb ->> 'x-sync-origin' = 'hubfaze'` ;
  2. elle lit les deux secrets dans `vault.decrypted_secrets`, et sort s'il en manque un ;
  3. sinon, elle appelle `net.http_post(url, body, headers := { content-type, x-hubfaze-secret })` ;
- `revoke execute` pour `public`, `anon` et `authenticated` ;
- `create trigger leads_notify_hubfaze after insert or update or delete on public.leads for each row`.

Aucun nouveau droit pour `anon` ni `authenticated`.

- [ ] **Step 4: Vérifier.**
  Run : la migration, puis le test pgTAP.
  Expected : aucune ligne `not ok`.

- [ ] **Step 5: Commit** dans `interfaze-site` : « Synchro HubFaze : demandes (trigger pg_net) ».

### Task 2: Champs techniques, variables de l'app, client Supabase

**Files (app):**
- Create: `src/fields/opportunity-site-lead-id.field.ts`, `src/fields/opportunity-site-lead-status-seen.field.ts` (TEXT, `isUIEditable: false`)
- Create: `src/utils/sync-settings.ts`, `src/utils/supabase-leads.ts`
- Modify: `src/application-config.ts` (`applicationVariables`), `src/default-role.ts`
- Test: `src/utils/__tests__/sync-settings.test.ts`, `src/utils/__tests__/supabase-leads.test.ts`, `src/__tests__/default-role.test.ts`, `src/fields/__tests__/standard-object-fields.test.ts`

**Interfaces:**
- Produces :
  - `type SyncSettings = { supabaseUrl: string; supabaseSecretKey: string; webhookSecret: string; leadOwnerEmail: string | null }` ;
  - `readSyncSettings(env: Record<string, string | undefined>): { success: true; settings: SyncSettings } | { success: false; error: string }` : les trois premières variables sont obligatoires ;
  - `type SiteLeadStatus = 'new' | 'in_progress' | 'done'` ;
  - `type LeadPatch = { status?: SiteLeadStatus; crm_id?: string | null }` ;
  - `patchSiteLead(settings: SyncSettings, leadId: string, patch: LeadPatch, fetchImpl?: typeof fetch): Promise<void>` : lève une erreur si la réponse n'est pas 2xx.

Le rôle reçoit :
- `person`, `note` et `noteTarget` en lecture et mise à jour ;
- `opportunity`, `person` et `company` avec en plus la suppression douce, pour la règle des 3 ans (§5.3) ;
- `workspaceMember` reste en lecture seule.

- [ ] **Step 1: Écrire les tests qui échouent**

- **`readSyncSettings`** : réussit avec les quatre variables. `leadOwnerEmail` vaut `null` si la variable est vide. Il échoue en nommant chaque variable obligatoire absente.
- **`patchSiteLead`**, avec une fonction `fetch` simulée :
  - un appel `PATCH` vers `https://abc.supabase.co/rest/v1/leads?id=eq.L1` avec le corps `{"status":"done"}` ;
  - en-têtes `apikey`, `x-sync-origin: hubfaze` et `Prefer: return=minimal` ;
  - `Authorization: Bearer` présent pour une clé JWT (`aaa.bbb.ccc`), absent pour `sb_secret_xyz` ;
  - une réponse 401 lève `"Supabase a refusé la mise à jour de la demande L1 (401)"`.
- **Les deux champs** : `name` `siteLeadId` et `siteLeadStatusSeen`, type TEXT, sur `opportunity`, `isUIEditable: false`.
- **Le rôle** : les permissions ci-dessus.

- [ ] **Step 2: Vérifier l'échec.**
  Run: `yarn test:unit`
  Expected: FAIL.

- [ ] **Step 3: Implémenter.** Les quatre variables sont déclarées avec un libellé et une description en français, et `isSecret` pour les deux secrets.

- [ ] **Step 4: Vérifier** avec les quatre contrôles.

- [ ] **Step 5: Commit**
  `git commit -m "Add site sync settings, lead link fields and the Supabase leads client"`

### Task 3: Conversion d'une demande

**Files:** Create `src/utils/lead-mapping.ts`. Test `src/utils/__tests__/lead-mapping.test.ts`.

**Interfaces:**
- Produces :
  - `type SiteLead = { id: string; ref: string; source: string; need: string; timing: string | null; name: string; company: string | null; email: string; phone: string | null; message: string | null; status: SiteLeadStatus; crm_id: string | null; created_at: string }` ;
  - `splitPersonName(name: string): { firstName: string; lastName: string }` : le premier mot, puis le reste, espaces retirés aux bords ;
  - `normalizeFrenchPhone(raw: string | null): { primaryPhoneNumber: string; primaryPhoneCallingCode: string; primaryPhoneCountryCode: string } | null` ;
  - `normalizeCompanyName(name: string): string` : en minuscules, sans accents (NFD sans diacritiques), espaces réduits ;
  - `companyNameLikePattern(name: string): string` : motif `ilike` où chaque lettre accentuable (`aceinouy`, avec ou sans accent) devient `_`, et chaque espace multiple devient `%` ;
  - `mapLeadToOpportunityData(lead: SiteLead, links: { personId: string; companyId: string | null; ownerId: string | null; companyName: string | null }): Record<string, unknown>` ;
  - `statusForStage(stage: InterfazeStage): SiteLeadStatus` ;
  - `stageAfterSiteStatus(input: { stage: InterfazeStage; seenStatus: string | null; siteStatus: SiteLeadStatus }): { stage: InterfazeStage | null; askToClose: boolean }`.

- [ ] **Step 1: Écrire les tests qui échouent**

**`splitPersonName`** : « Marie Curie-Dupont » donne `Marie` et `Curie-Dupont` ; «  Léo  » donne `Léo` et `''`.

**`normalizeFrenchPhone`** :
- « 06 12 34 56 78 », « 06.12.34.56.78 », « +33 6 12 34 56 78 » et « 0033612345678 » donnent tous `{ '612345678', '+33', 'FR' }` ;
- « +41 79 123 45 67 » donne `{ '41791234567', '', '' }` (les chiffres sans indicatif interprété) ;
- `null`, une chaîne vide ou « abc » donnent `null` (Review Focus 3).

**`normalizeCompanyName`** : « Boulangerie Émile » et «  boulangerie   emile » donnent la même chaîne (Review Focus 2).

**`companyNameLikePattern`** : « Émile » donne `_m_l_` ; le motif d'un nom ne contient jamais `%` ni `_` venant de la saisie, qui sont échappés.

**`mapLeadToOpportunityData`** :
- avec une société « Boulangerie Martin » et le besoin `web`, le nom vaut « Boulangerie Martin · WebFaze » ;
- sans société, avec le besoin `probleme`, il vaut « Marie Curie · Problème à régler », et `offer` est absent ;
- avec le besoin `smart`, `offer` vaut `SMART` ;
- les correspondances de source, de délai et de besoin des Global Constraints ;
- `interfazeStage: 'NEW_REQUEST'`, `requestRef`, `requestMessage`, `receivedAt` (= `created_at`), `pointOfContactId`, `companyId`, `ownerId`, `siteLeadId` (= `lead.id`) et `siteLeadStatusSeen` (= `lead.status`).

**`statusForStage`** : la table des Global Constraints.

**`stageAfterSiteStatus`** :
- `new` → `in_progress` en `NEW_REQUEST` donne `{ stage: 'DISCUSSION', askToClose: false }` ;
- `new` → `in_progress` en `QUOTE_SENT` donne `{ stage: null, askToClose: false }` ;
- passage à `done` en `DISCUSSION` donne `{ stage: null, askToClose: true }` ;
- passage à `done` en `WON` donne `{ stage: null, askToClose: false }` ;
- retour de `in_progress` à `new` donne `{ stage: null, askToClose: false }` ;
- statut identique au statut déjà vu : `{ stage: null, askToClose: false }`.

- [ ] **Step 2: Vérifier l'échec**, puis **Step 3: Implémenter**, puis **Step 4: Vérifier** avec les quatre contrôles.

- [ ] **Step 5: Commit**
  `git commit -m "Map site leads to people, companies and opportunities"`

### Task 4: Demande reçue

**Files:** Create `src/utils/handle-lead-created.ts`. Modify `src/utils/create-internal-task.ts` (paramètre facultatif `extraTargets: InternalTaskTarget[]`, liés après la première cible ; la détection des doublons porte toujours sur la première cible). Test `src/utils/__tests__/handle-lead-created.test.ts` et un cas ajouté à `create-internal-task.test.ts`.

**Interfaces:**
- Consumes : tâche 2 (`SyncSettings`, `patchSiteLead`) et tâche 3 (toutes les fonctions).
- Produces :
  - `findMemberIdByEmail(client: RecordApiClient, email: string | null): Promise<string | null>` (`workspaceMembers` filtré sur `userEmail`) ;
  - `handleLeadCreated(client: RecordApiClient, lead: SiteLead, deps: { settings: SyncSettings; patchLead: typeof patchSiteLead }): Promise<{ outcome: 'created' | 'noted' | 'duplicate'; opportunityId: string }>`.

Règle (§5.3) :
1. **Doublon** : une opportunité porte déjà `siteLeadId = lead.id`, ou une note s'intitule déjà « Nouvelle demande <ref> ». Rien n'est créé, et le résultat est `duplicate` (Review Focus 1).
2. **Personne** : recherche avec `emails.primaryEmail` en `ilike`, sur l'e-mail sans espaces aux bords. Sinon, création avec le nom, l'e-mail, et le téléphone normalisé s'il existe.
3. **Société** : si `lead.company` est rempli, recherche des candidates avec le `ilike` de `companyNameLikePattern`, puis comparaison avec `normalizeCompanyName`. Sinon, création en `PROSPECT`. Une personne qui n'a pas encore de société y est rattachée.
4. **Opportunité ouverte** pour cette personne (`pointOfContactId`, étape `NEW_REQUEST`, `DISCUSSION` ou `QUOTE_SENT`) : une note « Nouvelle demande <ref> » y est créée (`createNote` avec `title` et `bodyV2: { markdown, blocknote: null }`, puis `createNoteTarget`), et le résultat est `noted`.
5. **Sinon**, `createOpportunity` avec `mapLeadToOpportunityData`, et le résultat est `created`.
6. **Dans les deux cas** :
   - une tâche « Répondre à <nom> · <ref> », avec l'échéance `created_at` + 48 h, assignée au membre de `LEAD_OWNER_EMAIL`, sur l'opportunité, avec la personne en cible supplémentaire ;
   - puis `patchLead(lead.id, { crm_id: <id de l'opportunité> })`.

Le markdown de la note liste la référence, le besoin, la source, le délai, le téléphone et le message, une ligne par information, en omettant les vides.

- [ ] **Step 1: Écrire les tests qui échouent**, avec un client simulé et un `patchLead` simulé :
  - nouvelle personne, nouvelle société, opportunité, tâche et `crm_id` (ordre des mutations et données exactes) ;
  - personne existante trouvée par un e-mail de casse différente ;
  - société existante avec des accents différents (Review Focus 2) ;
  - opportunité ouverte existante : une note, pas d'opportunité ;
  - événement rejoué : `duplicate` et aucune mutation (Review Focus 1) ;
  - `LEAD_OWNER_EMAIL` inconnu : la tâche est créée sans responsable ;
  - `patchLead` en échec : l'erreur remonte, et les fiches déjà créées restent. Le rapprochement du lot 4 rattrapera le lien.

- [ ] **Steps 2-4** : vérifier l'échec, implémenter, puis les quatre contrôles.

- [ ] **Step 5: Commit**
  `git commit -m "Turn a new site lead into a person, company, opportunity and reply task"`

### Task 5: Demande modifiée ou supprimée sur le site

**Files:** Create `src/utils/handle-lead-changed.ts`. Test `src/utils/__tests__/handle-lead-changed.test.ts`.

**Interfaces:**
- Produces :
  - `findLeadOpportunity(client: RecordApiClient, lead: Pick<SiteLead, 'id' | 'crm_id'>): Promise<{ id: string; name: string; interfazeStage: InterfazeStage; siteLeadId: string | null; siteLeadStatusSeen: string | null; ownerId: string | null; pointOfContactId: string | null; companyId: string | null } | null>` : par `crm_id`, sinon par `siteLeadId` ;
  - `handleLeadUpdated(client: RecordApiClient, lead: SiteLead): Promise<void>` ;
  - `handleLeadDeleted(client: RecordApiClient, lead: SiteLead): Promise<void>`.

**Règle de mise à jour** :
- `stageAfterSiteStatus`, puis `updateOpportunity` avec `interfazeStage` (si un changement est demandé) et `siteLeadStatusSeen = lead.status` (à chaque fois que le statut diffère de celui déjà vu) ;
- `askToClose` crée la tâche interne « Demande <ref> clôturée sur le site : passer en Signé ou Perdu » pour le propriétaire de l'opportunité.

**Règle de suppression** (§5.3) :
- si l'opportunité a été créée pour cette demande (`siteLeadId = lead.id`) et n'est pas `WON` : `deleteOpportunity` ;
- puis `deletePerson` et `deleteCompany` pour la personne et la société qui n'ont plus aucune opportunité, aucun projet et aucun contrat ;
- si la demande avait été ajoutée en note : `deleteNote` sur la note « Nouvelle demande <ref> » ;
- si l'opportunité est `WON` : rien.

- [ ] **Step 1: Écrire les tests qui échouent** :
  - les cas de `stageAfterSiteStatus` vus au travers de `handleLeadUpdated`, avec les mutations exactes ;
  - une mise à jour sans changement de statut (par exemple `email_sent`) : aucune mutation ;
  - une demande inconnue de HubFaze : aucune erreur, aucune mutation ;
  - suppression d'une opportunité non signée : l'opportunité, puis la personne et la société sans autre lien ;
  - une personne qui a une autre opportunité est gardée ;
  - suppression d'une opportunité signée : rien ;
  - suppression d'une demande ajoutée en note : seule la note.

- [ ] **Steps 2-4** : vérifier l'échec, implémenter, puis les quatre contrôles.

- [ ] **Step 5: Commit**
  `git commit -m "Apply site lead status changes forward and the three-year purge"`

### Task 6: Route du webhook et retour de l'étape vers le site

**Files:**
- Create: `src/utils/handle-site-webhook.ts`, `src/utils/handle-opportunity-stage-change.ts`, `src/logic-functions/site-webhook.ts`, `src/logic-functions/on-opportunity-stage-changed.ts`
- Modify: `src/constants/universal-identifiers.ts`
- Test: `src/utils/__tests__/handle-site-webhook.test.ts`, `src/utils/__tests__/handle-opportunity-stage-change.test.ts`

**Interfaces:**
- Produces :
  - `isValidWebhookSecret(received: string | undefined, expected: string): boolean` : comparaison en temps constant avec `crypto.timingSafeEqual`, fausse si les longueurs diffèrent ;
  - `handleSiteWebhook(client: RecordApiClient, request: { secret: string | undefined; body: unknown }, deps: { settings: SyncSettings; patchLead: typeof patchSiteLead }): Promise<{ status: 200 | 400 | 401; message: string }>` ;
  - `handleOpportunityStageChange(client: RecordApiClient, event: { recordId: string; properties: { before: { interfazeStage?: InterfazeStage | null }; after: { interfazeStage?: InterfazeStage | null; siteLeadId?: string | null } } }, deps: { settings: SyncSettings; patchLead: typeof patchSiteLead }): Promise<void>`.

**`site-webhook`** :
- `httpRouteTriggerSettings: { path: '/hubfaze/site-webhook', httpMethod: 'POST', isAuthRequired: false, forwardedRequestHeaders: ['x-hubfaze-secret'] }` ;
- réponse 401 si le secret ne correspond pas ;
- réponse 400 si le corps n'a pas de `table`, de `type` ou de ligne ;
- `leads` et `INSERT` vont à `handleLeadCreated`, `UPDATE` à `handleLeadUpdated`, `DELETE` à `handleLeadDeleted` avec `old_record` ;
- une autre table renvoie 200 avec « ignoré » (les suivis arrivent au lot 4).

**`on-opportunity-stage-changed`** :
- déclenché par `opportunity.updated`, avec `updatedFields: ['interfazeStage']` ;
- si `siteLeadId` est renseigné : `patchLead(siteLeadId, { status: statusForStage(after) })`, puis `updateOpportunity` avec `siteLeadStatusSeen` égal à ce statut. Si le statut ne change pas, rien n'est envoyé ;
- si l'étape quitte `NEW_REQUEST` : les tâches « Répondre à … » non faites liées à l'opportunité passent à `DONE`.

- [ ] **Step 1: Écrire les tests qui échouent** :
  - secret absent, faux ou de longueur différente : 401, aucune requête (Review Focus 5) ;
  - corps invalide : 400 ;
  - les trois types envoyés au bon utilitaire ;
  - une autre table est ignorée ;
  - le passage d'étape envoie le bon statut et met à jour `siteLeadStatusSeen` ;
  - une opportunité sans `siteLeadId` n'appelle jamais Supabase ;
  - la tâche « Répondre à » passe à `DONE` ;
  - un événement dont le statut correspondant est déjà le statut vu (cas de la boucle, Review Focus 4) n'appelle pas Supabase ;
  - les deux définitions (déclencheurs exacts).

- [ ] **Steps 2-4** : vérifier l'échec, implémenter, puis les quatre contrôles.

- [ ] **Step 5: Commit**
  `git commit -m "Receive site lead events and send the opportunity stage back to the site"`

### Task 7: Test d'intégration du lot (« fini quand »)

**Files:** Create `src/__tests__/leads.integration-test.ts`. Modify `src/__tests__/global-setup.ts` : après l'installation, régler les quatre variables avec `updateOneApplicationVariable(key, value, applicationId)` à partir de `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `HUBFAZE_WEBHOOK_SECRET` et `LEAD_OWNER_EMAIL` (par défaut `tim@apple.dev`), seulement si `SUPABASE_URL` est défini.

- [ ] **Step 1: Préparer la base du site et PostgREST** (Annexe). Les secrets Vault visent `http://<passerelle docker>:2020/s/hubfaze/site-webhook`.

- [ ] **Step 2: Écrire le test**, ignoré (`describe.skipIf`) sans `SUPABASE_URL`. Il insère une demande par l'API REST avec la clé secrète, comme le serveur du site :
  1. attendre une opportunité dont `siteLeadId` vaut l'identifiant de la demande, avec sa personne (e-mail), sa société, et la tâche « Répondre à … » ;
  2. lire `leads.crm_id` (REST) : il vaut l'identifiant de l'opportunité ;
  3. passer l'opportunité à `QUOTE_SENT`, puis attendre `leads.status = 'in_progress'`, et vérifier que la tâche « Répondre à … » est `DONE` ;
  4. passer `leads.status` à `done` par REST sans l'en-tête, puis attendre la tâche « Demande … clôturée sur le site » ;
  5. appeler la route avec un mauvais secret : réponse 401.

  Nettoyage : supprimer la demande par REST, puis détruire les fiches HubFaze.

- [ ] **Step 3: Lancer** `yarn test` avec les variables. Expected : tous les tests passent.

- [ ] **Step 4: Commit**
  `git commit -m "Add the site leads integration test"`

## Annexe : base du site pour les tests

- **Sur une machine de développement** : `supabase start`, puis `supabase db reset` dans `interfaze-site`, et `supabase test db` pour pgTAP. Les secrets Vault se posent avec `select vault.create_secret('<url>', 'hubfaze_webhook_url')` (et de même pour `hubfaze_webhook_secret`).
- **Dans cette session**, où les images Supabase autres que Postgres sont bloquées :
  1. lancer le conteneur `supabase/postgres:17.11.0.006` sur le port 55432 ;
  2. créer les tables minimales `storage.buckets` (`id text primary key`, `name text`, `public boolean`) et `storage.objects` (`id uuid primary key default gen_random_uuid()`, `bucket_id text`, `name text`, `owner uuid`) ;
  3. appliquer les migrations dans l'ordre ;
  4. lancer PostgREST (binaire GitHub) avec `db-anon-role=anon`, `db-schemas=public` et un `jwt-secret` de test ;
  5. placer devant un petit relais Node qui sert `/rest/v1/*` ;
  6. utiliser comme clé secrète un JWT `role: service_role` signé avec ce secret.

  Ces scripts restent dans le dossier temporaire de la session et ne sont pas versionnés.
