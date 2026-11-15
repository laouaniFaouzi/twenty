# Lot 6 · Renommage HubFaze · Plan d'exécution

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tout ce que l'équipe voit dans les parcours de connexion, d'accueil, de paramètres et d'e-mails dit HubFaze, avec le logo provisoire d'Interfaze, et un script de contrôle empêche « Twenty » de revenir.

**Architecture:**
- Une constante `BRAND` dans `twenty-shared` porte le nom, les adresses et les chemins des logos. Le front, les e-mails et le serveur l'utilisent dans leurs messages Lingui (`${brandName}` → `{brandName}`).
- Les catalogues du front et du serveur ne sont pas à jour : `lingui extract` y ferait plus de 8 000 lignes de bruit. Un outil de `twenty-utils/branding` extrait donc seulement les fichiers de marque dans un dossier temporaire. Il ajoute leurs messages, avec leur traduction française, aux catalogues `en` et `fr-FR`, puis lance `lingui compile`. La compilation remplit les autres langues avec l'anglais.
- Un script de contrôle lit les sources par l'arbre syntaxique TypeScript (chaînes, gabarits, textes JSX, hors commentaires et imports). Il échoue si « Twenty » y apparaît hors d'une liste d'exceptions. La CI le lance.
- Les icônes sont régénérées depuis l'astérisque Interfaze par `sharp`, aux mêmes tailles que celles de Twenty.

**Tech Stack:** TypeScript, React (Linaria, Lingui), NestJS, react-email, Jest (`twenty-utils`, `twenty-front`), `typescript` (API du compilateur), `sharp`, `fontkit`, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-04-hubfaze-crm-interfaze-design.md` (§8, §9 « Renommage », §11 lot 6). En plus, Pilotage passe en tête du menu (§6.1, reporté du lot 5).

## Global Constraints

- Règles de `CLAUDE.md` (pas de `any`, types plutôt qu'interfaces, exports nommés, commentaires courts sur le pourquoi, helpers existants, icônes de `twenty-ui`), commits sans mention d'IA, Node 24 (`. …/scratchpad/node24/env.sh`).
- **Ne changent pas** (§8) : noms internes (paquets, dossiers, variables d'environnement, API, noms de composants et de fichiers), liens d'aide vers la documentation Twenty, écrans de facturation, d'offre Entreprise et de DPA, couleurs de l'interface, `LICENSE` et mentions de copyright.
- **Valeurs** (§8) : nom `HubFaze` ; mentions légales `https://interfaze.fr/mentions-legales` ; confidentialité `https://interfaze.fr/confidentialite` ; code source `https://github.com/laouaniFaouzi/twenty` ; logo provisoire = astérisque Interfaze orange `#FF4D23` sur bleu nuit `#08131D`, « HubFaze » en Syne ; adresse de production `https://crm.interfaze.fr` (§10).
- **Jamais `lingui extract` sur les vrais catalogues** du front ou du serveur. Seuls `en.po` et `fr-FR.po` sont modifiés à la main, par l'outil de la tâche 5. Les fichiers `locales/generated/*` changent seulement par `lingui compile`. Au serveur, la compilation ajoute aussi 4 clés déjà présentes dans les `.po` : c'est attendu.
- Après toute modification de `twenty-shared` : `npx nx build twenty-shared --skip-nx-cache`.
- **Contrôles par paquet touché** : tests Jest des fichiers modifiés (`npx jest <fichiers> --config=packages/<pkg>/jest.config.mjs`), `npx tsgo -p tsconfig.json --noEmit` dans le paquet, `npx nx lint:diff-with-main <pkg>`.

## Choix faits là où la spec se tait

