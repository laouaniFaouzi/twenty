# Lot 5 · Maintenance et pilotage · Plan d'exécution

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** La mise en ligne d'un projet et le renouvellement des contrats créent les bonnes tâches, et le tableau de bord « Pilotage » affiche des chiffres justes sur un jeu de données de test.

**Architecture:**
- **Mise en ligne** : `on-project-changed` (lot 1) appelle un nouveau traitement quand `launchedAt` est renseigné : projet → Mis en ligne, tâche « Proposer un contrat de maintenance à … ».
- **Renouvellements** : une fonction planifiée chaque jour crée « Renouveler le contrat … » une seule fois par date de renouvellement, grâce à `renewalTaskCreatedFor`.
- **Demandes sans réponse** : une fonction planifiée toutes les heures tient à jour `responseOverdue`, car les filtres des widgets ne savent pas dire « reçue il y a plus de 48 h » (§6.2).
- **Tableau de bord** : une mise en page `STANDALONE_PAGE` de dix widgets, sur le modèle de `internal/real-estate/src/page-layouts/agency-dashboard.page-layout.ts`, et une entrée « Pilotage » en tête du menu.
- **Fenêtres de dates** : dans Twenty, `PAST_n_X` et `NEXT_n_X` excluent la période en cours (aujourd'hui, ce mois-ci). Chaque fenêtre « sur n X » est donc un groupe OU : `PAST_(n-1)_X` ou `THIS_1_X`. Les valeurs relatives portent le fuseau `Europe/Paris`.

**Tech Stack:** TypeScript, `twenty-sdk` 2.38.0, `twenty-client-sdk` (API des métadonnées pour le test des chiffres), Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-04-hubfaze-crm-interfaze-design.md` (§4.1 `responseOverdue`, §4.2 contrat de maintenance, §6.1 menu, §6.2 tableau de bord, §6.3 automatismes, §11 lot 5).

## Global Constraints

- Règles des lots précédents : UUID v4 neufs, aucun import de `twenty-shared` dans `src/logic-functions`, règles de `CLAUDE.md`, commits sans mention d'IA, Node 24 (`. …/scratchpad/node24/env.sh`).
- **Contrôles à chaque tâche** (depuis `packages/twenty-apps/internal/interfaze`) : `yarn test:unit`, `yarn typecheck`, `yarn twenty build` et `yarn lint`.
- Le site n'est pas modifié dans ce lot.
- **Fuseau de l'agence** : `Europe/Paris` pour « aujourd'hui » et pour les fenêtres des widgets.
- **Titres de tâches** (§6.3), exacts : `Proposer un contrat de maintenance à <société>` (à défaut, nom du projet) et `Renouveler le contrat <nom du contrat>` (à défaut, nom de la société, puis `sans nom`).
- **Renouvellement** (§6.3) : contrat Actif, renouvellement dans les 30 jours, `renewalTaskCreatedFor` ≠ `renewalDate`. Échéance = date de renouvellement. Responsable = référent du projet, à défaut le responsable des demandes (`LEAD_OWNER_EMAIL`), à défaut personne. Puis `renewalTaskCreatedFor` = `renewalDate`.
- **Mise en ligne** (§6.3) : projet → `LAUNCHED`, tâche pour le référent.
- **`responseOverdue`** (§4.1, §6.2) : Nouvelle demande reçue il y a plus de 48 h, recalculé toutes les heures.
- **Tableau de bord** (§6.2), trois lignes :
  1. Nouvelles demandes sur 7 jours · Demandes sans réponse après 48 h · Montant signé ce mois · Revenu récurrent mensuel (somme des montants mensuels des contrats actifs) ;
  2. Pipeline par étape (montants) · Projets en cours par offre ;
  3. Demandes par source sur 6 mois · Tâches de suivi en retard · Contrats à renouveler sous 30 jours · Erreurs de synchro sur 24 h.

## Choix faits là où la spec se tait

- **Renouvellements en retard** : un contrat actif dont la date est passée compte dans « à renouveler » (widget, vue) et reçoit sa tâche. Un oubli reste visible.
- **Pipeline par étape** : les trois étapes ouvertes (Nouvelle demande, Échange, Devis envoyé). Signé a son propre widget, Perdu n'est pas du pipeline.
- **Demandes** : seules les opportunités avec `receivedAt` (venues du site) comptent comme demandes. Une opportunité saisie à la main n'est jamais « sans réponse ».
- **Proposition de maintenance** : pas d'échéance. Pas de tâche si le projet a déjà un contrat actif. Jamais deux fois pour le même projet, même terminée.
- **Heure de la tâche planifiée des renouvellements** : les crons de Twenty sont en UTC. `0 5 * * *` donne 7 h à Paris l'été et 6 h l'hiver, toujours avant la journée.

## Review Focus

- **Demande reçue aujourd'hui, contrat qui se renouvelle aujourd'hui** : ils doivent compter. Les fenêtres de Twenty excluent la période en cours, d'où les groupes OU (tâche 5, tests des filtres ; tâche 6, demande reçue il y a 1 h et contrat du jour).
- **Demande traitée entre deux recalculs** : elle doit sortir tout de suite du compteur « sans réponse », d'où le filtre sur l'étape en plus du booléen (tâche 5 ; tâche 6, passage à Échange sans recalcul).
- **Contrat actif dont la date est passée** : compté et une seule tâche (tâche 3 ; tâche 6, contrat à J-3).
- **Date de mise en ligne saisie deux fois, ou projet déjà sous contrat** : pas de tâche en double ni inutile (tâche 2 ; tâche 6).
- **Soirée** : à 23 h 30 UTC, la date de Paris est déjà le lendemain. « Aujourd'hui » se calcule à Paris (tâche 3, test d'`agencyToday`).

---

### Task 1: Champs techniques, droits et cibles de tâches

**Files:**
- Create: `src/fields/opportunity-response-overdue.field.ts`
- Modify: `src/objects/maintenance-contract.object.ts`, `src/default-role.ts`, `src/utils/create-internal-task.ts`, `src/utils/sync-settings.ts`
- Test: `src/fields/__tests__/standard-object-fields.test.ts`, `src/objects/__tests__/objects.test.ts`, `src/__tests__/default-role.test.ts`, `src/utils/__tests__/create-internal-task.test.ts`, `src/utils/__tests__/sync-settings.test.ts`

**Interfaces:**
- Produces:
  - `OPPORTUNITY_RESPONSE_OVERDUE_FIELD_UNIVERSAL_IDENTIFIER` ; champ `responseOverdue` BOOLEAN, `defaultValue: false`, `isUIEditable: false`, libellé « Sans réponse après 48 h », icône `IconClockExclamation`.
  - `MAINTENANCE_CONTRACT_RENEWAL_TASK_CREATED_FOR_FIELD_UNIVERSAL_IDENTIFIER` ; champ `renewalTaskCreatedFor` DATE, nullable, `isUIEditable: false`, libellé « Tâche de renouvellement créée pour », icône `IconPlug`.
  - `InternalTaskTarget.objectName` accepte aussi `'project'` (`targetProjectId`) et `'maintenanceContract'` (`targetMaintenanceContractId`).
  - `readLeadOwnerEmail(env: Record<string, string | undefined>): string | null` dans `sync-settings.ts`, sur le `readVariable` existant ; `readSyncSettings` l'utilise.
  - Rôle : contrat de maintenance en lecture et mise à jour, sans suppression.

- [ ] **Step 1: Write the failing tests**
  - `standard-object-fields.test.ts` : `it('flags requests left without answer as a technical boolean, false by default')` attend `{ type: FieldType.BOOLEAN, name: 'responseOverdue', defaultValue: false, isUIEditable: false }` sur l'opportunité.
  - `objects.test.ts` : `it('remembers the renewal date a task was created for')` attend `renewalTaskCreatedFor` de type DATE, `isNullable: true`, `isUIEditable: false`.
  - `default-role.test.ts` : le contrat de maintenance passe de la lecture seule à `{ canReadObjectRecords: true, canUpdateObjectRecords: true, canSoftDeleteObjectRecords: false, canDestroyObjectRecords: false }`.
  - `create-internal-task.test.ts` : `it('links to a project or a maintenance contract with the matching target field')`, `createTaskTarget` reçoit `targetProjectId` puis `targetMaintenanceContractId`.
  - `sync-settings.test.ts` : `readLeadOwnerEmail({ LEAD_OWNER_EMAIL: ' lucas@interfaze.fr ' })` vaut `'lucas@interfaze.fr'` ; `readLeadOwnerEmail({})` et `readLeadOwnerEmail({ LEAD_OWNER_EMAIL: '  ' })` valent `null`, sans aucune variable Supabase.
- [ ] **Step 2: Run them, they fail** : `yarn test:unit` → 5 échecs sur ces cas.
- [ ] **Step 3: Implement** les champs, le rôle, les deux cibles et `readLeadOwnerEmail`.
- [ ] **Step 4: Run the checks** : les quatre contrôles passent.
- [ ] **Step 5: Commit** : `Add the overdue request flag, the renewal marker and maintenance task targets`

### Task 2: Mise en ligne d'un projet

**Files:**
- Create: `src/utils/handle-project-launch.ts`
- Modify: `src/logic-functions/on-project-changed.ts`
- Test: `src/utils/__tests__/handle-project-launch.test.ts`, `src/logic-functions/__tests__/on-project-changed.test.ts`

**Interfaces:**
- Consumes: `ProjectEvent` (`src/utils/seed-project-template.ts`), `createInternalTask`, `findMemberIdByEmail` (`handle-lead-created.ts`), `presentText`, `readLeadOwnerEmail`.
- Produces:
  - `maintenanceProposalTitle(clientName: string): string` → `Proposer un contrat de maintenance à ${clientName}`.
  - `handleProjectLaunch(client: RecordApiClient, event: ProjectEvent, { leadOwnerEmail }: { leadOwnerEmail: string | null }): Promise<{ launched: boolean; taskCreated: boolean }>`.

Comportement :
- Agit sur `project.created`, et sur `project.updated` dont `updatedFields` contient `launchedAt`. Tout autre événement : aucune requête.
- Relit le projet par une requête de liste `first: 1` (`id`, `name`, `status`, `launchedAt`, `ownerId`, `company { id name }`) et ses contrats `ACTIVE` (`maintenanceContracts`, filtre `projectId`, `first: 1`).
- `launchedAt` vide (`null` ou `''`) : rien.
- Statut `IN_PROGRESS` : `updateProject` `{ status: 'LAUNCHED' }`. `LAUNCHED` ou `ARCHIVED` : inchangé.
- Contrat actif présent : pas de tâche.
- Sinon `createInternalTask` : titre sur le nom de la société, à défaut celui du projet ; `assigneeId` = `ownerId`, à défaut le membre de `leadOwnerEmail` ; `dueAt: null` ; cible le projet, plus la société si elle existe ; `duplicateCheck: 'any'`.
- Dans `on-project-changed.ts`, l'appel se place après `handleProjectEvent` et avant l'envoi du suivi, avec `readLeadOwnerEmail(process.env)`.

- [ ] **Step 1: Write the failing tests** (`answerQueries`, `mutationArgs`) :
  - `it('marks an in-progress project as launched and asks its owner to propose a maintenance contract')` : projet `IN_PROGRESS`, `launchedAt: '2026-11-07'`, `ownerId: 'owner-1'`, société `Boulangerie Dupont`. Attendus : `updateProject` `{ id, data: { status: 'LAUNCHED' } }` ; `createTask` `{ title: 'Proposer un contrat de maintenance à Boulangerie Dupont', status: 'TODO', assigneeId: 'owner-1', dueAt: null }` ; cibles `targetProjectId` puis `targetCompanyId`.
  - `it('ignores updates that do not touch the launch date')` : `updatedFields: ['name']`, `client.query` jamais appelé.
  - `it('does nothing when the launch date is cleared')` : `launchedAt: null`, aucune mutation.
  - `it('leaves an archived or already launched project as it is')` : pas d'`updateProject`, la tâche est créée.
  - `it('skips the proposal when the project already has an active contract')`.
  - `it('never proposes twice, even once the first task is done')` : une tâche liée de même titre au statut `DONE`, pas de `createTask`.
  - `it('falls back to the lead owner and to the project name')` : `ownerId: null`, pas de société, `workspaceMembers` répond `member-9`. Titre sur le nom du projet, `assigneeId: 'member-9'`.
  - `it('handles a project created already launched')` : `name: 'project.created'`, pas d'`updatedFields`.
  - `on-project-changed.test.ts` : un événement `project.updated` avec `['launchedAt']` déclenche `updateProject` vers `LAUNCHED`. Suivre le montage existant du fichier.
- [ ] **Step 2: Run them, they fail.**
- [ ] **Step 3: Implement** `handle-project-launch.ts` et le branchement.
- [ ] **Step 4: Run the checks.**
- [ ] **Step 5: Commit** : `Mark a project launched and propose a maintenance contract when its launch date is set`

### Task 3: Renouvellement des contrats

**Files:**
- Create: `src/utils/agency-date.ts`, `src/utils/create-renewal-tasks.ts`, `src/logic-functions/create-renewal-tasks.ts`
- Modify: `src/constants/universal-identifiers.ts` (`RENEWAL_TASKS_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER`)
- Test: `src/utils/__tests__/agency-date.test.ts`, `src/utils/__tests__/create-renewal-tasks.test.ts`, `src/logic-functions/__tests__/maintenance-functions.test.ts`

**Interfaces:**
- Consumes: `fetchAllRecords`, `createInternalTask`, `findMemberIdByEmail`, `presentText`, `readLeadOwnerEmail`.
- Produces:
  - `AGENCY_TIME_ZONE = 'Europe/Paris'`.
  - `agencyToday(now: Date): string` : date `YYYY-MM-DD` à Paris, par `Intl.DateTimeFormat`.
  - `addDays(date: string, days: number): string` : calcul en UTC sur `YYYY-MM-DD`.
  - `RENEWAL_WINDOW_IN_DAYS = 30`.
  - `renewalTaskTitle(contractName: string): string` → `Renouveler le contrat ${contractName}`.
  - `isRenewalTaskDue(contract: { renewalDate: string | null; renewalTaskCreatedFor: string | null }, today: string): boolean`.
  - `createRenewalTasks(client: RecordApiClient, { now, leadOwnerEmail }: { now: Date; leadOwnerEmail: string | null }): Promise<{ created: number; failures: number }>`.
  - Fonction `create-renewal-tasks` : `cronTriggerSettings: { pattern: '0 5 * * *' }`, `timeoutSeconds: 120`.

Comportement de `createRenewalTasks` :
- Lit avec `fetchAllRecords` les `maintenanceContracts` au filtre `{ status: { eq: 'ACTIVE' }, renewalDate: { lte: addDays(today, 30) } }` : `id`, `name`, `renewalDate`, `renewalTaskCreatedFor`, `company { id name }`, `project { ownerId }`.
- Garde ceux où `isRenewalTaskDue`. Le membre de `leadOwnerEmail` n'est cherché qu'une fois, et seulement s'il sert.
- Pour chacun :
  - `createInternalTask` avec `dueAt` = `${renewalDate}T08:00:00.000Z`, cible le contrat puis la société, `duplicateCheck: 'unfinished'` ;
  - puis `updateMaintenanceContract` `{ renewalTaskCreatedFor: renewalDate }`.
- Une erreur sur un contrat compte dans `failures` et n'arrête pas les suivants.

- [ ] **Step 1: Write the failing tests**
  - `agencyToday(new Date('2026-03-28T23:30:00Z'))` → `'2026-03-29'` ; `agencyToday(new Date('2026-11-07T10:00:00Z'))` → `'2026-11-07'` ; `addDays('2026-12-20', 30)` → `'2027-01-19'` ; `addDays('2028-02-28', 1)` → `'2028-02-29'`.
  - `isRenewalTaskDue`, `it.each` avec `today = '2026-11-07'` :
    - `2026-11-17` → vrai ; `2026-12-07` (J+30) → vrai ; `2026-12-08` → faux ;
    - `2026-11-04` (en retard) → vrai ;
    - déjà créée pour `2026-11-17` → faux ; créée pour `2025-11-17` → vrai ;
    - sans date → faux.
  - `createRenewalTasks` avec `now = new Date('2026-11-07T05:00:00Z')` :
    - `it('reads only active contracts renewing within 30 days')` : `queryFilters(client, 'maintenanceContracts')[0]` vaut `{ status: { eq: 'ACTIVE' }, renewalDate: { lte: '2026-12-07' } }`.
    - `it('creates the task for the project owner, due on the renewal date, then remembers it')` : contrat `Hébergement Boulangerie`, renouvellement `2026-12-01`, `ownerId: 'owner-1'`. Attendus :
      - `createTask` `{ title: 'Renouveler le contrat Hébergement Boulangerie', status: 'TODO', assigneeId: 'owner-1', dueAt: '2026-12-01T08:00:00.000Z' }` ;
      - cibles `targetMaintenanceContractId` puis `targetCompanyId` ;
      - puis `updateMaintenanceContract` `{ id, data: { renewalTaskCreatedFor: '2026-12-01' } }`.
    - `it('skips a contract whose task already exists for this renewal date')`.
    - `it('falls back to the lead owner, then to nobody')` : `assigneeId` vaut le membre trouvé, puis `null` sans `leadOwnerEmail`.
    - `it('names the task after the company when the contract has no name')` : nom `''`.
    - `it('keeps going when one contract fails')` : la première création rejette, la seconde passe. Résultat `{ created: 1, failures: 1 }`.
  - `maintenance-functions.test.ts` : `it('creates renewal tasks every morning')` attend `success: true` et `cronTriggerSettings: { pattern: '0 5 * * *' }`.
- [ ] **Step 2: Run them, they fail.**
- [ ] **Step 3: Implement** les deux utilitaires et la fonction. Le gestionnaire passe `new Date()` et `readLeadOwnerEmail(process.env)`, puis renvoie le résumé.
- [ ] **Step 4: Run the checks.**
- [ ] **Step 5: Commit** : `Create maintenance renewal tasks once per renewal date`

### Task 4: Demandes sans réponse après 48 h

**Files:**
- Create: `src/utils/refresh-response-overdue.ts`, `src/logic-functions/refresh-response-overdue.ts`
- Modify: `src/utils/handle-lead-created.ts` (exporter `REPLY_DELAY_IN_MILLISECONDS`), `src/constants/universal-identifiers.ts` (`RESPONSE_OVERDUE_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER`)
- Test: `src/utils/__tests__/refresh-response-overdue.test.ts`, `src/logic-functions/__tests__/maintenance-functions.test.ts`

**Interfaces:**
- Produces:
  - `refreshResponseOverdue(client: RecordApiClient, now: Date): Promise<{ flagged: number; cleared: number }>`.
  - Fonction `refresh-response-overdue` : `cronTriggerSettings: { pattern: '0 * * * *' }`, `timeoutSeconds: 60`.

Deux mises à jour groupées `updateOpportunities` (`__args: { filter, data }`, sélection `id`), avec `threshold = new Date(now.getTime() - REPLY_DELAY_IN_MILLISECONDS).toISOString()` :
- à marquer : `{ and: [{ interfazeStage: { eq: 'NEW_REQUEST' } }, { receivedAt: { lte: threshold } }, { responseOverdue: { eq: false } }] }` → `{ responseOverdue: true }` ;
- à effacer : `{ and: [{ responseOverdue: { eq: true } }, { or: [{ interfazeStage: { neq: 'NEW_REQUEST' } }, { interfazeStage: { is: 'NULL' } }, { receivedAt: { gt: threshold } }, { receivedAt: { is: 'NULL' } }] }] }` → `{ responseOverdue: false }`.

Les déclencheurs d'opportunité des lots 1 et 3 filtrent sur `interfazeStage` et `offer` : ces écritures ne les réveillent pas.

- [ ] **Step 1: Write the failing tests**
  - `it('flags requests still waiting at Nouvelle demande 48 hours after they arrived')` : `now = 2026-11-07T10:00:00.000Z`, premier `updateOpportunities` avec le filtre ci-dessus et `receivedAt: { lte: '2026-11-05T10:00:00.000Z' }`.
  - `it('clears the flag of requests answered, moved or without a reception date')` : second appel, filtre exact ci-dessus.
  - `it('counts what it changed')` : les mutations rendent 2 puis 1 enregistrements, résultat `{ flagged: 2, cleared: 1 }`.
  - `maintenance-functions.test.ts` : `it('refreshes overdue requests every hour')` attend `pattern: '0 * * * *'`.
- [ ] **Step 2: Run them, they fail.**
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run the checks.**
- [ ] **Step 5: Commit** : `Refresh the overdue request flag every hour`

### Task 5: Tableau de bord « Pilotage », menu et vue des renouvellements

**Files:**
- Create: `src/page-layouts/utils/chart-filters.ts`, `src/page-layouts/pilotage.page-layout.ts`, `src/navigation-menu-items/pilotage.navigation-menu-item.ts`
- Modify:
  - `src/constants/universal-identifiers.ts` (`PILOTAGE_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER`) ;
  - positions du menu : `pipeline` 1, `projects` 2, `project-tasks` 3, `maintenance` 4, `pages` 5 ;
  - `src/views/maintenance-contract-renewal.view.ts`.
- Test: `src/page-layouts/__tests__/pilotage.page-layout.test.ts`, `src/page-layouts/__tests__/chart-filters.test.ts`, `src/views/__tests__/views.test.ts`

**Interfaces:**
- Produces, dans `chart-filters.ts` (opérandes `ViewFilterOperand`, groupes `ViewFilterGroupLogicalOperator`, tous deux de `twenty-sdk/define`) :
  - `relativeDate(direction: 'PAST' | 'THIS' | 'NEXT', amount: number, unit: 'HOUR' | 'DAY' | 'MONTH'): string` → `` `${direction}_${amount}_${unit};;Europe/Paris;;MONDAY;;` `` ;
  - `isAnyOf(fieldUniversalIdentifier: string, values: string[])` → `{ fieldMetadataUniversalIdentifier, operand: IS, value: JSON.stringify(values) }` ;
  - `isNoneOf(…)`, même forme, `IS_NOT` ;
  - `isTrue(fieldUniversalIdentifier)` → `IS`, `'true'` ;
  - `isInPast(fieldUniversalIdentifier)` → `IS_IN_PAST`, `''` ;
  - `isRelative(fieldUniversalIdentifier, value: string)` → `IS_RELATIVE` ;
  - `withinLast(fieldUniversalIdentifier, amount, unit)` → `[isRelative(f, relativeDate('PAST', amount - 1, unit)), isRelative(f, relativeDate('THIS', 1, unit))]` ;
  - `chartFilter(filters, anyOf?: { groupId: string; filters })` → `{ recordFilters, recordFilterGroups }`. Les filtres de `anyOf` portent `recordFilterGroupId: groupId`. Le groupe est `{ id: groupId, logicalOperator: OR }`, et il est seul.
  - Le type de retour suit la forme `filter` qu'accepte `definePageLayout` : le type de la SDK s'il est exporté, sinon un type local de même forme.
- `pilotage.page-layout.ts` : `name: 'Pilotage'`, `type: 'STANDALONE_PAGE'`, un onglet « Pilotage » en `GRID`, icône `IconLayoutDashboard`. Comptages `COUNT` sur le champ `name` de l'objet, `timezone: 'Europe/Paris'`, `firstDayOfTheWeek: 1`, un UUID neuf par groupe de filtres. Les widgets :

| # | Titre | Objet | Graphique | Filtre | Position (ligne, colonne, largeur × hauteur) |
|---|---|---|---|---|---|
| 1 | Nouvelles demandes sur 7 jours | opportunité | `AGGREGATE_CHART` COUNT | OU `withinLast(receivedAt, 7, 'DAY')` | 0, 0, 3 × 2 |
| 2 | Demandes sans réponse après 48 h | opportunité | `AGGREGATE_CHART` COUNT | `isAnyOf(interfazeStage, ['NEW_REQUEST'])`, `isTrue(responseOverdue)` | 0, 3, 3 × 2 |
| 3 | Montant signé ce mois | opportunité | `AGGREGATE_CHART` SUM `amount` | `isAnyOf(interfazeStage, ['WON'])`, `isRelative(closeDate, relativeDate('THIS', 1, 'MONTH'))` | 0, 6, 3 × 2 |
| 4 | Revenu récurrent mensuel | contrat | `AGGREGATE_CHART` SUM `monthlyAmount` | `isAnyOf(status, ['ACTIVE'])` | 0, 9, 3 × 2 |
| 5 | Pipeline par étape (montants) | opportunité | `BAR_CHART` SUM `amount`, axe `interfazeStage`, `primaryAxisOrderBy: 'FIELD_POSITION_ASC'`, `layout: 'VERTICAL'` | `isAnyOf(interfazeStage, ['NEW_REQUEST', 'DISCUSSION', 'QUOTE_SENT'])` | 2, 0, 6 × 6 |
| 6 | Projets en cours par offre | projet | `PIE_CHART` COUNT, groupé par `offer`, `displayLegend: true`, `hideEmptyCategory: true` | `isAnyOf(status, ['IN_PROGRESS'])` | 2, 6, 6 × 6 |
| 7 | Demandes par source sur 6 mois | opportunité | `BAR_CHART` COUNT, axe `requestSource`, `omitNullValues: true`, `FIELD_POSITION_ASC` | OU `withinLast(receivedAt, 6, 'MONTH')` | 8, 0, 6 × 6 |
| 8 | Tâches de suivi en retard | tâche de suivi | `AGGREGATE_CHART` COUNT | `isInPast(dueDate)`, `isNoneOf(status, ['DONE'])` | 8, 6, 6 × 2 |
| 9 | Contrats à renouveler sous 30 jours | contrat | `AGGREGATE_CHART` COUNT | `isAnyOf(status, ['ACTIVE'])` ; OU `isInPast(renewalDate)`, `isRelative(renewalDate, relativeDate('THIS', 1, 'DAY'))`, `isRelative(renewalDate, relativeDate('NEXT', 30, 'DAY'))` | 10, 6, 6 × 2 |
| 10 | Erreurs de synchro sur 24 h | Journal de synchro | `AGGREGATE_CHART` COUNT | OU `withinLast(occurredAt, 24, 'HOUR')` | 12, 6, 6 × 2 |

- Menu : `pilotage.navigation-menu-item.ts`, type `PAGE_LAYOUT`, `name: 'Pilotage'`, icône `IconLayoutDashboard`, position 0.
- Vue « À renouveler sous 30 jours » : le filtre `ACTIVE` reste. Le filtre `NEXT_30_DAY` devient un groupe de vue `OR` (`filterGroups`, `viewFilterGroupUniversalIdentifier`, `positionInViewFilterGroup`), avec les trois mêmes conditions que le widget 9.

- [ ] **Step 1: Write the failing tests**
  - `chart-filters.test.ts` :
    - `relativeDate('PAST', 6, 'DAY')` → `'PAST_6_DAY;;Europe/Paris;;MONDAY;;'` ;
    - `withinLast(id, 24, 'HOUR')` → valeurs `PAST_23_HOUR…` et `THIS_1_HOUR…` ;
    - `chartFilter([a], { groupId: 'g', filters: [b, c] })` → `{ recordFilters: [a, { ...b, recordFilterGroupId: 'g' }, { ...c, recordFilterGroupId: 'g' }], recordFilterGroups: [{ id: 'g', logicalOperator: 'OR' }] }` ;
    - `isAnyOf(id, ['WON'])` → valeur `'["WON"]'`.
  - `pilotage.page-layout.test.ts` :
    - `it('is a standalone page named Pilotage with one grid tab')` ;
    - `it.each` sur le tableau : titre → objet, `configurationType`, `aggregateOperation`, champ agrégé ;
    - `it('lays the widgets out in the three rows of the spec')` : positions du tableau ;
    - `it('counts requests received today and the six days before')` ;
    - `it('counts overdue requests only while they wait at Nouvelle demande')` ;
    - `it('counts contracts to renew within 30 days, late ones and today included')` ;
    - `it('leaves lost and signed deals out of the pipeline')`.
  - `views.test.ts` :
    - « Pilotage » en position 0, puis Pipeline, Projets, Tâches de suivi, Maintenance, Pages ;
    - la vue des renouvellements a son groupe `OR` à trois filtres et garde `ACTIVE` hors du groupe.
- [ ] **Step 2: Run them, they fail.**
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run the checks.** `yarn twenty build` valide le manifeste des widgets.
- [ ] **Step 5: Commit** : `Add the Pilotage dashboard and put it first in the menu`

### Task 6: Test d'intégration des chiffres et des automatismes

**Files:**
- Create: `src/__tests__/utils/dashboard-figures.ts`, `src/__tests__/pilotage.integration-test.ts`

**Interfaces:**
- Consumes: `refreshResponseOverdue`, `createRenewalTasks`, `agencyToday`, `addDays`, `maintenanceProposalTitle`, `renewalTaskTitle`, `MetadataApiClient` (`twenty-client-sdk/metadata`).
- Produces (`dashboard-figures.ts`) :
  - `type DashboardWidget = { title: string; objectMetadataId: string; configuration: Record<string, unknown> }` ;
  - `loadDashboardWidgets(metadata: MetadataApiClient, layoutName: string): Promise<Map<string, DashboardWidget>>` : `getPageLayouts(pageLayoutType: STANDALONE_PAGE)`, widgets de l'onglet, configuration lue par fragments `on_AggregateChartConfiguration`, `on_BarChartConfiguration`, `on_PieChartConfiguration` ;
  - `widgetTotal(metadata, widget): Promise<number>` : pour un `AGGREGATE_CHART`, `pieChartData` avec la même agrégation et le même `filter`, groupé par le `createdAt` de l'objet en `dateGranularity: 'YEAR'`, puis somme des parts. Ce sont les mêmes services et la même conversion des filtres (`computeRecordGqlOperationFilter`) que l'écran. L'id de `createdAt` vient de l'API des métadonnées ;
  - `widgetBreakdown(metadata, widget): Promise<Record<string, number>>` : `barChartData` ou `pieChartData` avec la configuration telle quelle, clés ramenées aux valeurs brutes par `formattedToRawLookup`.

Le test compare chaque chiffre avant et après le jeu de données : l'espace de dev contient d'autres enregistrements.

- [ ] **Step 1: Write the test**
  - `beforeAll` :
    - `refreshResponseOverdue(client, new Date())` pour partir d'un état stable ;
    - instantané des dix widgets ;
    - jeu de données préfixé `[test-pilotage]`, dates relatives à `now` et `today = agencyToday(now)` :
      - une société ;
      - opportunités :
        - O1 `NEW_REQUEST`, reçue à `now − 1 h`, `HOME` ;
        - O2 `NEW_REQUEST`, `now − 3 j`, `CONTACT` ;
        - O3 `NEW_REQUEST`, `now − 10 j`, `OFFER_WEB` ;
        - O4 `NEW_REQUEST`, `now − 240 j`, `OFFER_SHOP` ;
        - O5 `DISCUSSION` 1 000 € ; O6 `QUOTE_SENT` 2 500 € ; O7 `LOST` 9 000 € ;
        - O8 `WON` 4 000 € avec `closeDate = now`, sans offre ;
      - projets P1 et P2 `IN_PROGRESS` `WEB`, P3 `IN_PROGRESS` `SMART` (rattaché à la société), P4 `ARCHIVED` `SHOP` ;
      - tâches de suivi sur la première phase de P1, une fois le modèle posé : `today − 2` `TODO`, `today − 2` `DONE`, `today + 2` `TODO` ;
      - contrats :
        - K1 `ACTIVE` 100 €, renouvellement `today + 10` ;
        - K2 `ACTIVE` 50 €, `today + 60` ;
        - K3 `TERMINATED` 70 €, `today + 5` ;
        - K4 `ACTIVE` 30 €, `today − 3` ;
        - K5 `ACTIVE` 20 €, `today` ;
      - entrées du Journal à `now − 1 h` et `now − 30 h` ;
    - puis `refreshResponseOverdue(client, new Date())`.
  - `it('shows the right figures on the dashboard')`, écarts attendus :
    - Nouvelles demandes sur 7 jours `+2` ; Demandes sans réponse `+3` ;
    - Montant signé ce mois `+4000` ; Revenu récurrent mensuel `+200` ;
    - Pipeline `{ NEW_REQUEST: 0, DISCUSSION: +1000, QUOTE_SENT: +2500 }`, sans clé `LOST` ni `WON` ;
    - Projets en cours `{ WEB: +2, SMART: +1, SHOP: 0 }` ;
    - Demandes par source `{ HOME: +1, CONTACT: +1, OFFER_WEB: +1, OFFER_SHOP: 0 }` ;
    - Tâches de suivi en retard `+1` ; Contrats à renouveler `+3` ; Erreurs de synchro `+1`.
  - `it('drops a request from the overdue count as soon as it leaves Nouvelle demande')` : O3 passe à `DISCUSSION`, le compteur perd 1 sans recalcul.
  - `it('marks a launched project and proposes a maintenance contract once')` :
    - `launchedAt = today` sur P3 ; attendre `LAUNCHED` et une tâche `maintenanceProposalTitle(<société>)` liée à P3 ;
    - nouvelle date, puis 5 s d'attente : toujours une seule tâche ;
    - Projets en cours `SMART` perd 1.
  - `it('creates each renewal task once')` :
    - `createRenewalTasks(client, { now: new Date(), leadOwnerEmail: null })` : une tâche pour K1, K4 et K5, aucune pour K2 et K3, `renewalTaskCreatedFor` = `renewalDate` ;
    - second appel : `created` ne compte aucun de nos contrats, toujours une tâche chacun.
  - `afterAll` : suppression de tout ce qui porte le préfixe, tâches comprises, et des entrées du Journal créées.
- [ ] **Step 2: Run it** contre la pile locale. Elle est montée comme au lot 4 : serveur, worker, base du site, relais. La synchro doit tourner sans échec pour que le Journal ne bouge pas pendant le test.
  - Commande : `SUPABASE_URL=… SUPABASE_SECRET_KEY=… HUBFAZE_WEBHOOK_SECRET=… yarn test src/__tests__/pilotage.integration-test.ts`.
  - Attendu : 4 tests au vert. Un écart faux se corrige dans la tâche qui possède le widget ou l'automatisme, pas dans le test.
- [ ] **Step 3: Run the whole integration suite** (`yarn test`), lots 1 à 5 : tout passe.
- [ ] **Step 4: Run the checks** et commit : `Test the Pilotage figures and the maintenance automations against a live workspace`

### Task 7: Tableau de bord à l'écran et README

**Files:**
- Create: `e2e/pilotage.spec.ts`
- Modify: `README.md`

- [ ] **Step 1: Write the e2e test** : `it('opens Pilotage from the menu and shows its ten widgets')`. Même authentification et même montage que `e2e/pages.spec.ts`. Le test :
  - clique « Pilotage » dans le menu ;
  - attend les dix titres du tableau de la tâche 5 ;
  - vérifie qu'aucun widget n'affiche d'erreur ;
  - enregistre la capture `pilotage.png`.
- [ ] **Step 2: Run it** avec le front lancé (`yarn test:e2e e2e/pilotage.spec.ts`) : il passe. Regarder la capture : les chiffres du jeu de la tâche 6 doivent s'y lire si on le relance sans nettoyage.
- [ ] **Step 3: README**, section « Maintenance et pilotage » :
  - les dix chiffres et leurs fenêtres : aujourd'hui compris, contrats en retard compris ;
  - la mise en ligne ;
  - les renouvellements (5 h UTC, une tâche par date, référent puis responsable des demandes) ;
  - le recalcul horaire de « sans réponse ».
- [ ] **Step 4: Run the checks** et commit : `Show the Pilotage dashboard end to end and document maintenance and steering`
