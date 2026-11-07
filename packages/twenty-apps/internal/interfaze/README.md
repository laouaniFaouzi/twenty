# Interfaze

Couche métier d'Interfaze pour HubFaze : pipeline commercial, projets clients, suivis, pages et maintenance.
L'app ajoute ses objets, ses champs, ses vues et ses automatismes à un espace HubFaze (fork de Twenty).
La conception est décrite dans `docs/superpowers/specs/2026-11-04-hubfaze-crm-interfaze-design.md` à la racine du dépôt.
Chaque lot a son plan dans `docs/superpowers/plans/`.

| Commande | Rôle |
| --- | --- |
| `yarn test:unit` | Tests unitaires |
| `yarn twenty build` | Valide le manifeste et lance la vérification TypeScript, sans serveur |
| `yarn typecheck` | Vérification TypeScript de tout `src` (celle de `yarn twenty build` ne couvre pas les sources) |
| `yarn lint` | Vérification du code |
| `yarn test` | Tests d'intégration contre un serveur lancé (`TWENTY_API_URL`, `TWENTY_API_KEY`) |
| `yarn test:e2e` | Tests de bout en bout Playwright des pages et du tableau de bord (front lancé, `FRONT_BASE_URL`) |

## Maintenance et pilotage

Le tableau de bord **Pilotage** ouvre le menu. Ses fenêtres de dates suivent l'heure de Paris et comptent toujours la période en cours :

| Chiffre | Ce qu'il compte |
| --- | --- |
| Nouvelles demandes sur 7 jours | Opportunités reçues du site aujourd'hui ou les 6 jours d'avant |
| Demandes sans réponse après 48 h | Opportunités encore à Nouvelle demande, reçues il y a plus de 48 h |
| Montant signé ce mois | Montants des opportunités Signé dont la date de signature tombe ce mois-ci |
| Revenu récurrent mensuel | Montants mensuels des contrats actifs |
| Pipeline par étape (montants) | Montants des étapes ouvertes : Nouvelle demande, Échange, Devis envoyé |
| Projets en cours par offre | Projets En cours, par offre |
| Demandes par source sur 6 mois | Opportunités reçues ce mois-ci ou les 5 mois d'avant, par source |
| Tâches de suivi en retard | Tâches de suivi à échéance passée, pas encore faites |
| Contrats à renouveler sous 30 jours | Contrats actifs à renouveler d'ici 30 jours, retards compris |
| Erreurs de synchro sur 24 h | Entrées du Journal de synchro de l'heure en cours et des 23 précédentes |

Les automatismes :

- **Mise en ligne réelle renseignée** : le projet passe à Mis en ligne, et son référent reçoit « Proposer un contrat de maintenance à … ». Pas de tâche si le projet a déjà un contrat actif, ni deux fois pour le même projet.
- **Renouvellements** (`create-renewal-tasks`, tous les jours à 5 h UTC, soit 6 h ou 7 h à Paris) : pour chaque contrat actif à renouveler d'ici 30 jours, retards compris, une tâche « Renouveler le contrat … » échue au jour du renouvellement. Elle va au référent du projet, à défaut au responsable des demandes (`LEAD_OWNER_EMAIL`). Une seule tâche par date de renouvellement : changer la date en ouvre une nouvelle.
- **Demandes sans réponse** (`refresh-response-overdue`, toutes les heures) : tient à jour le champ technique « Sans réponse après 48 h » qu'utilise le tableau de bord. Une demande qui quitte Nouvelle demande sort du chiffre tout de suite, sans attendre ce recalcul.

Le test `src/__tests__/pilotage.integration-test.ts` compare les chiffres du tableau de bord avant et après un jeu de données, avec les mêmes services de graphiques que l'écran. Il suppose une synchro sans erreur pendant qu'il tourne : sans base du site, laisser `SUPABASE_URL` vide.

## Synchro avec interfaze.fr

Le site poste chaque demande, suivi, phase ou tâche de suivi créé, modifié ou supprimé sur la route `POST /s/hubfaze/site-webhook` (trigger `notify_hubfaze()` du site, via `pg_net`). HubFaze renvoie l'étape des opportunités dans `leads.status`, et ses projets, phases et tâches de suivi dans `trackers`, `tracker_phases` et `tracker_tasks`, par l'API REST de Supabase.

- Une modification faite des deux côtés à la fois : la plus récente l'emporte, enregistrement par enregistrement.
- Un suivi supprimé sur le site archive le projet ; un projet supprimé dans HubFaze archive le suivi.
- Chaque échec est noté dans le **Journal de synchro** (objet `syncLog`, vue « Erreurs récentes »), puis retenté par le rapprochement.
- Le **rapprochement** (`reconcile-site`) passe toutes les 15 minutes : suivis actifs ou modifiés depuis 30 jours, demandes modifiées depuis 30 jours, règle des 3 ans, purge du Journal au-delà de 90 jours.
- **Import complet** (mise en production) : exécuter la fonction `reconcile-site` à la main avec le corps `{ "full": true }`.

À régler dans Paramètres → Applications → Interfaze → Variables :

| Variable | Valeur |
| --- | --- |
| `SUPABASE_URL` | URL du projet Supabase du site, sans `/rest/v1` |
| `SUPABASE_SECRET_KEY` | Clé secrète du projet (`sb_secret_…` ou clé `service_role`) |
| `HUBFAZE_WEBHOOK_SECRET` | Secret partagé, identique au secret Vault `hubfaze_webhook_secret` du site |
| `LEAD_OWNER_EMAIL` | E-mail du membre qui reçoit les demandes |
| `SITE_URL` | Adresse du site pour les liens de suivi client (par défaut `https://interfaze.fr`) |

Côté site, dans le SQL Editor de Supabase :

```sql
select vault.create_secret('https://crm.interfaze.fr/s/hubfaze/site-webhook', 'hubfaze_webhook_url');
select vault.create_secret('<le même secret>', 'hubfaze_webhook_secret');
```

Sans ces deux secrets, le site n'envoie rien. Sans les variables, la route répond 503 et rien n'est envoyé au site.

Côté serveur HubFaze, les fonctions de l'app ont droit à `APPLICATION_API_RATE_LIMITING_LIMIT` appels par minute (500 par défaut). Si le Journal de synchro montre des erreurs « Limit reached », relever cette valeur dans le `.env` du serveur.

Les tests `src/__tests__/leads.integration-test.ts` et `src/__tests__/trackers.integration-test.ts` ne tournent que si `SUPABASE_URL`, `SUPABASE_SECRET_KEY` et `HUBFAZE_WEBHOOK_SECRET` sont définis, avec une base du site joignable et des secrets Vault qui visent le serveur de test. Ces tests interrogent souvent l'API avec la clé de test : sur le serveur de test, régler `API_RATE_LIMITING_LONG_LIMIT=1000` (100 appels par minute par défaut).