- **Règle de tri des « Twenty » restants** : visible par l'équipe hors écrans exclus → renommé par `BRAND`. Écran du Twenty Cloud (facturation, Entreprise, DPA, rappels d'essai, espace suspendu) → exception. Visible seulement par un développeur (journal console, `User-Agent`) → exception. Mention de licence → exception.
- **Page Communauté** : les liens Discord, X et partenaires de Twenty disparaissent (« Join our Discord » serait faux pour HubFaze). À leur place, une section « Code source » : HubFaze repose sur Twenty, logiciel libre sous licence AGPL, avec le lien vers le fork. C'est le lien « Code source » de §8. La section Fonctionnalités (bêta) et le lien vers le journal des versions de Twenty restent.
- **Pied de connexion** : « En utilisant HubFaze, vous acceptez les mentions légales et la politique de confidentialité », avec les liens d'interfaze.fr. Le lien DPA (offre Cloud) ne change pas.
- **E-mails** :
  - en-tête : logo HubFaze, avec le mot « HubFaze » en Syne ;
  - pied : site d'Interfaze et code source, plus la ligne « Interfaze · Tomblaine (Nancy) » ;
  - les liens de documentation Twenty quittent le pied de page.
  - Les images des e-mails sont servies par `https://crm.interfaze.fr`. Elles ne s'affichent qu'une fois la production en ligne (lot 7).
- **Expéditeur par défaut** : `EMAIL_FROM_NAME` passe de « Felix from Twenty » à « HubFaze ».
- **Code 2FA** : l'émetteur affiché dans l'application d'authentification devient « HubFaze - <espace> ».
- **Hors contrôle** : le nom du serveur MCP côté API et les descriptions de configuration du serveur restent (API, §8). Le contrôle couvre le front, les e-mails et les fichiers du serveur qui envoient des e-mails.

## Review Focus

- **Traduction perdue** : un message renommé change de clé. Si la clé calculée ne correspond pas à celle du code, un utilisateur français voit de l'anglais. L'outil échoue sur tout message de marque sans traduction, et la tâche 5 vérifie chaque clé dans `generated/fr-FR.ts`.
- **Autres langues** : un utilisateur en allemand ne doit jamais voir une clé brute. La tâche 5 vérifie que `generated/de-DE.ts` contient les nouvelles clés en anglais.
- **Faux négatifs du contrôle** : « Twenty » dans un attribut JSX (`alt`, `aria-label`), un gabarit à variables, un enfant de `<Trans>`, `index.html` ou `manifest.json`. Chaque cas a son test (tâche 2).
- **Retour de « Twenty » après une récupération des versions de Twenty** : la CI lance le contrôle, et `BRANDING.md` dit dans quel ordre relancer l'outil de traduction et le contrôle.
- **Logo par défaut** : un espace sans logo affiche l'astérisque HubFaze dans le sélecteur d'espaces et l'onglet, jamais l'image de Twenty (tâche 3).

---

### Task 1: Constante de marque et logos

**Files:**
- Create: `packages/twenty-shared/src/constants/Brand.ts`, `packages/twenty-shared/src/constants/__tests__/Brand.test.ts`
- Create: `packages/twenty-utils/branding/assets/asterisk.svg`, `packages/twenty-utils/branding/assets/hubfaze-wordmark.svg`
- Create: `packages/twenty-utils/branding/brand-assets.ts`, `packages/twenty-utils/branding/generate-brand-assets.ts`, `packages/twenty-utils/branding/__tests__/brand-assets.test.ts`
- Modify: every PNG under `packages/twenty-front/public/images/icons/` (regenerated), `packages/twenty-front/public/manifest.json`, `packages/twenty-front/index.html`
- Create: `packages/twenty-front/public/images/hubfaze/email-logo.png`

**Interfaces:**
- Produces `BRAND` (exporté par `twenty-shared/constants`, `as const`) :
  - `name: 'HubFaze'`, `appUrl: 'https://crm.interfaze.fr'` ;
  - `websiteUrl: 'https://interfaze.fr'`, `sourceCodeUrl: 'https://github.com/laouaniFaouzi/twenty'` ;
  - `legalNoticeUrl: 'https://interfaze.fr/mentions-legales'`, `privacyPolicyUrl: 'https://interfaze.fr/confidentialite'` ;
  - `logoPath: '/images/icons/android/android-launchericon-192-192.png'`, `emailLogoPath: '/images/hubfaze/email-logo.png'` ;
  - `companyLine: 'Interfaze · Tomblaine (Nancy)'`.
- Produces `BRAND_COLORS = { asterisk: '#FF4D23', background: '#08131D' }` and `buildIconSvg(size: number): string` in `brand-assets.ts`. The icon is a `#08131D` square with the asterisk centred at 64 % of the side.

