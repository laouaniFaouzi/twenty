# Lot 1 · Modèle, pipeline et vues · Plan d'exécution

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Créer l'app Twenty « Interfaze » avec le modèle de données métier, le pipeline, les vues, le menu et deux automatismes internes : la création du projet à la signature et le calcul de l'avancement.

**Architecture:** Une app autonome dans `packages/twenty-apps/internal/interfaze` (son propre `package.json` et son `yarn.lock`, hors des workspaces Yarn du monorepo), construite comme `public/last-contact` (constantes, `utils` testés, fonctions logiques minces) et `internal/real-estate` (objets, relations, vues, mise en page). La logique vit dans des fonctions de `src/utils` qui reçoivent un client d'API en paramètre, ce qui permet de les tester avec un client simulé. Les fonctions logiques se contentent de brancher ces utilitaires sur les événements de la base.

**Tech Stack:** TypeScript, `twenty-sdk` et `twenty-client-sdk` 2.38.0, Vitest 4, oxlint, Yarn 4.13.

**Spec:** `docs/superpowers/specs/2026-11-04-hubfaze-crm-interfaze-design.md` (§4, §4.3, §5.4 « Avancement », §6.1, §6.3, §10 lot 1).

## Périmètre de ce lot

- **Inclus** : tous les champs métier de §4.1 et §4.2, l'objet Contrat de maintenance (sans ses automatismes), les modèles de §4.3, les vues et le menu de §6.1 sauf « Pilotage », et les automatismes de §6.3 « passe à Signé » et « tâche de suivi créée ou modifiée ».
- **Reporté au lot qui l'utilise et le teste** :
  - au lot 2 : les champs techniques `siteLeadId`, `siteLeadStatusSeen` ;
  - au lot 3 : `siteTrackerId`, `siteId`, `siteUpdatedAt`, `syncHash` et l'objet Journal de synchro ;
  - au lot 4 : `responseOverdue`, `renewalTaskCreatedFor`, le tableau de bord, et les automatismes de mise en ligne et de renouvellement.

  Aucun de ces éléments n'a de comportement en lot 1.

## Global Constraints

- Dossier de l'app : `packages/twenty-apps/internal/interfaze`. Nom du paquet : `interfaze`, licence MIT, `engines.twenty` = `>=2.38.0` (version du serveur du fork, `TWENTY_CURRENT_VERSION`).
- `twenty-sdk` et `twenty-client-sdk` sont épinglés à `2.38.0`, exactement.
- Libellés, descriptions et noms de vues en français ; noms techniques (objets, champs, valeurs de SELECT) en anglais, exactement comme dans la spec §4.
- Chaque identifiant universel est un UUID v4 neuf : `node -e "for (let i = 0; i < 10; i++) console.log(crypto.randomUUID())"`. Ne jamais copier un identifiant d'une autre app.
- Les fichiers de `src/logic-functions/` n'importent jamais `twenty-shared` (règle oxlint) : uniquement `twenty-sdk/define`, `twenty-sdk/logic-function` et `twenty-client-sdk/core`.
- Règles du dépôt (`CLAUDE.md`) : pas de `any` ; des `type`, pas d'`interface` ; des unions de chaînes plutôt que des `enum` ; exports nommés, sauf l'export par défaut imposé par chaque fichier `define*` ; commentaires courts `//` et seulement pour un « pourquoi ».
- Montants : `{ amountMicros, currencyCode: 'EUR' }`.
- Messages de commit sans mention d'IA ni ligne `Co-Authored-By`.
- Commandes à lancer depuis `packages/twenty-apps/internal/interfaze` : `yarn test:unit` (tests unitaires), `yarn twenty build` (valide le manifeste et lance la vérification TypeScript, sans serveur), `yarn lint`.

## Review Focus

1. **Une opportunité repassée à Signé** (Signé → Échange → Signé) ne crée ni un deuxième projet ni une deuxième tâche « Choisir l'offre ». Test dans la tâche 6.
2. **Une opportunité signée sans société** : le projet prend le nom de l'opportunité, et aucune mise à jour de société n'est tentée. Test dans la tâche 6.
3. **Un projet avec des phases vides, ou sans aucune tâche** : la phase en cours n'affiche pas « Terminé » à tort. Test dans la tâche 4.
4. **Une tâche déplacée vers une phase d'un autre projet** : les deux projets sont recalculés. Test dans la tâche 7.
5. **Les écritures de l'app** (avancement, phase en cours) ne relancent pas la création des phases modèles et ne bouclent pas. Test dans la tâche 5.

---

### Task 1: Squelette de l'app, rôle et client d'API

**Files:**
- Create: `packages/twenty-apps/internal/interfaze/{package.json,tsconfig.json,tsconfig.spec.json,vitest.config.ts,vitest.unit.config.ts,.oxlintrc.json,.gitignore,.nvmrc,.yarnrc.yml,README.md}`
- Create: `src/application-config.ts`, `src/default-role.ts`, `src/constants/universal-identifiers.ts`, `src/constants/offer.ts`, `src/utils/record-api-client.ts`
- Test: `src/__tests__/default-role.test.ts`, `src/utils/__tests__/record-api-client.test.ts`

