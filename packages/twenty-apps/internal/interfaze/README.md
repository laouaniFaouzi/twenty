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