- [ ] **Step 1: Tests**
  - `Brand.test.ts` : `BRAND` contient exactement les valeurs ci-dessus.
  - `brand-assets.test.ts`, pour `buildIconSvg(192)` :
    - `width="192"` et `height="192"` ;
    - un rectangle plein `#08131D` ;
    - le tracé de l'astérisque en `#FF4D23`, mis à l'échelle de 192 × 0,64 ;
    - aucune métadonnée `c2pa`.
- [ ] **Step 2: Run, they fail** :
  - `npx jest packages/twenty-shared/src/constants/__tests__/Brand.test.ts --config=packages/twenty-shared/jest.config.mjs`, ou la config de test de `twenty-shared` si elle diffère ;
  - `npx jest packages/twenty-utils/branding --config=packages/twenty-utils/jest.config.mjs`.
- [ ] **Step 3: Implement**
  - `asterisk.svg` : le tracé de `interfaze-site/public/logo-asterisque.svg`, sans le bloc `<metadata>`.
  - `hubfaze-wordmark.svg` : l'astérisque, puis « HubFaze » en tracés.
    - Les tracés sont produits une fois avec `fontkit` depuis `interfaze-site/assets/fonts/Syne-Bold.woff`. La police n'est pas copiée dans le dépôt.
    - Texte en `#08131D` sur fond transparent, pour les e-mails à fond blanc.
  - `generate-brand-assets.ts` (lancé par `npx tsx`) :
    - réécrit chaque PNG de `public/images/icons` à ses dimensions actuelles, lues avec `sharp` ;
    - écrit `email-logo.png` : le mot-symbole à 80 px de haut, affiché à 40.
  - `manifest.json` : `name` et `short_name` à `HubFaze`, `theme_color` et `background_color` à `#08131D`.
  - `index.html` : `<title>`, `og:title` et `twitter:title` à `HubFaze`. Les deux images sociales de Twenty sont retirées.
- [ ] **Step 4: Run** :
  - les deux tests passent ;
  - le script affiche le nombre d'images réécrites, égal au nombre de PNG du dossier ;
  - `npx nx build twenty-shared --skip-nx-cache` passe ;
  - l'icône 192 et l'en-tête des e-mails, ouverts à l'écran, montrent l'astérisque orange sur bleu nuit et le mot HubFaze.
- [ ] **Step 5: Commit** : `Add the HubFaze brand constant and the provisional Interfaze logo`

### Task 2: Script de contrôle de la marque

**Files:**
- Create: `packages/twenty-utils/branding/find-brand-violations.ts`, `packages/twenty-utils/branding/brand-check-exceptions.ts`, `packages/twenty-utils/branding/check-branding.ts`
- Create: `packages/twenty-utils/branding/__tests__/find-brand-violations.test.ts`
- Modify: `packages/twenty-utils/project.json` (cible `check-branding`)
- Create: `.github/workflows/ci-branding.yaml`

**Interfaces:**
- Produces :
  - `type BrandViolation = { file: string; line: number; text: string }` ;
  - `findSourceViolations(file: string, source: string): BrandViolation[]` pour `.ts` et `.tsx`, par l'API du compilateur `typescript`.
    - Lit : `StringLiteral`, `NoSubstitutionTemplateLiteral`, les morceaux de `TemplateExpression` et `JsxText`.
    - Ignore les spécificateurs d'import et d'export.
    - Motif : `/\bTwenty\b/`, sensible à la casse. Les adresses en minuscules (`twenty.com`) passent.
  - `findMarkupViolations(file: string, source: string): BrandViolation[]` pour `.html`, sans les commentaires `<!-- -->` ni les blocs `<script>`, et pour `.json`, sur les valeurs texte.
  - `type BrandCheckException = { path: string; text?: string; reason: string }` :
    - `path` : fichier relatif au dépôt, ou dossier terminé par `/` ;
    - sans `text`, tout le chemin est exclu.
  - `BRAND_CHECK_EXCEPTIONS: BrandCheckException[]` ;
  - `isExcepted(violation: BrandViolation, exceptions: BrandCheckException[]): boolean`.
- `check-branding.ts` parcourt :
  - `packages/twenty-front/src` (`.ts`, `.tsx`), avec `twenty-front/index.html` et `twenty-front/public/manifest.json` ;
  - `packages/twenty-emails/src` ;
  - les fichiers de `packages/twenty-server/src` qui importent `twenty-emails`.
  - Il saute :
    - les dossiers `__tests__`, `__stories__`, `__mocks__`, `testing`, `locales`, `generated` ;
    - les fichiers `*.test.*`, `*.spec.*`, `*.stories.*`.
  - Il affiche `chemin:ligne: "texte"` par violation, le total, et sort en 1 s'il en reste.
