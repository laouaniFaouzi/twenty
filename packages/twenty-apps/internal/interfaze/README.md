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
| `yarn test:e2e` | Test de bout en bout Playwright des pages |

## Synchro des demandes avec interfaze.fr

Le site poste chaque demande créée, modifiée ou supprimée sur la route `POST /s/hubfaze/site-webhook` (trigger `notify_hubfaze()` du site, via `pg_net`). HubFaze renvoie l'étape des opportunités dans `leads.status` par l'API REST de Supabase.

À régler dans Paramètres → Applications → Interfaze → Variables :

| Variable | Valeur |
| --- | --- |
| `SUPABASE_URL` | URL du projet Supabase du site, sans `/rest/v1` |
| `SUPABASE_SECRET_KEY` | Clé secrète du projet (`sb_secret_…` ou clé `service_role`) |
| `HUBFAZE_WEBHOOK_SECRET` | Secret partagé, identique au secret Vault `hubfaze_webhook_secret` du site |
| `LEAD_OWNER_EMAIL` | E-mail du membre qui reçoit les demandes |

Côté site, dans le SQL Editor de Supabase :

```sql
select vault.create_secret('https://crm.interfaze.fr/s/hubfaze/site-webhook', 'hubfaze_webhook_url');
select vault.create_secret('<le même secret>', 'hubfaze_webhook_secret');
```

Sans ces deux secrets, le site n'envoie rien. Sans les variables, la route répond 503.

Le test `src/__tests__/leads.integration-test.ts` ne tourne que si `SUPABASE_URL`, `SUPABASE_SECRET_KEY` et `HUBFAZE_WEBHOOK_SECRET` sont définis, avec une base du site joignable et des secrets Vault qui visent le serveur de test.
