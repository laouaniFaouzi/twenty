# HubFaze · CRM d'Interfaze · Spécification

> Conception validée section par section le 4 novembre 2026.
> Document de référence pour les plans d'exécution (un plan par lot, écrit au moment de l'attaquer).

## 1. Contexte et objectif

Interfaze est une agence digitale et IA (Tomblaine, Nancy) de trois personnes (Faouzi, Lucas, Léo). Elle vend quatre offres : **WebFaze** (sites vitrines et refontes), **ShopFaze** (boutiques Shopify), **AppFaze** (applications web, mobiles et SaaS) et **SmartFaze** (IA et automatisations, avec le cofinancement « Osez l'IA »). Ses promesses : réponse sous 48 h, une seule personne suit chaque projet, le prix du devis est le prix final, une date de mise en ligne annoncée dès le devis, « on reste là après la mise en ligne ».

Le site interfaze.fr (dépôt `laouaniFaouzi/interfaze-site` : Next.js 16, Supabase, Vercel) enregistre les demandes des formulaires (`leads`) et publie les suivis clients (`trackers`, `tracker_phases`, `tracker_tasks`) sur un lien privé `/suivi/<code>`, lu par la fonction `get_tracker()`.

**Objectif** : construire **HubFaze**, le CRM d'Interfaze, à partir de Twenty (fork `laouaniFaouzi/twenty`), auto-hébergé, qui :

1. transforme chaque demande du site en contact et opportunité, avec une tâche de réponse sous 48 h ;
2. suit le pipeline commercial jusqu'à la signature ;
3. gère les projets clients et leurs suivis, synchronisés dans les deux sens avec le site ;
4. gère la maintenance récurrente ;
5. donne une vue de pilotage de l'agence.

**Critères de succès**

- Une demande envoyée sur interfaze.fr apparaît dans HubFaze en moins d'une minute.
- Une tâche de suivi modifiée d'un côté est visible de l'autre en moins d'une minute, et en 15 minutes au plus si un appel se perd.
- Le tableau de bord dit où en est l'agence sans ouvrir Supabase.

**Hors périmètre** : génération de devis ou de factures en PDF, comptabilité, comptes clients dans HubFaze, renommage du code interne de Twenty, changement des couleurs de l'interface, construction de l'admin du site (lots 5 et 6 du site, qui restent un chantier du site).

## 2. Décisions

| Sujet | Décision |
|---|---|
| Base | Fork de Twenty, renommé **HubFaze** dans tout ce que l'équipe voit |
| Hébergement | **Auto-hébergé**, `crm.interfaze.fr`, Docker Compose sur un VPS |
| Logique métier | Une **app Twenty « Interfaze »** : `packages/twenty-apps/internal/interfaze` |
| Référence des demandes | **HubFaze**. Le statut reste modifiable dans l'admin du site, mais n'agit sur HubFaze que vers l'avant (§5.3) |
| Référence des suivis | **Les deux** : HubFaze et l'admin du site. La modification la plus récente l'emporte |
| Site vers HubFaze | Triggers Postgres et `pg_net` vers une route HTTP de l'app, avec un secret partagé |
| HubFaze vers site | Déclencheurs d'événements de l'app et API REST Supabase (clé secrète) |
| Filet de sécurité | Rapprochement complet toutes les 15 minutes |
| Renommage | Ce que l'équipe voit. Les noms internes (`twenty-*`, variables, API) ne changent pas |
| Langue | Libellés en français, noms techniques en anglais (convention Twenty) |
| Droits | Toute l'équipe a les mêmes droits, comme dans l'admin du site |

## 3. Architecture

```
interfaze.fr (Next.js) ──écrit──▶ Supabase ──trigger + pg_net (secret)──▶ HubFaze / app Interfaze
                                     ▲                                             │
                                     └──────────── API REST Supabase ◀─────────────┘
                              + rapprochement complet toutes les 15 minutes
```

Trois blocs :

1. **HubFaze** : le fork de Twenty renommé (§7). Il tourne sur une image Docker construite depuis le fork (§9).
2. **L'app « Interfaze »** dans HubFaze : objets métier, champs ajoutés aux objets standard, vues, tableau de bord, automatismes et synchro. Elle suit le modèle des apps existantes du dépôt (`internal/real-estate` pour le modèle de données et le tableau de bord, `public/fireflies` pour le couple webhook et tâche planifiée).
3. **Côté site** : des migrations Supabase dans `interfaze-site` (colonnes de synchro et triggers). Aucune page du site ne change. Comme tout passe par la base, l'admin du site, quand il sera construit, sera synchronisé sans travail supplémentaire.

Les triggers et les déclencheurs sont la voie rapide (quelques secondes). Le rapprochement garantit que les deux côtés finissent identiques, même si un appel se perd ou si un côté est en panne.

## 4. Modèle de données

Les champs « techniques » servent à la synchro. Ils ne figurent dans aucune vue de l'app.

### 4.1 Objets standard enrichis

**Opportunité** (`opportunity`)

| Champ | Libellé | Type | Valeurs |
|---|---|---|---|
| `interfazeStage` | Étape | SELECT | `NEW_REQUEST` Nouvelle demande, `DISCUSSION` Échange, `QUOTE_SENT` Devis envoyé, `WON` Signé, `LOST` Perdu |
| `need` | Besoin | SELECT | `PROBLEM` Problème à régler, `WEB` WebFaze, `SHOP` ShopFaze, `APP` AppFaze, `SMART` SmartFaze |
| `offer` | Offre | SELECT | `WEB`, `SHOP`, `APP`, `SMART`. Pré-remplie depuis le besoin quand il ne vaut pas `PROBLEM` |
| `requestSource` | Source | SELECT | `HOME` Accueil, `CONTACT` Contact, `OFFER_WEB`, `OFFER_SHOP`, `OFFER_APP`, `OFFER_SMART` (pages offres) |
| `timing` | Délai | SELECT | `ASAP` Dès que possible, `ONE_TO_THREE_MONTHS` 1 à 3 mois, `NO_DATE` Pas de date |
| `requestMessage` | Message | TEXT | |
| `requestRef` | Réf. demande | TEXT | `IFZ-123456-1234` |
| `receivedAt` | Reçue le | DATE_TIME | |
| `osezIa` | Osez l'IA | SELECT | `NOT_CONCERNED` Non concerné, `TO_CHECK` À vérifier, `ELIGIBLE` Éligible, `FILED` Dossier déposé, `GRANTED` Accordé, `REFUSED` Refusé |
| `lostReason` | Motif de perte | SELECT | `PRICE` Prix, `TIMING` Délai, `NO_ANSWER` Sans réponse, `COMPETITOR` Concurrent, `ABANDONED` Projet abandonné, `OTHER` Autre |
| `responseOverdue` | Sans réponse après 48 h | BOOLEAN | Technique, seulement si nécessaire (§6.2) |
| `siteLeadId`, `siteLeadStatusSeen` | | TEXT | Techniques |

Champs standard réutilisés : `amount` (prix du devis), `closeDate` (date de signature), `pointOfContact`, `company`, `owner` (référent). L'étape standard `stage` n'apparaît pas dans les vues de l'app, comme dans l'app `real-estate` (`buyerStage`).

Correspondances avec `leads` : `need` `probleme|web|shop|app|smart` vers `PROBLEM|WEB|SHOP|APP|SMART` ; `source` `accueil|contact|offre:web|offre:shop|offre:app|offre:smart` vers `HOME|CONTACT|OFFER_WEB|OFFER_SHOP|OFFER_APP|OFFER_SMART` ; `timing` `asap|1-3-mois|sans-date` vers `ASAP|ONE_TO_THREE_MONTHS|NO_DATE`.

**Société** (`company`) : `clientStatus` « Statut client », SELECT `PROSPECT` Prospect (par défaut), `CLIENT` Client, `FORMER_CLIENT` Ancien client.

**Personne** (`person`) : aucun ajout. E-mail et téléphone existent déjà.

### 4.2 Nouveaux objets

**Projet** (`project`)

| Champ | Libellé | Type |
|---|---|---|
| `name` | Nom | TEXT, par défaut « Société · Offre » |
| `company` | Société | relation vers Société |
| `opportunity` | Opportunité d'origine | relation vers Opportunité |
| `offer` | Offre | SELECT `WEB`, `SHOP`, `APP`, `SMART` |
| `owner` | Référent | relation vers membre de l'espace |
| `status` | Statut | SELECT `IN_PROGRESS` En cours, `LAUNCHED` Mis en ligne, `ARCHIVED` Archivé |
| `price` | Prix | CURRENCY |
| `announcedLaunchDate` | Mise en ligne annoncée | DATE |
| `launchedAt` | Mise en ligne réelle | DATE |
| `progress` | Avancement | NUMBER (0 à 100), calculé |
| `currentPhase` | Phase en cours | TEXT, calculé |
| `trackerUrl` | Lien de suivi client | LINKS |
| `siteTrackerId`, `siteUpdatedAt`, `syncHash` | | techniques |

**Phase** (`projectPhase`) : `name` Nom, `position` Position, `project` Projet, champs techniques `siteId`, `siteUpdatedAt`, `syncHash`.

**Tâche de suivi** (`projectTask`)

| Champ | Libellé | Type |
|---|---|---|
| `name` | Nom | TEXT |
| `description` | Description | TEXT |
| `status` | Statut | SELECT `TODO` À faire, `DOING` En cours, `DONE` Fait |
| `position` | Position | NUMBER |
| `phase` | Phase | relation vers Phase |
| `project` | Projet | relation vers Projet, remplie automatiquement depuis la phase |
| `assignee` | Responsable | relation vers membre de l'espace. **Interne, jamais envoyé au site** |
| `dueDate` | Échéance | DATE. **Interne, jamais envoyé au site** |
| `siteId`, `siteUpdatedAt`, `syncHash` | | techniques |

Les tâches de suivi sont séparées des Tâches standard de Twenty. Ce que voit le client (la checklist du suivi) est distinct des tâches internes (« relancer », « rappeler », « répondre sous 48 h »), qui restent des Tâches standard. Une tâche interne ne peut donc jamais apparaître sur `/suivi/<code>`.

**Contrat de maintenance** (`maintenanceContract`)

| Champ | Libellé | Type |
|---|---|---|
| `name` | Nom | TEXT |
| `company` | Société | relation vers Société |
| `project` | Projet | relation vers Projet |
| `contractType` | Type | SELECT `HOSTING` Hébergement, `MAINTENANCE` Maintenance, `HOSTING_AND_MAINTENANCE` Hébergement + maintenance, `EVOLUTIONS` Évolutions |
| `monthlyAmount` | Montant mensuel | CURRENCY. Équivalent mensuel, même pour une facturation annuelle |
| `billingPeriod` | Facturation | SELECT `MONTHLY` Mensuelle, `YEARLY` Annuelle |
| `startDate` | Début | DATE |
| `renewalDate` | Renouvellement | DATE |
| `status` | Statut | SELECT `ACTIVE` Actif, `TERMINATED` Résilié |
| `renewalTaskCreatedFor` | | DATE, technique |

**Journal de synchro** (`syncLog`) : `occurredAt` Date, `direction` Sens (`SITE_TO_CRM`, `CRM_TO_SITE`, `RECONCILIATION`), `entity` Élément (`LEAD`, `TRACKER`, `PHASE`, `TASK`), `siteId`, `recordId`, `error` Erreur. Seuls les échecs y sont notés. Les entrées de plus de 90 jours sont supprimées par le rapprochement.

Pas d'objet « Demande » : une demande du site devient directement une opportunité qui porte tout son contenu.

### 4.3 Modèles de suivi par offre

Les phases reprennent les quatre étapes de chaque offre (`content/offres.ts` du site). Les tâches sont écrites pour le client, qui les lit sur `/suivi/<code>`. Le modèle vit dans un seul fichier de l'app. Le lot 6 du site, qui prévoit `content/tracker-templates.ts`, recopie cette liste.

| Offre | Phase | Tâches |
|---|---|---|
| WebFaze | On échange | Premier échange · Objectifs et contenus définis |
| | Vous validez le design | Maquettes présentées · Design validé |
| | On le construit | Pages développées · Textes et images intégrés · Référencement Google configuré |
| | Mise en ligne | Recette avec vous · Site en ligne · Prise en main |
| ShopFaze | On échange | Premier échange · Catalogue et façon de vendre définis |
| | Design & configuration | Boutique Shopify configurée · Design adapté à votre marque |
| | Catalogue & paiement | Fiches produits créées · Paiement configuré · Livraison configurée |
| | Lancement à vos côtés | Commande test · Boutique en ligne · Prise en main |
| AppFaze | Cadrage | Atelier de cadrage · Périmètre et priorités validés |
| | Conception | Parcours validés · Écrans validés |
| | Développement | Première version · Points d'étape · Tests |
| | Livraison | Mise en production · Prise en main |
| SmartFaze | Repérage | Analyse de votre quotidien · Tâches à automatiser identifiées |
| | Priorités & financement | Plan d'action chiffré · Éligibilité « Osez l'IA » vérifiée |
| | Mise en place | Automatisations en place · Assistants IA intégrés à vos outils |
| | Prise en main | Formation des équipes · Bilan |

## 5. Synchronisation avec le site

### 5.1 Migrations côté site

Deux fichiers dans `interfaze-site/supabase/migrations/`, un par lot (demandes au lot 2, suivis au lot 3), même construction :

- colonne `crm_id uuid unique` (nullable) sur `leads`, `trackers`, `tracker_phases`, `tracker_tasks` ;
- colonne `updated_at timestamptz not null default now()` et trigger `set_updated_at` sur `leads` et `tracker_phases`, qui n'en ont pas ;
- extension `pg_net` ;
- fonction `public.notify_hubfaze()` (SECURITY DEFINER, `search_path = ''`) :
  - elle ne fait rien si l'en-tête de requête `x-sync-origin` vaut `hubfaze` (lu dans `current_setting('request.headers', true)`, que PostgREST renseigne). C'est ce qui empêche les boucles ;
  - sinon elle appelle `net.http_post` vers l'URL de HubFaze, avec le corps `{ table, type, record, old_record }` et l'en-tête `x-hubfaze-secret`. L'URL et le secret sont lus dans Supabase Vault (`hubfaze_webhook_url`, `hubfaze_webhook_secret`) ;
- triggers `AFTER INSERT OR UPDATE OR DELETE ... FOR EACH ROW` sur les quatre tables.

Aucun nouveau droit pour `anon` ni `authenticated`. `get_tracker()` ne change pas et n'expose pas `crm_id`. `pg_net` est asynchrone : l'envoi d'un formulaire n'est pas ralenti, même si HubFaze ne répond pas.

### 5.2 Route d'entrée dans HubFaze

Une fonction logique de l'app avec un déclencheur HTTP (`site-webhook`). Elle compare `x-hubfaze-secret` au secret de l'app en temps constant, rejette en 401 en cas d'écart, puis traite selon `table` et `type`. Toute erreur de traitement est notée dans le Journal de synchro.

### 5.3 Demandes

**Demande créée sur le site**

1. Si une opportunité porte déjà ce `siteLeadId`, rien à faire (idempotence).
2. **Personne** : recherche par e-mail, sans tenir compte de la casse. Sinon création : prénom = premier mot du nom, nom = le reste ; téléphone s'il est fourni.
3. **Société** : si le champ société est rempli, recherche par nom (sans casse, sans accents, espaces retirés), sinon création en Prospect. La personne y est rattachée si elle n'a pas de société.
4. **Opportunité ouverte existante** (étape Nouvelle demande, Échange ou Devis envoyé) pour cette personne : la demande y est ajoutée comme Note « Nouvelle demande IFZ-… » avec son contenu, sans nouvelle opportunité.
5. Sinon, **création de l'opportunité** : nom « Société ou Nom · Besoin », étape Nouvelle demande, besoin, offre, source, délai, message, référence, reçue le (`created_at`), contact, société, propriétaire = responsable des demandes, `siteLeadId`. Le `crm_id` est recopié sur la demande.
6. Dans les deux cas, une **Tâche** standard « Répondre à Nom · IFZ-… » est créée, avec une échéance à `created_at` + 48 h, assignée au responsable des demandes, liée à l'opportunité et à la personne.

**Étape modifiée dans HubFaze** : `leads.status` est mis à jour (`NEW_REQUEST` → `new`, `DISCUSSION` ou `QUOTE_SENT` → `in_progress`, `WON` ou `LOST` → `done`). Quand l'opportunité quitte Nouvelle demande, la tâche « Répondre à … » passe à Fait.

**Statut modifié sur le site** (vers l'avant seulement, comparé à `siteLeadStatusSeen`, mis à jour à chaque fois) :

- `new` → `in_progress` : si l'étape est Nouvelle demande, elle passe à Échange. Sinon, rien.
- passage à `done` : si l'étape n'est ni Signé ni Perdu, une tâche « Demande IFZ-… clôturée sur le site : passer en Signé ou Perdu » est créée pour le référent, une seule fois.
- retour en arrière : ignoré.

**Demande supprimée sur le site** (purge automatique après 3 ans, promise par la politique de confidentialité) : si l'opportunité n'est pas Signé, elle est supprimée, ainsi que la personne et la société quand elles n'ont aucune autre opportunité, aucun projet et aucun contrat. Si elle est Signé, elle est conservée : la donnée relève alors de la relation client. Le rapprochement applique la même règle aux opportunités dont la demande a disparu et dont la date de réception dépasse 3 ans.

### 5.4 Suivis

| Site | HubFaze |
|---|---|
| `trackers.client_name` | nom de la société du projet (à défaut, nom du projet) |
| `trackers.offer` | `offer` |
| `trackers.is_active` | `status` différent de Archivé |
| `trackers.token` | généré par HubFaze à la création (24 octets aléatoires en base64url, soit 32 caractères) ; `trackerUrl` = adresse du site + `/suivi/` + code |
| `tracker_phases.name`, `position` | Phase `name`, `position` |
| `tracker_tasks.name`, `description`, `position` | Tâche de suivi `name`, `description`, `position` |
| `tracker_tasks.status` `todo` / `doing` / `done` | `TODO` / `DOING` / `DONE` |

- **Projet créé dans HubFaze** avec une offre : création du suivi, puis de ses phases et tâches. Un projet sans offre n'est pas envoyé tant que l'offre n'est pas choisie, car Supabase l'exige.
- **Suivi créé dans l'admin du site** : création du projet, En cours, rattaché à la société du même nom (comparaison sans casse ni accents), créée en Client si elle n'existe pas.
- **Code régénéré sur le site** : `trackerUrl` est mis à jour.
- **Suppressions** : supprimer une phase ou une tâche d'un côté la supprime de l'autre. Supprimer un projet dans HubFaze archive le suivi (`is_active = false`), sans rien effacer. Un suivi supprimé sur le site archive le projet dans HubFaze.

**Échos et conflits**

- Les écritures de HubFaze vers Supabase portent l'en-tête `x-sync-origin: hubfaze`, et le trigger ne les renvoie pas.
- Quand HubFaze applique une modification venue du site, il enregistre `siteUpdatedAt` et `syncHash` (empreinte des champs synchronisés). L'événement que HubFaze émet ensuite pour cette écriture recalcule l'empreinte : si elle est identique, rien n'est renvoyé.
- Un événement qui ne touche que des champs internes (responsable, échéance, champs calculés ou techniques) n'est pas envoyé.
- Une modification venue du site dont `updated_at` est antérieur à `siteUpdatedAt` est ignorée (arrivée en retard).
- En cas de conflit, la modification la plus récente l'emporte, enregistrement par enregistrement.

**Avancement** : après chaque changement de tâche d'un projet, `progress` = arrondi de 100 × tâches faites / tâches (0 sans tâche), et `currentPhase` = nom de la première phase, par position, qui a une tâche non faite, ou « Terminé » si tout est fait. Ces deux champs ne sont pas envoyés au site, qui calcule les siens.

### 5.5 Rapprochement

Une tâche planifiée toutes les 15 minutes :

- lit dans Supabase les suivis actifs et ceux modifiés depuis 30 jours (avec phases et tâches), ainsi que les demandes créées ou modifiées depuis 30 jours ;
- les compare à HubFaze par `crm_id` et identifiant du site : ce qui manque d'un côté est créé, ce qui diffère prend la version la plus récente ;
- applique la règle des 3 ans (§5.3) et purge le Journal de synchro.

Le premier passage en production est un import complet (toutes les demandes et tous les suivis), lancé une fois à la main.

### 5.6 Erreurs et secrets

- Chaque échec est noté dans le Journal de synchro, puis retenté par le rapprochement suivant.
- Variables de l'app : `SUPABASE_URL`, `SUPABASE_SECRET_KEY` (secrète), `HUBFAZE_WEBHOOK_SECRET` (secrète), `SITE_URL` (par défaut `https://interfaze.fr`), `LEAD_OWNER_EMAIL` (responsable des demandes, Lucas par défaut).
- Côté Supabase, l'URL de HubFaze et le secret sont dans Vault.
- La clé secrète Supabase contourne la RLS : elle n'est lue que par les fonctions logiques, côté serveur, jamais par un composant d'interface.
- Rotation du secret : le changer dans Vault et dans les variables de l'app.

## 6. Interface et automatismes

### 6.1 Menu et vues

| Menu | Vues |
|---|---|
| **Pilotage** | Le tableau de bord (§6.2) |
| **Pipeline** | Kanban des opportunités par Étape (par défaut). Liste « Demandes à traiter » : Nouvelle demande, triée par Reçue le |
| **Projets** | Liste « En cours » (offre, référent, avancement, phase en cours, mise en ligne annoncée, lien de suivi). Kanban par statut. Fiche projet avec un onglet **Suivi** (phases et tâches) et un onglet **Contrats** |
| **Tâches de suivi** | « Mes tâches » : kanban par statut, filtré sur le responsable connecté. « En retard » : échéance passée, statut différent de Fait |
| **Maintenance** | « Actifs ». « À renouveler sous 30 jours » |

Personnes et Sociétés restent les objets standard de Twenty.

### 6.2 Tableau de bord « Pilotage »

| Ligne | Widgets |
|---|---|
| 1 | Nouvelles demandes sur 7 jours · Demandes sans réponse après 48 h · Montant signé ce mois · Revenu récurrent mensuel (somme des montants mensuels des contrats actifs) |
| 2 | Pipeline par étape (montants) · Projets en cours par offre |
| 3 | Demandes par source sur 6 mois · Tâches de suivi en retard · Contrats à renouveler sous 30 jours · Erreurs de synchro sur 24 h |

Si les widgets ne savent pas filtrer sur une date relative (« il y a plus de 48 h », « dans les 30 jours »), ils s'appuient sur un champ booléen que la tâche planifiée tient à jour, par exemple `responseOverdue` sur l'opportunité, recalculé toutes les heures. L'affichage ne change pas.

### 6.3 Automatismes

| Déclencheur | Effet |
|---|---|
| Demande reçue sur le site | Personne, société, opportunité, tâche « Répondre à … » (§5.3) |
| Opportunité qui quitte Nouvelle demande | La tâche « Répondre à … » passe à Fait |
| Opportunité qui passe à **Signé** | `closeDate` = aujourd'hui si vide. Société → Client. Projet créé s'il n'en existe pas pour cette opportunité : nom, offre, référent = propriétaire, prix = montant, phases et tâches du modèle (§4.3). Sans offre : tâche « Choisir l'offre de … » pour le propriétaire, et le projet est créé quand l'offre est renseignée |
| Tâche de suivi créée ou modifiée | Projet rempli depuis la phase, avancement et phase en cours recalculés |
| **Mise en ligne réelle** renseignée | Projet → Mis en ligne. Tâche « Proposer un contrat de maintenance à … » pour le référent |
| Chaque jour à 7 h | Pour chaque contrat actif dont le renouvellement tombe dans les 30 jours et dont `renewalTaskCreatedFor` diffère de `renewalDate` : tâche « Renouveler le contrat … », échéance au renouvellement, pour le référent du projet (à défaut, le responsable des demandes), puis `renewalTaskCreatedFor` = `renewalDate` |

Le statut Ancien client se met à la main.

## 7. Renommage HubFaze

**Ce qui change**

- Le nom **HubFaze** : titre de l'onglet (`title-utils`), écrans de connexion et d'inscription, accueil et première configuration, page 404, nom d'espace par défaut, auteur « système » de l'historique des fiches, page Communauté des paramètres.
- Les logos et icônes : favicon, icônes d'app et `manifest.json` (nom et nom court), logo des écrans de connexion, logo d'espace par défaut. Logo provisoire : l'**astérisque Interfaze** (orange `#FF4D23` sur bleu nuit `#08131D`), avec « HubFaze » écrit en Syne.
- Les e-mails (`twenty-emails`, et les objets envoyés par le serveur : invitation, vérification, réinitialisation…) : nom, logo et objet.
- Les liens légaux du bas de l'écran de connexion pointent vers `interfaze.fr/mentions-legales` et `interfaze.fr/confidentialite`.

**Construction**

- Une **constante de marque unique** dans `twenty-shared` (nom, URL du code source, URL des mentions légales et de la confidentialité, chemins des logos), utilisée par l'interface, le serveur et les e-mails. Tous les textes visibles concernés passent par elle.
- Les catalogues de traduction **français et anglais** des messages touchés sont mis à jour. Les autres langues retombent sur l'anglais, qui dit aussi HubFaze.
- Un **script de contrôle** échoue si « Twenty » réapparaît dans un texte visible de `twenty-front`, `twenty-emails` ou des e-mails du serveur, hors d'une liste d'exceptions (liens de documentation, mentions de licence). Il tourne en CI et après chaque récupération des versions de Twenty.
- Une page `BRANDING.md` décrit la procédure de mise à jour depuis Twenty.

**Ce qui ne change pas** : les noms internes (paquets, dossiers, variables d'environnement, API), les liens d'aide vers la documentation Twenty, les écrans de facturation, d'offre Entreprise et de DPA (réservés au Twenty Cloud et absents en auto-hébergé), les couleurs de l'interface.

**Licence AGPL** : le fichier `LICENSE` et les mentions de copyright sont conservés. Un lien **« Code source »** vers le fork GitHub est ajouté dans les paramètres, comme l'exige la licence pour un logiciel utilisé en réseau.

## 8. Tests

- **Unitaires** (Vitest, comme les autres apps) :
  - conversion demande → personne, société, opportunité (dont le découpage du nom et la recherche sans casse ni accents) ;
  - correspondances étape / statut et règle « vers l'avant » ;
  - modèles par offre ;
  - avancement et phase en cours ;
  - « la plus récente l'emporte », modification en retard ignorée, détection des échos par empreinte ;
  - génération du code de suivi ;
  - tâche de renouvellement créée une seule fois ;
  - règle des 3 ans.
- **Intégration** (sur le modèle de `public/linear` et `public/fireflies`), avec un HubFaze local et un Supabase local (`supabase start` dans `interfaze-site`) :
  - installation de l'app ;
  - webhook refusé sans le bon secret ;
  - une demande crée ses fiches ;
  - une tâche cochée dans HubFaze arrive dans Supabase, et l'inverse ;
  - le rapprochement répare un appel perdu.
- **Base de données côté site** (`npm run test:db`) :
  - le trigger met l'appel en file (`net.http_request_queue`) ;
  - il ne le fait pas avec l'en-tête `x-sync-origin: hubfaze` ;
  - les règles d'accès ne changent pas : un visiteur ne lit ni `leads` ni `trackers`.
- **Renommage** : script de contrôle, lint, vérification TypeScript et tests existants de Twenty, capture de l'écran de connexion.
- **Recette en production** :
  1. une demande envoyée sur interfaze.fr apparaît dans HubFaze en moins d'une minute ;
  2. l'opportunité passe en Signé, ce qui crée le projet et le suivi ;
  3. une tâche cochée dans HubFaze arrive dans Supabase, puis une modification faite côté site revient dans HubFaze.

## 9. Mise en production

- **Serveur** : un VPS d'au moins 2 vCPU, 4 Go de RAM et 40 Go de disque, hébergé dans l'Union européenne, avec Docker Compose repris de `packages/twenty-docker` (serveur, worker, Postgres, Redis).
- **Image** : `ghcr.io/laouanifaouzi/hubfaze`, construite par GitHub Actions depuis le fork, à chaque version étiquetée.
- **Adresse** : `crm.interfaze.fr` en HTTPS (reverse proxy et certificat Let's Encrypt). E-mails par Resend, comme ceux du site.
- **Sauvegardes** : dump Postgres quotidien envoyé hors du serveur, conservé 30 jours. Une restauration est testée avant l'ouverture.
- **App** : installée avec le CLI du SDK, puis réglages saisis (§5.6).
- **Supabase de production** : migrations appliquées, URL et secret de HubFaze dans Vault, puis import complet (§5.5).
- **Site** : la page Confidentialité ajoute l'hébergeur du VPS à la liste des sous-traitants.
- **Mises à jour** : récupération régulière des versions de Twenty dans le fork, script de contrôle de la marque, nouvelle image, déploiement.

## 10. Ordre de construction (lots)

Chaque lot est validé avant le suivant et reçoit son propre plan dans `docs/superpowers/plans/`.

| Lot | Contenu | Fini quand |
|---|---|---|
| 1. Modèle, pipeline et vues | App `interfaze` : objets et champs (§4), modèles (§4.3), vues et menu (§6.1), automatismes internes (signature, avancement) | On crée une opportunité à la main, on la signe, et le projet apparaît avec ses phases, ses tâches et son avancement |
| 2. Demandes | Migration des demandes, route d'entrée, traitement des demandes, étape ↔ statut, tâche 48 h, règle des 3 ans | Une demande insérée dans le Supabase local crée personne, société, opportunité et tâche, et le changement d'étape revient dans `leads.status` |
| 3. Suivis | Migration des suivis, synchro dans les deux sens, rapprochement, Journal de synchro | Une modification faite de chaque côté arrive de l'autre, et un appel coupé est réparé par le rapprochement |
| 4. Maintenance et pilotage | Contrats, mise en ligne, renouvellements, tableau de bord | Le tableau de bord affiche des chiffres justes sur un jeu de données de test |
| 5. HubFaze | Renommage (§7) | Le script de contrôle passe et aucun « Twenty » n'est visible dans les parcours de connexion, d'accueil, de paramètres et d'e-mails |
| 6. Mise en production | §9 | La recette en production (§8) passe |

## 11. Prérequis côté utilisateur

- Un VPS (§9) et l'accès à son hébergeur.
- L'enregistrement DNS `crm.interfaze.fr`.
- Les clés du projet Supabase de production.
- Un accès en écriture pour la session de développement sur `laouaniFaouzi/interfaze-site`, pour y pousser les migrations (lots 2 et 3).
- GitHub Packages activé pour publier l'image.
- Les identifiants SMTP Resend (domaine interfaze.fr déjà vérifié pour le site).
- Les adresses e-mail de Faouzi, Lucas et Léo pour les invitations.

## 12. Points ouverts (sans impact sur le démarrage)

- **Logo HubFaze définitif** : l'astérisque Interfaze sert de logo provisoire.
- **Modèle de prix** (achat, abonnement ou hybride, encore en réflexion d'après la stratégie de message du site) : il peut ajouter des champs aux contrats de maintenance.
- **Conservation des données clients** (« durée de la relation, puis 5 ans » selon la politique de confidentialité) : en V1, HubFaze ne purge pas les clients. Une vue « Anciens clients » à revoir une fois par an suffit au démarrage.
- **Admin du site** : le lot 5 du site garde le changement de statut des demandes (géré par la règle « vers l'avant », §5.3) ; le lot 6 recopie les modèles de suivi (§4.3).