- Exceptions de départ, chacune avec sa raison :
  - dossiers :
    - `packages/twenty-front/src/modules/settings/billing/` ;
    - `packages/twenty-front/src/pages/settings/enterprise/` ;
    - `packages/twenty-front/src/modules/settings/legal/` ;
    - `packages/twenty-front/src/pages/settings/legal/` ;
    - `packages/twenty-server/src/engine/core-modules/billing/` ;
  - fichiers :
    - `packages/twenty-emails/src/emails/billing-trial-converting.email.tsx` ;
    - `packages/twenty-emails/src/emails/clean-suspended-workspace.email.tsx` ;
  - textes :
    - `'Twenty'` de `packages/twenty-front/src/modules/apollo/services/apollo.factory.ts` (journal console) ;
    - la phrase de licence de la page Communauté (tâche 3).

- [ ] **Step 1: Tests** (`find-brand-violations.test.ts`) :
  - `it('flags Twenty in a t template, a Trans child, a JSX attribute and a string literal')` : quatre violations, numéros de ligne compris.
  - `it('flags the static parts of a template with variables')` : `` `Join ${team} on Twenty` ``.
  - `it('ignores comments, imports and lowercase addresses')` : `// Twenty`, `import x from 'twenty-shared'` et `'https://twenty.com'` ne donnent rien.
  - `it('ignores identifiers that only contain the word')` : `TwentyORM`, `twentyConfig`.
  - `it('reads the title of an html page but not its comments or scripts')`.
  - `it('reads the string values of a json manifest')`.
  - `it('excepts a whole folder, a file, or one text of a file')`.
- [ ] **Step 2: Run, they fail** : `npx jest packages/twenty-utils/branding --config=packages/twenty-utils/jest.config.mjs`.
- [ ] **Step 3: Implement**, puis la cible nx `check-branding` (`npx tsx packages/twenty-utils/branding/check-branding.ts`). Le workflow `ci-branding.yaml` la lance à chaque push et pull request, sur le modèle de `ci-utils-test.yaml`.
- [ ] **Step 4: Run** :
  - les tests passent ;
  - `npx nx run twenty-utils:check-branding` liste les « Twenty » restants et sort en 1. C'est attendu : les tâches 3 et 4 les traitent. Garder la liste dans le journal d'exécution.
- [ ] **Step 5: Commit** : `Add a check that fails when Twenty shows again in what the team sees`

### Task 3: Front

**Files** (à compléter avec ce que liste le contrôle) :
- `packages/twenty-front/src/pages/auth/SignInUp.tsx` : `Welcome to ${brandName}`.
- `packages/twenty-front/src/modules/auth/sign-in-up/components/FooterNote.tsx` :
  - « By using ${brandName}, you agree to the » ;
  - « Legal notice » vers `BRAND.legalNoticeUrl` et « Privacy Policy » vers `BRAND.privacyPolicyUrl`, dans les deux variantes du pied ;
  - la variante DPA n'est pas touchée.
- `packages/twenty-front/src/modules/auth/components/Logo.tsx` : logo par défaut `BRAND.logoPath`.
- `packages/twenty-front/src/pages/not-found/NotFound.tsx` : `Page Not Found | ${brandName}`.
- `packages/twenty-front/src/utils/title-utils.ts` : titre par défaut `BRAND.name`.
- `packages/twenty-front/src/modules/ui/navigation/navigation-drawer/constants/DefaultWorkspaceName.ts` : `BRAND.name`.
- `packages/twenty-front/src/modules/ui/navigation/navigation-drawer/constants/DefaultWorkspaceLogo.ts` : `BRAND.logoPath`.
- `packages/twenty-front/src/modules/activities/timeline-activities/utils/getTimelineActivityAuthorFullName.ts` : `BRAND.name`.
- `packages/twenty-front/src/pages/settings/community/SettingsCommunity.tsx` (voir les choix plus haut) :
  - section « Source code » ;
  - description : « ${brandName} is built on Twenty, open-source software published under the AGPL license. » (exception de licence) ;
  - carte « View the source code » vers `BRAND.sourceCodeUrl`, avec l'icône canonique de lien externe du dictionnaire d'icônes.