(Les chemins `src/...` de ce plan sont relatifs au dossier de l'app.)

**Interfaces:**
- Produces:
  - `APPLICATION_UNIVERSAL_IDENTIFIER`, `DEFAULT_ROLE_UNIVERSAL_IDENTIFIER` (`src/constants/universal-identifiers.ts`). Ce fichier accueille aussi les identifiants des fonctions logiques des tâches suivantes.
  - `type Offer = 'WEB' | 'SHOP' | 'APP' | 'SMART'`, `OFFERS: readonly Offer[]`, `OFFER_LABELS: Record<Offer, string>` = `{ WEB: 'WebFaze', SHOP: 'ShopFaze', APP: 'AppFaze', SMART: 'SmartFaze' }` (`src/constants/offer.ts`).
  - `type RecordApiClient = { query: (request: Record<string, unknown>) => Promise<Record<string, unknown>>; mutation: (request: Record<string, unknown>) => Promise<Record<string, unknown>> }`.
  - `toRecordApiClient(client: CoreApiClient): RecordApiClient` : le seul endroit où le client typé généré est converti.
  - `getEdgeNodes<TNode>(response: Record<string, unknown>, key: string): TNode[]` : renvoie `response[key].edges[].node`, ou `[]`.

- [ ] **Step 1: Copier la configuration de `public/last-contact`**

Copier `tsconfig.json`, `tsconfig.spec.json`, `vitest.config.ts`, `vitest.unit.config.ts`, `.oxlintrc.json`, `.gitignore`, `.nvmrc` et `.yarnrc.yml` à l'identique. Le dossier est à la même profondeur, donc `extends: ["../../.oxlintrc.base.json"]` reste valide. Dans `package.json`, reprendre les scripts et `devDependencies` de `public/last-contact`, avec `twenty-sdk` et `twenty-client-sdk` en `2.38.0`, sans `@sniptt/guards` ni dépendance React. Le `README.md` décrit l'app en quatre lignes en français et liste les trois commandes des Global Constraints.

- [ ] **Step 2: Installer**

Run: `yarn install`
Expected: `Done`, et un `yarn.lock` créé dans le dossier de l'app.

- [ ] **Step 3: Écrire les tests qui échouent**

```ts
// src/__tests__/default-role.test.ts
it('grants read and update on the objects the automations touch, never delete', () => {
  expect(defaultRole.success).toBe(true);
  expect(defaultRole.config).toMatchObject({
    canReadAllObjectRecords: false, canUpdateAllObjectRecords: false,
    canSoftDeleteAllObjectRecords: false, canDestroyAllObjectRecords: false,
  });
  // opportunity, company, task, taskTarget (objets standard) : read + update, pas de suppression
  // workspaceMember : read seulement
});
```

```ts
// src/utils/__tests__/record-api-client.test.ts
it('returns the nodes of a connection', () => {
  expect(getEdgeNodes<{ id: string }>({ projects: { edges: [{ node: { id: 'a' } }] } }, 'projects')).toEqual([{ id: 'a' }]);
});
it('returns an empty list when the key is missing or null', () => {
  expect(getEdgeNodes({}, 'projects')).toEqual([]);
  expect(getEdgeNodes({ projects: null }, 'projects')).toEqual([]);
});
```

Les objets Projet, Phase et Tâche de suivi sont ajoutés au rôle en tâche 3, avec leur propre assertion.

- [ ] **Step 4: Vérifier l'échec**

Run: `yarn test:unit`
Expected: FAIL, modules introuvables.

- [ ] **Step 5: Implémenter**

- `application-config.ts` : `displayName: 'Interfaze'`, une description en français (« Pipeline, projets, suivis clients et maintenance d'Interfaze »).
- `default-role.ts` : sur le modèle de `public/last-contact/src/default-role.ts`, avec `objectPermissions` selon le test.
- `offer.ts` et `record-api-client.ts` : selon les Interfaces.

- [ ] **Step 6: Vérifier**

Run: `yarn test:unit && yarn twenty build && yarn lint`
Expected: tests PASS, `✓ Build succeeded`, aucune erreur oxlint.

- [ ] **Step 7: Commit**

```bash
git add packages/twenty-apps/internal/interfaze
git commit -m "Scaffold the Interfaze Twenty app"
```

### Task 2: Champs Interfaze sur Opportunité et Société

**Files:**
- Create: dans `src/fields/`, les fichiers `opportunity-interfaze-stage.field.ts`, `opportunity-need.field.ts`, `opportunity-offer.field.ts`, `opportunity-request-source.field.ts`, `opportunity-timing.field.ts`, `opportunity-request-message.field.ts`, `opportunity-request-ref.field.ts`, `opportunity-received-at.field.ts`, `opportunity-osez-ia.field.ts`, `opportunity-lost-reason.field.ts`, `company-client-status.field.ts`
- Test: `src/fields/__tests__/standard-object-fields.test.ts`

**Interfaces:**
- Consumes: `Offer`, `OFFERS`, `OFFER_LABELS` (tâche 1).
- Produces : chaque fichier exporte l'identifiant de son champ (`<NOM>_FIELD_UNIVERSAL_IDENTIFIER`) et, pour un SELECT, son type de valeur et ses options :
  - `type InterfazeStage = 'NEW_REQUEST' | 'DISCUSSION' | 'QUOTE_SENT' | 'WON' | 'LOST'` et `INTERFAZE_STAGE_OPTIONS` ;
  - `type ClientStatus = 'PROSPECT' | 'CLIENT' | 'FORMER_CLIENT'` ;
  - `type Need = 'PROBLEM' | Offer`.

- [ ] **Step 1: Écrire le test qui échoue**

Un test par champ SELECT. Il vérifie `success === true`, l'objet cible, le `name`, et les paires `value` → `label` dans l'ordre exact de la spec §4.1. Exemple pour l'étape :

```ts
it('defines the Interfaze pipeline stage on opportunities', () => {
  expect(interfazeStage.success).toBe(true);
  expect(interfazeStage.config.objectUniversalIdentifier).toBe(STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.universalIdentifier);
  expect(interfazeStage.config.name).toBe('interfazeStage');
  expect(interfazeStage.config.options?.map(({ value, label }) => [value, label])).toEqual([
    ['NEW_REQUEST', 'Nouvelle demande'], ['DISCUSSION', 'Échange'], ['QUOTE_SENT', 'Devis envoyé'], ['WON', 'Signé'], ['LOST', 'Perdu'],
  ]);
});
```

Faire de même pour `need`, `offer`, `requestSource`, `timing`, `osezIa`, `lostReason` et `clientStatus`, avec les valeurs et libellés de §4.1. Pour `requestSource`, les libellés des pages offres sont « Page WebFaze », « Page ShopFaze », « Page AppFaze » et « Page SmartFaze ». Pour `clientStatus`, vérifier aussi `defaultValue === "'PROSPECT'"`. Pour les champs non SELECT, vérifier le `type` : `requestMessage` TEXT, `requestRef` TEXT, `receivedAt` DATE_TIME.

- [ ] **Step 2: Vérifier l'échec**

Run: `yarn test:unit src/fields`
Expected: FAIL, modules introuvables.

- [ ] **Step 3: Implémenter les 11 champs**

Suivre `internal/real-estate/src/fields/opportunity-buyer-stage.field.ts`. Tous les champs sont `isNullable: true`, sauf `clientStatus` qui a une valeur par défaut. Chaque option de SELECT a son propre UUID v4. Les champs `offer` et `need` construisent leurs options à partir de `OFFERS` et `OFFER_LABELS`, avec des identifiants propres à chaque champ.

- [ ] **Step 4: Vérifier**

Run: `yarn test:unit && yarn twenty build`
Expected: PASS et `✓ Build succeeded`.

- [ ] **Step 5: Commit**

```bash
git commit -am "Add Interfaze pipeline fields to opportunities and companies"
```

### Task 3: Objets Projet, Phase, Tâche de suivi, Contrat de maintenance et leurs relations

**Files:**
- Create: `src/objects/project.object.ts`, `src/objects/project-phase.object.ts`, `src/objects/project-task.object.ts`, `src/objects/maintenance-contract.object.ts`
- Create : dans `src/fields/`, un fichier par côté de relation, nommé `<champ>-on-<objet>.field.ts` comme dans `real-estate` :

| Côté plusieurs vers un | Côté un vers plusieurs |
|---|---|
| `project.company` → Société | `company.projects` « Projets » |
| `project.opportunity` → Opportunité | `opportunity.projects` « Projets » |
| `project.owner` → membre « Référent » | `workspaceMember.ownedProjects` « Projets suivis » |
| `projectPhase.project` → Projet | `project.phases` « Phases » |
| `projectTask.phase` → Phase | `projectPhase.trackerTasks` « Tâches de suivi » |
| `projectTask.project` → Projet | `project.trackerTasks` « Tâches de suivi » |
| `projectTask.assignee` → membre « Responsable » | `workspaceMember.assignedTrackerTasks` « Tâches de suivi assignées » |
| `maintenanceContract.company` → Société | `company.maintenanceContracts` « Contrats de maintenance » |
| `maintenanceContract.project` → Projet | `project.maintenanceContracts` « Contrats de maintenance » |

- Modify: `src/default-role.ts`, pour ajouter `project`, `projectPhase` et `projectTask` en lecture et mise à jour, sans suppression.
- Test: `src/objects/__tests__/objects.test.ts`, `src/__tests__/default-role.test.ts`

**Interfaces:**
- Consumes: `OFFERS`, `OFFER_LABELS` (tâche 1).
- Produces :
  - `PROJECT_UNIVERSAL_IDENTIFIER`, `PROJECT_PHASE_UNIVERSAL_IDENTIFIER`, `PROJECT_TASK_UNIVERSAL_IDENTIFIER`, `MAINTENANCE_CONTRACT_UNIVERSAL_IDENTIFIER`, et les identifiants de chaque champ (`PROJECT_STATUS_FIELD_UNIVERSAL_IDENTIFIER`, etc.) ;
  - `type ProjectStatus = 'IN_PROGRESS' | 'LAUNCHED' | 'ARCHIVED'` et `type ProjectTaskStatus = 'TODO' | 'DOING' | 'DONE'` ;
  - les noms GraphQL utilisés par les tâches suivantes : `projects` / `createProject` / `updateProject`, `projectPhases` / `createProjectPhase`, `projectTasks` / `createProjectTasks` / `updateProjectTask`. Clés étrangères : `companyId`, `opportunityId`, `ownerId`, `projectId`, `phaseId`, `assigneeId`.

- [ ] **Step 1: Écrire les tests qui échouent**

`objects.test.ts` : pour chaque objet, vérifier `success`, `nameSingular`, `namePlural`, `labelSingular` et `labelPlural` (« Projet / Projets », « Phase / Phases », « Tâche de suivi / Tâches de suivi », « Contrat de maintenance / Contrats de maintenance »), le champ identifiant `name`, et les paires valeur → libellé des SELECT :
- `project.status` : `IN_PROGRESS` En cours, `LAUNCHED` Mis en ligne, `ARCHIVED` Archivé, défaut `'IN_PROGRESS'` ;
- `projectTask.status` : `TODO` À faire, `DOING` En cours, `DONE` Fait, défaut `'TODO'` ;
- `maintenanceContract.contractType` : `HOSTING` Hébergement, `MAINTENANCE` Maintenance, `HOSTING_AND_MAINTENANCE` Hébergement + maintenance, `EVOLUTIONS` Évolutions ;
- `billingPeriod` : `MONTHLY` Mensuelle, `YEARLY` Annuelle ;
- `maintenanceContract.status` : `ACTIVE` Actif, `TERMINATED` Résilié, défaut `'ACTIVE'`.

Vérifier aussi les types : `price` et `monthlyAmount` CURRENCY ; `progress` NUMBER ; `currentPhase` TEXT ; `trackerUrl` LINKS ; dates en DATE ; `position` NUMBER.

Dans `default-role.test.ts`, ajouter l'assertion read + update, sans suppression, pour les trois objets.

- [ ] **Step 2: Vérifier l'échec**

Run: `yarn test:unit`
Expected: FAIL.

- [ ] **Step 3: Implémenter**

Objets sur le modèle de `real-estate/src/objects/showing.object.ts`. Relations sur le modèle de `real-estate/src/fields/property-on-showing.field.ts` et `showings-on-property.field.ts`. Les relations vers les membres suivent `last-contact/src/fields/last-contact-by.field.ts`. Le côté plusieurs-vers-un a `onDelete: OnDeleteAction.SET_NULL` et un `joinColumnName` égal au nom de la clé étrangère des Interfaces, sauf `projectPhase.project` et `projectTask.phase`, qui ont `OnDeleteAction.CASCADE`.

- [ ] **Step 4: Vérifier**

Run: `yarn test:unit && yarn twenty build`
Expected: PASS et `✓ Build succeeded`.

- [ ] **Step 5: Commit**

```bash
git commit -am "Add project, phase, tracker task and maintenance contract objects"
```

### Task 4: Modèles de suivi et calcul de l'avancement

**Files:**
- Create: `src/constants/tracker-templates.ts`, `src/utils/compute-project-progress.ts`
- Test: `src/constants/__tests__/tracker-templates.test.ts`, `src/utils/__tests__/compute-project-progress.test.ts`

**Interfaces:**
- Consumes: `Offer` (tâche 1), `ProjectTaskStatus` (tâche 3).
- Produces :
  - `type TrackerPhaseTemplate = { name: string; tasks: string[] }` et `TRACKER_TEMPLATES: Record<Offer, TrackerPhaseTemplate[]>` ;
  - `computeProjectProgress(input: { phases: { id: string; name: string; position: number }[]; tasks: { phaseId: string | null; status: ProjectTaskStatus }[] }): { progress: number; currentPhase: string }` ;
  - `PROJECT_DONE_LABEL = 'Terminé'`.

- [ ] **Step 1: Écrire les tests qui échouent**

```ts
it('copies the phases and tasks of the spec for each offer', () => {
  expect(TRACKER_TEMPLATES.WEB).toEqual([
    { name: 'On échange', tasks: ['Premier échange', 'Objectifs et contenus définis'] },
    { name: 'Vous validez le design', tasks: ['Maquettes présentées', 'Design validé'] },
    { name: 'On le construit', tasks: ['Pages développées', 'Textes et images intégrés', 'Référencement Google configuré'] },
    { name: 'Mise en ligne', tasks: ['Recette avec vous', 'Site en ligne', 'Prise en main'] },
  ]);
  // idem pour SHOP, APP et SMART avec le tableau de la spec §4.3, mot pour mot
});
```

Pour `computeProjectProgress` :
- 1 tâche faite sur 3 donne `progress` 33 ; 2 sur 3 donnent 67 (arrondi) ; aucune tâche donne 0.
- `currentPhase` = la première phase par `position` (pas par ordre du tableau) qui a une tâche non faite.
- Toutes les tâches faites : `'Terminé'`.
- **Aucune tâche** : la première phase par position, ou `''` sans phase. Jamais `'Terminé'` (Review Focus 3).
- Une phase sans tâche placée avant une phase qui a des tâches non faites est sautée.
- Une tâche sans `phaseId` compte dans `progress`, mais pas dans le choix de la phase.

- [ ] **Step 2: Vérifier l'échec**

Run: `yarn test:unit src/constants src/utils/__tests__/compute-project-progress.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implémenter** les deux modules, selon les Interfaces et les tests.

- [ ] **Step 4: Vérifier**

Run: `yarn test:unit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git commit -am "Add tracker templates per offer and project progress computation"
```

### Task 5: Création des phases modèles d'un projet

**Files:**
- Create: `src/utils/seed-project-template.ts`, `src/logic-functions/on-project-changed.ts`
- Modify: `src/constants/universal-identifiers.ts`, pour ajouter `PROJECT_CHANGED_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER`
- Test: `src/utils/__tests__/seed-project-template.test.ts`, `src/logic-functions/__tests__/on-project-changed.test.ts`

**Interfaces:**
- Consumes: `RecordApiClient`, `getEdgeNodes` (tâche 1), `TRACKER_TEMPLATES` (tâche 4), `ProjectStatus` (tâche 3).
- Produces :
  - `shouldSeedProjectTemplate(project: { offer: Offer | null; status: ProjectStatus; phaseCount: number }): boolean` : vrai si offre renseignée, statut différent d'`ARCHIVED` et aucune phase. Le lot 3 y ajoutera la condition « pas de `siteTrackerId` » ;
  - `seedProjectTemplate(client: RecordApiClient, projectId: string): Promise<{ seeded: boolean }>` ;
  - `handleProjectEvent(client: RecordApiClient, event: { name: string; recordId: string; properties: { updatedFields?: string[] } }): Promise<void>`.

- [ ] **Step 1: Écrire les tests qui échouent**

`seedProjectTemplate`, avec un client simulé comme dans `last-contact/src/utils/__tests__/recompute-opportunity-last-contact.test.ts` :
- projet `WEB`, `IN_PROGRESS`, sans phase :
  - 4 appels `createProjectPhase` avec `{ name, position: 0..3, projectId }` dans l'ordre du modèle ;
  - puis, par phase, un `createProjectTasks` dont `data` vaut `[{ name, position: index, status: 'TODO', phaseId, projectId }]` ;
  - résultat `{ seeded: true }` ;
- projet qui a déjà une phase : aucune mutation, `{ seeded: false }` ;
- projet sans offre, ou archivé : aucune mutation.

`handleProjectEvent` :
- `project.created` : appelle le seed ;
- `project.updated` avec `updatedFields: ['offer']` : appelle le seed ;
- `project.updated` avec `updatedFields: ['progress', 'currentPhase']` : **aucune requête** (Review Focus 5) ;
- `project.deleted` : aucune requête.

- [ ] **Step 2: Vérifier l'échec**

Run: `yarn test:unit src/utils/__tests__/seed-project-template.test.ts src/logic-functions`
Expected: FAIL.

- [ ] **Step 3: Implémenter**

`on-project-changed.ts` suit `last-contact/src/logic-functions/on-opportunity-updated.ts` : `databaseEventTriggerSettings: { eventName: 'project.*' }`, `timeoutSeconds: 60`, et un `handler` qui appelle `handleProjectEvent(toRecordApiClient(new CoreApiClient()), event)`.

- [ ] **Step 4: Vérifier**

Run: `yarn test:unit && yarn twenty build`
Expected: PASS et `✓ Build succeeded`.

- [ ] **Step 5: Commit**

```bash
git commit -am "Seed tracker phases and tasks when a project gets an offer"
```

### Task 6: Signature d'une opportunité

**Files:**
- Create: `src/utils/create-internal-task.ts`, `src/utils/build-project-from-opportunity.ts`, `src/utils/handle-opportunity-update.ts`, `src/logic-functions/on-opportunity-updated.ts`
- Modify: `src/constants/universal-identifiers.ts` (`OPPORTUNITY_UPDATED_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER`)
- Test: un fichier par utilitaire dans `src/utils/__tests__/`

**Interfaces:**
- Consumes: `RecordApiClient`, `getEdgeNodes`, `OFFER_LABELS` (tâche 1), `InterfazeStage` (tâche 2).
- Produces (réutilisé par les lots 2 à 4) :
  - `createInternalTask(client: RecordApiClient, input: { title: string; assigneeId: string | null; dueAt: string | null; target: { objectName: 'opportunity' | 'company' | 'person'; recordId: string } }): Promise<{ created: boolean }>` :
    - crée une Tâche standard (`createTask` avec `title`, `status: 'TODO'`, `assigneeId`, `dueAt`), puis sa cible (`createTaskTarget` avec `taskId` et `target<Objet>Id`) ;
    - ne crée rien si une tâche de même titre, non `DONE`, est déjà liée à la même cible (lecture des `taskTargets` filtrés sur `target<Objet>Id`, avec `task { id title status }`).
  - `buildProjectFromOpportunity(opportunity: { id: string; name: string; offer: Offer; ownerId: string | null; amount: { amountMicros: number; currencyCode: string } | null; company: { id: string; name: string } | null }): Record<string, unknown>` : renvoie `{ name, offer, status: 'IN_PROGRESS', opportunityId, companyId, ownerId, price }`.
    - `name` = `'<société> · <libellé offre>'`, ou `'<opportunité> · <libellé offre>'` sans société ;
    - `price` = `amount` ;
    - `companyId` vaut `null` sans société.
  - `handleOpportunityUpdate(client: RecordApiClient, event: { recordId: string; properties: { before: { interfazeStage?: InterfazeStage | null }; updatedFields: string[] } }, now: Date): Promise<void>`.

- [ ] **Step 1: Écrire les tests qui échouent**

`handleOpportunityUpdate` relit l'opportunité (`opportunity` filtré par `id`, avec `name`, `interfazeStage`, `offer`, `closeDate`, `ownerId`, `amount { amountMicros currencyCode }` et `company { id name clientStatus }`), puis lit les `projects` dont `opportunityId` vaut cet identifiant. Cas à couvrir :

1. **Passage à `WON`, avec offre et société, sans projet** :
   - `updateOpportunity` avec `closeDate: now.toISOString()` ;
   - `updateCompany` avec `clientStatus: 'CLIENT'` ;
   - `createProject` avec `data` égal à `buildProjectFromOpportunity(...)`.
2. **`closeDate` déjà renseignée** : pas de mise à jour de `closeDate`.
3. **Société déjà `CLIENT`** : pas de `updateCompany`.
4. **Sans société** : ni `updateCompany` ni erreur, et le projet est nommé d'après l'opportunité (Review Focus 2).
5. **Passage à `WON` sans offre** : pas de `createProject`, et `createInternalTask` est appelé avec :
   - `title: "Choisir l'offre de <nom de l'opportunité>"` ;
   - `assigneeId` = `ownerId` ;
   - `dueAt: null` ;
   - `target: { objectName: 'opportunity', recordId }`.
6. **`updatedFields: ['offer']` alors que l'étape est déjà `WON`** et sans projet : le projet est créé.
7. **Un projet existe déjà pour cette opportunité** : aucun `createProject` (Review Focus 1).
8. **Étape non `WON`** (par exemple `DISCUSSION`) : aucune mutation.
9. **`before.interfazeStage === 'WON'`, avec `updatedFields: ['interfazeStage']`** (rien n'a changé) : aucune mutation.

`createInternalTask` :
- crée la tâche puis la cible ;
- ne crée rien si une tâche identique non faite existe, ce qui couvre le retour à `WON` sans offre (Review Focus 1) ;
- recrée la tâche si l'existante est `DONE`.

`buildProjectFromOpportunity` : le nom, avec et sans société.

- [ ] **Step 2: Vérifier l'échec**

Run: `yarn test:unit src/utils`
Expected: FAIL.

- [ ] **Step 3: Implémenter**

`on-opportunity-updated.ts` a `databaseEventTriggerSettings: { eventName: 'opportunity.updated', updatedFields: ['interfazeStage', 'offer'] }`, et son `handler` appelle `handleOpportunityUpdate(toRecordApiClient(new CoreApiClient()), event, new Date())`.

- [ ] **Step 4: Vérifier**

Run: `yarn test:unit && yarn twenty build`
Expected: PASS et `✓ Build succeeded`.

- [ ] **Step 5: Commit**

```bash
git commit -am "Create the project and mark the company as client when an opportunity is won"
```

### Task 7: Avancement et phase en cours

**Files:**
- Create: `src/utils/recompute-project-progress.ts`, `src/utils/handle-project-task-event.ts`, `src/utils/handle-project-phase-event.ts`, `src/logic-functions/on-project-task-changed.ts`, `src/logic-functions/on-project-phase-changed.ts`
- Modify: `src/constants/universal-identifiers.ts`
- Test: `src/utils/__tests__/recompute-project-progress.test.ts`, `handle-project-task-event.test.ts`, `handle-project-phase-event.test.ts`

**Interfaces:**
- Consumes: `computeProjectProgress` (tâche 4), `RecordApiClient`, `getEdgeNodes` (tâche 1).
- Produces :
  - `recomputeProjectProgress(client: RecordApiClient, projectId: string): Promise<void>` ;
  - `handleProjectTaskEvent(client: RecordApiClient, event: { name: string; properties: { before?: { phaseId: string | null; projectId: string | null }; after?: { id: string; phaseId: string | null; projectId: string | null }; updatedFields?: string[] } }): Promise<void>` ;
  - `handleProjectPhaseEvent(client: RecordApiClient, event: { name: string; properties: { before?: { projectId: string | null }; after?: { projectId: string | null }; updatedFields?: string[] } }): Promise<void>`.

- [ ] **Step 1: Écrire les tests qui échouent**

`recomputeProjectProgress` :
- lit le projet (`progress`, `currentPhase`), ses `projectPhases` (`first: 200`) et ses `projectTasks` (`first: 200`) ;
- appelle `updateProject` avec le résultat de `computeProjectProgress` ;
- **n'écrit pas** si les deux valeurs sont inchangées.

`handleProjectTaskEvent` :
- `projectTask.created` avec une phase et sans projet : lit `projectPhase.projectId`, appelle `updateProjectTask` avec `{ projectId }`, puis s'arrête. L'événement de mise à jour qui suit déclenche le recalcul ;
- `projectTask.updated` avec `updatedFields: ['status']` : recalcule `after.projectId` ;
- `projectTask.updated` avec `updatedFields: ['assigneeId', 'dueDate']` : **aucune requête** ;
- tâche déplacée vers une phase d'un autre projet (`before.projectId` A, phase de B) : met `projectId` à B. Puis l'événement `updated` qui suit, avec `updatedFields: ['projectId']`, `before.projectId` A et `after.projectId` B, recalcule **A et B** (Review Focus 4) ;
- `projectTask.deleted` et `projectTask.destroyed` : recalculent `before.projectId` ;
- `projectTask.restored` : recalcule `after.projectId`.

`handleProjectPhaseEvent` :
- recalcule `before.projectId` et `after.projectId` (dédoublonnés, sans `null`) pour `created`, `deleted`, `destroyed`, `restored`, et pour `updated` avec `name`, `position` ou `projectId` dans `updatedFields` ;
- sinon, rien.

- [ ] **Step 2: Vérifier l'échec**

Run: `yarn test:unit src/utils`
Expected: FAIL.

- [ ] **Step 3: Implémenter**

Règle de `handleProjectTaskEvent` :
1. Un événement `updated` dont `updatedFields` ne contient ni `status`, ni `phaseId`, ni `projectId` est ignoré.
2. Pour `created`, `updated` et `restored` : si `after.phaseId` est renseigné et que le `projectId` de cette phase diffère de `after.projectId`, mettre la tâche à jour avec ce `projectId` et s'arrêter.
3. Sinon, recalculer chaque projet de `{ before.projectId, after.projectId }` (dédoublonnés, sans `null`).

Les deux fonctions logiques ont `eventName: 'projectTask.*'` et `'projectPhase.*'` (jokers acceptés par le serveur : `call-database-event-trigger-jobs.job.ts`). Elles transmettent l'événement tel quel.

- [ ] **Step 4: Vérifier**

Run: `yarn test:unit && yarn twenty build`
Expected: PASS et `✓ Build succeeded`.

- [ ] **Step 5: Commit**

```bash
git commit -am "Recompute project progress and current phase from tracker tasks"
```

### Task 8: Vues, fiche projet et menu

**Files:**
- Create, dans `src/views/` :
  - `opportunity-pipeline.view.ts`, `opportunity-requests-to-handle.view.ts` ;
  - `project-in-progress.view.ts`, `project-by-status.view.ts`, `project-record-page-fields.view.ts`, `project-tracker-tasks-widget.view.ts`, `project-contracts-widget.view.ts` ;
  - `project-task-mine.view.ts`, `project-task-overdue.view.ts` ;
  - `maintenance-contract-active.view.ts`, `maintenance-contract-renewal.view.ts`.
- Create : `src/page-layouts/project.page-layout.ts`.
- Create, dans `src/navigation-menu-items/` : `pipeline.navigation-menu-item.ts`, `projects.navigation-menu-item.ts`, `project-tasks.navigation-menu-item.ts`, `maintenance.navigation-menu-item.ts`.
- Test : `src/views/__tests__/views.test.ts`.

**Interfaces:**
- Consumes : les identifiants de champs et d'objets des tâches 2 et 3, et `INTERFAZE_STAGE_OPTIONS`.

| Vue | Type | Contenu |
|---|---|---|
| Pipeline | KANBAN, groupée par `interfazeStage` (5 groupes visibles, dans l'ordre des options) | nom, société, montant, offre, propriétaire, reçue le |
| Demandes à traiter | TABLE | filtre `interfazeStage` IS `['NEW_REQUEST']`, tri `receivedAt` ASC |
| Projets en cours | TABLE | filtre `status` IS `['IN_PROGRESS']` ; nom, société, offre, référent, avancement, phase en cours, mise en ligne annoncée, lien de suivi |
| Projets par statut | KANBAN, groupée par `status` | |
| Mes tâches | KANBAN par `status` | filtre `assignee` IS `JSON.stringify({ isCurrentWorkspaceMemberSelected: true, selectedRecordIds: [] })`, format de `jsonRelationFilterValueSchema` dans `twenty-shared/src/utils/filter` |
| En retard | TABLE | `dueDate` IS_IN_PAST et `status` IS_NOT `['DONE']` |
| Contrats actifs | TABLE | `status` IS `['ACTIVE']` |
| À renouveler sous 30 jours | TABLE | `status` IS `['ACTIVE']` et `renewalDate` IS_RELATIVE `'NEXT_30_DAY'` |

Fiche projet (`RECORD_PAGE`), sur le modèle de `real-estate/src/page-layouts/showing.page-layout.ts` :
- **Projet** (position 10) : widget FIELDS ;
- **Suivi** (20) : widget FIELD sur `trackerTasks` en mode TABLE, avec la vue `project-tracker-tasks-widget` (nom, phase, statut, responsable, échéance, triée par position) ;
- **Contrats** (30) : widget FIELD sur `maintenanceContracts` en TABLE ;
- **Historique** (40) : TIMELINE.

Les widgets FIELD en TABLE suivent `internal/twenty-partners/src/modules/opportunity/page-layouts/opportunity.page-layout.ts` : c'est la seule configuration limitée à la fiche ouverte.

Menu, positions 0 à 3 :
- **Pipeline** : `NavigationMenuItemType.VIEW` vers la vue Pipeline, nom « Pipeline », icône `IconLayoutKanban` ;
- **Projets**, **Tâches de suivi** et **Maintenance** : `NavigationMenuItemType.OBJECT`.

Pour les icônes, consulter `packages/twenty-ui/src/icon/icon-dictionary.md`.

- [ ] **Step 1: Écrire le test qui échoue**

`views.test.ts` vérifie, pour chaque vue :
- `success` ;
- le type ;
- les filtres (`operand` et `value` exacts du tableau) ;
- pour le Pipeline, que `groups.map(g => g.fieldValue)` vaut `['NEW_REQUEST', 'DISCUSSION', 'QUOTE_SENT', 'WON', 'LOST']`.

- [ ] **Step 2: Vérifier l'échec**

Run: `yarn test:unit src/views`
Expected: FAIL.

- [ ] **Step 3: Implémenter** les vues, la fiche et le menu selon le tableau.

- [ ] **Step 4: Vérifier**

Run: `yarn test:unit && yarn twenty build && yarn lint`
Expected: PASS, `✓ Build succeeded`, lint propre.

- [ ] **Step 5: Commit**

```bash
git commit -am "Add Interfaze pipeline, project, tracker task and maintenance views"
```

### Task 9: Test d'intégration du lot (« fini quand »)

**Files:**
- Create: `src/__tests__/global-setup.ts` (copie de `public/last-contact/src/__tests__/global-setup.ts`), `src/__tests__/interfaze.integration-test.ts`

- [ ] **Step 1: Démarrer un serveur local**

Run: `yarn twenty docker:start`
Expected: un serveur Twenty répond sur `http://localhost:2020/healthz`. La clé d'API par défaut est celle de `vitest.config.ts`, copiée en tâche 1.

- [ ] **Step 2: Écrire le test**

Avec `CoreApiClient`, et un utilitaire `waitFor(check, { timeoutMs: 60_000, intervalMs: 1_000 })` local au fichier, parce que les fonctions logiques passent par le worker :

1. créer une société « [test-interfaze] Boulangerie » et une opportunité `offer: 'WEB'`, `interfazeStage: 'QUOTE_SENT'`, `amount` 4 800 € ;
2. passer l'opportunité à `WON` ;
3. attendre un projet lié à l'opportunité, puis vérifier :
   - `name` = « [test-interfaze] Boulangerie · WebFaze » ;
   - 4 phases ;
   - 10 tâches de suivi `TODO` ;
   - société `CLIENT` ;
   - `closeDate` renseignée ;
4. attendre `progress === 0` et `currentPhase === 'On échange'` ;
5. passer « Premier échange » et « Objectifs et contenus définis » à `DONE`, puis attendre `progress === 20` et `currentPhase === 'Vous validez le design'` ;
6. repasser l'opportunité en `DISCUSSION`, puis en `WON`, attendre 5 secondes, et vérifier qu'il n'y a toujours qu'un seul projet.

Nettoyage en `afterAll` : suppression des enregistrements créés.

- [ ] **Step 3: Lancer**

Run: `yarn test`
Expected: PASS. S'il échoue, en rendre compte avec la sortie, sans affaiblir le test.

- [ ] **Step 4: Commit**

```bash
git add packages/twenty-apps/internal/interfaze/src/__tests__
git commit -m "Add Interfaze lot 1 integration test"
```
