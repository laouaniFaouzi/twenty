# Marque HubFaze

Ce fork de Twenty s'appelle **HubFaze** dans tout ce que l'équipe d'Interfaze voit. Les noms internes restent ceux de Twenty : paquets, dossiers, variables d'environnement, API, noms de composants et de fichiers. Cela garde les récupérations des versions de Twenty simples.

Conception : `docs/superpowers/specs/2026-11-04-hubfaze-crm-interfaze-design.md` (§8).

## Ce qui porte la marque

| Élément | Où |
| --- | --- |
| Nom, adresses (site, code source, mentions légales, confidentialité, production), chemins des logos, ligne société des e-mails | `BRAND`, dans `packages/twenty-shared/src/constants/Brand.ts` |
| Icônes, favicon, icônes d'app | `packages/twenty-front/public/images/icons/` (générées) |
| Logo des e-mails | `packages/twenty-front/public/images/hubfaze/email-logo.png` (généré), servi par `BRAND.appUrl` |
| Titre de page, manifeste | `packages/twenty-front/index.html`, `packages/twenty-front/public/manifest.json` |
| Traductions françaises des messages de marque | `packages/twenty-utils/branding/brand-translations.ts` |
| Exceptions au contrôle | `packages/twenty-utils/branding/brand-check-exceptions.ts` |

Dans un message traduit, la marque passe toujours par une variable locale `brandName` :

```ts
const brandName = BRAND.name;

t`Welcome to ${brandName}`; // extrait comme « Welcome to {brandName} »
```

Les e-mails, dont les identifiants sont explicites, écrivent `i18n._('Join your team on {brandName}', { brandName: BRAND.name })`.

## Logos

Le logo est provisoire : l'astérisque d'Interfaze, orange `#FF4D23` sur bleu nuit `#08131D`, et « HubFaze » en Syne. Les sources sont dans `packages/twenty-utils/branding/assets/`. `hubfaze-wordmark.svg` contient le texte déjà converti en tracés, pour ne pas dépendre de la police.

Pour régénérer toutes les images après un changement de logo :

```bash
npx tsx packages/twenty-utils/branding/generate-brand-assets.ts
```

Le script réécrit chaque icône à ses dimensions actuelles et produit le logo des e-mails.

## Après chaque récupération des versions de Twenty

1. Fusionner la version de Twenty et résoudre les conflits. Garder `BRAND` partout où Twenty avait écrit son nom. Pour les catalogues (`**/locales/*.po` et `**/locales/generated/*.ts`), prendre la version de Twenty : l'étape 4 y remet les messages de marque et recompile.
2. Reconstruire le paquet partagé :

   ```bash
   npx nx build twenty-shared
   ```

3. Lancer le contrôle de la marque :

   ```bash
   npx nx run twenty-utils:check-branding
   ```

   Chaque « Twenty » qu'il liste se traite selon la règle de tri ci-dessous. Le contrôle vérifie aussi que chaque message de marque est dans tous les catalogues compilés, en français dans `fr-FR`. Sinon, un build de production afficherait une clé brute, comme `gki87D`, à la place du texte. Il tourne aussi en CI (`.github/workflows/ci-branding.yaml`).
4. Remettre les traductions de marque dans les catalogues et les recompiler :

   ```bash
   npx nx run twenty-utils:brand-translations
   ```

   L'outil n'extrait que les fichiers qui utilisent `BRAND`. Il échoue s'il trouve un message de marque sans traduction française, ou une traduction qu'aucun fichier ne produit plus. On complète alors `brand-translations.ts`, puis on relance. Un deuxième passage ne change rien.
5. Ne jamais lancer `lingui extract` sur les vrais catalogues du front ou du serveur. Ils sont en retard sur les sources, car le pipeline de traduction de Twenty les tient à jour, et l'extraction réécrirait des milliers de lignes sans rapport.

## Règle de tri d'un « Twenty » restant

- **Visible par l'équipe, hors écrans exclus** : le remplacer par `BRAND.name`, ou par `brandName` dans un message traduit.
- **Écran ou e-mail du Twenty Cloud** (facturation, offre Entreprise, DPA, rappels d'essai, espace suspendu) : exception. Ces écrans n'existent pas en auto-hébergé.
- **Visible seulement par un développeur** (journal de la console, `User-Agent`) : exception.
- **Mention de licence** : exception. Twenty est sous licence AGPL, et la page Communauté dit sur quel logiciel HubFaze repose, avec le lien vers son code source.

Chaque exception porte sa raison dans `brand-check-exceptions.ts`. Le `LICENSE` et les mentions de copyright ne changent jamais.

## Production

- `EMAIL_FROM_NAME` vaut « HubFaze » par défaut. On le règle dans le `.env` du serveur si l'expéditeur doit être un autre nom.
- Les images des e-mails sont servies par `BRAND.appUrl` (`https://crm.interfaze.fr`). Elles s'affichent une fois ce domaine en ligne.