- Settings MCP (`buildMcpSetupCategories.tsx`, `McpSetup.ts`, `mcpSetup.ts`), import de fichiers (`ColumnGrid.tsx` : `${brandName} fields`), exemples de champs (`SettingsCompositeFieldTypeConfigs.ts` : `interfaze.fr` / `Interfaze`), description de l'application standard (`getStandardApplicationDescription.ts`) : `Twenty` → `${brandName}`.
  - Ne changent pas : la commande `create-twenty-app` et les liens de documentation.
- Tests : `packages/twenty-front/src/utils/__tests__/title-utils.test.ts`, `packages/twenty-front/src/modules/activities/timeline-activities/utils/__tests__/getTimelineActivityAuthorFullName.test.ts`, `packages/twenty-front/src/pages/settings/community/__tests__/SettingsCommunity.test.tsx` (nouveau).

**Interfaces:**
- Consumes : `BRAND` (tâche 1).
- Dans chaque message Lingui, la marque passe par une variable locale nommée `brandName` (`const brandName = BRAND.name;`), pour que le message extrait contienne `{brandName}`. La tâche 5 s'appuie sur ce nom.

- [ ] **Step 1: Tests**
  - `title-utils.test.ts` : le titre par défaut attendu devient `'HubFaze'`.
  - `getTimelineActivityAuthorFullName.test.ts` : l'auteur système attendu devient `'HubFaze'`.
  - `SettingsCommunity.test.tsx` (montage des tests de pages de paramètres voisins) :
    - `it('links to the source code of HubFaze')` : un lien « View the source code » avec `href` = `https://github.com/laouaniFaouzi/twenty` ;
    - `it('no longer sends the team to the Twenty community')` : aucun lien vers `discord.com`, `x.com` ou `twenty.com/partners`.
- [ ] **Step 2: Run, they fail.**
- [ ] **Step 3: Implement** la liste, puis traiter chaque reste du contrôle dans `twenty-front`, selon la règle de tri.
- [ ] **Step 4: Run** :
  - les tests ci-dessus passent ;
  - les tests Jest des autres fichiers modifiés qui ont des tests passent ;
  - `npx tsgo -p tsconfig.json --noEmit` dans `packages/twenty-front` ne signale rien ;
  - `npx nx lint:diff-with-main twenty-front` ne signale rien ;
  - `npx nx run twenty-utils:check-branding` ne signale plus rien dans `twenty-front`.
- [ ] **Step 5: Commit** : `Show HubFaze across sign-in, settings and the workspace defaults`

### Task 4: E-mails et serveur

**Files:**
- `packages/twenty-emails/src/components/Logo.tsx` : `${BRAND.appUrl}${BRAND.emailLogoPath}`, `alt` « HubFaze », largeur 160, hauteur 40.
- `packages/twenty-emails/src/components/Footer.tsx` :
  - liens « Website » (`BRAND.websiteUrl`) et « Source code » (`BRAND.sourceCodeUrl`) ;
  - ligne `BRAND.companyLine` ;
  - plus de liens de documentation Twenty.
- `packages/twenty-emails/src/components/BaseHead.tsx` : titre « HubFaze ».
- `packages/twenty-emails/src/components/WhatIsTwenty.tsx` (nom de fichier inchangé) : « What is {brandName}? ».
- `packages/twenty-emails/src/emails/send-invite-link.email.tsx` : « Join your team on {brandName} ».
- `packages/twenty-emails/src/emails/password-update-notify.email.tsx` : « Connect to {brandName} ».
- `packages/twenty-emails/src/emails/send-email-verification-link.email.tsx` : les deux phrases, avec `{brandName}`.
- `packages/twenty-emails/src/constants/DefaultWorkspaceLogo.ts` : `${BRAND.appUrl}${BRAND.logoPath}`.
- `packages/twenty-server/src/engine/core-modules/workspace-invitation/services/workspace-invitation.service.ts` : objet « Join your team on ${brandName} ».
- `packages/twenty-server/src/engine/core-modules/email-verification/services/email-verification.service.ts` : objet « Welcome to ${brandName}: Please Confirm Your Email ».
- `packages/twenty-server/src/engine/core-modules/two-factor-authentication/two-factor-authentication.service.ts` : émetteur `${BRAND.name}${…}` aux deux endroits.
- `packages/twenty-server/src/engine/core-modules/twenty-config/config-variables.ts` : `EMAIL_FROM_NAME = 'HubFaze'`.
- Tests : `packages/twenty-server/src/engine/core-modules/two-factor-authentication/two-factor-authentication.service.spec.ts`, ou le spec voisin existant, et `packages/twenty-emails/src/__tests__/branding.test.tsx` (nouveau, s'il existe un lanceur de tests pour `twenty-emails`). Sinon, la vérification se fait au rendu, à l'étape 4.

**Interfaces:**
- Consumes : `BRAND`.
- Messages des e-mails, à identifiant explicite : `i18n._('What is {brandName}?', { brandName: BRAND.name })`, et de même pour les autres.

- [ ] **Step 1: Test**
  - Spec 2FA : `it('names HubFaze as the issuer in the authenticator app')`. L'URI `otpauth` générée contient `issuer=HubFaze`, et le libellé commence par `HubFaze`.
- [ ] **Step 2: Run, it fails.**
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** :
  - le spec passe ;
  - `npx tsgo -p tsconfig.json --noEmit` dans `twenty-server` et `twenty-emails` ne signale rien ;
  - `npx nx build twenty-emails` passe ;
  - `npx nx lint:diff-with-main` passe pour les deux paquets ;
  - le rendu HTML de `SendInviteLinkEmail` et de `PasswordUpdateNotifyEmail`, produit par `render` de `react-email` dans un script jetable, contient `HubFaze`, `email-logo.png`, les deux liens du pied, et aucun `Twenty`.
  - `npx nx run twenty-utils:check-branding` passe, sorti en 0.
- [ ] **Step 5: Commit** : `Brand the emails, their subjects and the authenticator issuer as HubFaze`

### Task 5: Traductions anglaises et françaises

**Files:**
- Create: `packages/twenty-utils/branding/brand-translations.ts`, `packages/twenty-utils/branding/upsert-po-entry.ts`, `packages/twenty-utils/branding/apply-brand-translations.ts`, `packages/twenty-utils/branding/__tests__/upsert-po-entry.test.ts`
- Modify: `en.po`, `fr-FR.po` et `generated/*.ts` des trois paquets (`twenty-front/src/locales`, `twenty-emails/src/locales`, `twenty-server/src/engine/core-modules/i18n/locales`)
- Modify: `packages/twenty-utils/project.json` (cible `brand-translations`)

**Interfaces:**
- Produces :
  - `type BrandTranslation = { message: string; french: string }` ;
  - `BRAND_TRANSLATIONS: Record<'twenty-front' | 'twenty-emails' | 'twenty-server', BrandTranslation[]>`, avec le message tel que Lingui l'extrait ;
  - `upsertPoEntry(po: string, entry: { id: string | null; message: string; translation: string; reference: string }): string` :
    - `id: null` donne une entrée `#. js-lingui-explicit-id` ;
    - entrée trouvée par `msgid` : son `msgstr` est remplacé ;
    - sinon l'entrée est ajoutée à la fin ;
    - les guillemets, les antislashs et les retours à la ligne sont échappés comme dans un `.po`.
- `apply-brand-translations.ts`, pour chaque paquet :
  1. Lancer `lingui extract` avec une config temporaire :
     - même format ;
     - locale `en` seule ;
     - `include` = les fichiers du paquet qui importent `BRAND` ;
     - catalogue dans un dossier temporaire.
  2. Garder les messages extraits qui contiennent `{brandName}` ou sont une clé de `BRAND_TRANSLATIONS`. Pour chacun :
     - clé générée (front, serveur) ou explicite (e-mails) ;
     - mise à jour de `en.po` (traduction = message) et de `fr-FR.po` (traduction française) avec `upsertPoEntry`.
  3. Échouer et lister :
     - les messages de marque extraits sans traduction française ;
     - les clés de `BRAND_TRANSLATIONS` qu'aucun fichier ne produit plus.
  4. Lancer `lingui compile --typescript` dans le paquet.
- Traductions de référence (le reste suit la même terminologie) :
  - « Welcome to {brandName} » → « Bienvenue sur {brandName} » ;
  - « By using {brandName}, you agree to the » → « En utilisant {brandName}, vous acceptez les » ;
  - « Legal notice » → « mentions légales » (le lien suit la phrase) ;
  - « Page Not Found | {brandName} » → « Page introuvable | {brandName} » ;
  - « Source code » → « Code source » ;
  - « View the source code » → « Voir le code source » ;
  - « Join your team on {brandName} » → « Rejoignez votre équipe sur {brandName} » ;
  - « What is {brandName}? » → « Qu'est-ce que {brandName} ? » ;
  - « Welcome to {brandName}: Please Confirm Your Email » → « Bienvenue sur {brandName} : confirmez votre adresse e-mail ».

- [ ] **Step 1: Tests** (`upsert-po-entry.test.ts`) :
  - `it('adds a generated-id entry at the end of the catalog')` : `#. js-lingui-id: nTuObL`, la référence, `msgid`, `msgstr`.
  - `it('adds an explicit-id entry for emails')`.
  - `it('replaces the translation of an existing message and leaves the rest untouched')` : le reste du fichier est identique, octet pour octet.
  - `it('escapes quotes, backslashes and line breaks')`.
- [ ] **Step 2: Run, they fail.**
- [ ] **Step 3: Implement**, puis `npx nx run twenty-utils:brand-translations`.
- [ ] **Step 4: Run** :
  - les tests passent ;
  - l'outil sort en 0 ;
  - `git diff --stat` ne montre de changement que dans `en.po`, `fr-FR.po` et `generated/*.ts` des trois paquets ;
  - pour chaque message de `BRAND_TRANSLATIONS`, la clé est présente avec le texte français dans `generated/fr-FR.ts` et avec le texte anglais dans `generated/de-DE.ts`. Vérifié par un script jetable qui lit les catalogues compilés.
- [ ] **Step 5: Commit** : `Translate the HubFaze messages into English and French, other languages fall back to English`

### Task 6: Pilotage en tête, BRANDING.md et recette

**Files:**
- Modify: les six entrées de menu de `packages/twenty-apps/internal/interfaze/src/navigation-menu-items/` : Pilotage −6, Pipeline −5, Projets −4, Tâches de suivi −3, Maintenance −2, Pages −1.
- Modify: `packages/twenty-apps/internal/interfaze/src/views/__tests__/views.test.ts`, `packages/twenty-apps/internal/interfaze/src/page-layouts/__tests__/pages-layouts.test.ts`, `packages/twenty-apps/internal/interfaze/README.md` (« Pilotage ouvre le menu » devient vrai)
- Create: `BRANDING.md` à la racine

- [ ] **Step 1: Tests** : les positions attendues dans `views.test.ts` et `pages-layouts.test.ts` passent aux valeurs ci-dessus.
- [ ] **Step 2: Run, they fail** : `yarn test:unit` dans l'app.
- [ ] **Step 3: Implement** les positions. Écrire `BRANDING.md`, avec :
  - ce que porte `BRAND` et où il sert ;
  - comment régénérer les logos ;
  - la procédure après chaque récupération des versions de Twenty :
    1. fusion ;
    2. `npx nx build twenty-shared` ;
    3. `npx nx run twenty-utils:check-branding`, et traitement de chaque reste selon la règle de tri ;
    4. `npx nx run twenty-utils:brand-translations` ;
    5. ne jamais lancer `lingui extract` sur les vrais catalogues ;
  - la liste d'exceptions et sa règle ;
  - `EMAIL_FROM_NAME` à régler en production.
- [ ] **Step 4: Recette**, sur la pile locale (serveur, worker, front) :
  - `yarn test:unit`, `yarn typecheck`, `yarn lint` et `yarn twenty build` de l'app passent ;
  - `npx nx run twenty-utils:check-branding` passe ;
  - captures Playwright, l'utilisateur en français puis en anglais :
    - écran de connexion ;
    - accueil de l'espace avec le menu : Pilotage en tête ;
    - paramètres, page Communauté.
    Chaque capture montre HubFaze et le nouveau logo, et aucun « Twenty » n'y apparaît.
  - L'e-mail d'invitation, rendu à l'étape 4 de la tâche 4, est revu en capture.
- [ ] **Step 5: Commit** : `Put Pilotage first in the menu and document how to keep the HubFaze brand`
