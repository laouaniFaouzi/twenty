export type BrandCatalogPackage =
  | 'twenty-front'
  | 'twenty-emails'
  | 'twenty-server';

// French for every message that names the brand or that the rename added,
// keyed by the message exactly as Lingui extracts it.
export const BRAND_TRANSLATIONS: Record<
  BrandCatalogPackage,
  Record<string, string>
> = {
  'twenty-front': {
    '{brandName} fields': 'Champs {brandName}',
    '{brandName} is built on Twenty, open-source software published under the AGPL license.':
      '{brandName} repose sur Twenty, un logiciel libre publié sous licence AGPL.',
    'Add {brandName} as a Streamable HTTP extension in Goose.':
      'Ajoutez {brandName} comme extension HTTP Streamable dans Goose.',
    'Add the {brandName} MCP server as a remote context server in Zed.':
      'Ajoutez le serveur MCP {brandName} comme serveur de contexte distant dans Zed.',
    'Add the {brandName} MCP server from Augment Code settings.':
      "Ajoutez le serveur MCP {brandName} depuis les paramètres d'Augment Code.",
    "Add the {brandName} MCP server from Raycast's MCP commands or settings.":
      'Ajoutez le serveur MCP {brandName} depuis les commandes ou les paramètres MCP de Raycast.',
    'Add the {brandName} MCP server in Gemini CLI settings.':
      'Ajoutez le serveur MCP {brandName} dans les paramètres de Gemini CLI.',
    'Add the {brandName} MCP server to your LibreChat configuration file.':
      'Ajoutez le serveur MCP {brandName} à votre fichier de configuration LibreChat.',
    "Add the {brandName} remote server with LM Studio's install link.":
      "Ajoutez le serveur distant {brandName} avec le lien d'installation de LM Studio.",
    'By using {brandName}, you agree to the':
      'En utilisant {brandName}, vous acceptez les',
    'Configure the {brandName} MCP server manually in Cascade.':
      'Configurez manuellement le serveur MCP {brandName} dans Cascade.',
    'Configure the {brandName} MCP server manually in Cline.':
      'Configurez manuellement le serveur MCP {brandName} dans Cline.',
    'Legal notice': 'Mentions légales',
    'Open Claude with the {brandName} connector name and MCP URL prefilled.':
      "Ouvrez Claude avec le nom du connecteur {brandName} et l'URL MCP préremplis.",
    "Open Cursor's MCP installer with the {brandName} remote server config.":
      "Ouvrez l'installeur MCP de Cursor avec la configuration du serveur distant {brandName}.",
    'Open Replit with the {brandName} remote server config.':
      'Ouvrez Replit avec la configuration du serveur distant {brandName}.',
    'Open the official ChatGPT integration for your workspace.':
      "Ouvrez l'intégration ChatGPT officielle pour votre espace de travail.",
    'Page Not Found | {brandName}': 'Page non trouvée | {brandName}',
    'Source code': 'Code source',
    'The base data model every {brandName} workspace runs on.\n\n#### What "foundation" means\n\nEvery {brandName} workspace starts with this set of objects. They define the shape of your CRM, including relationships, activity, and reporting. Everything else, including marketplace apps, AI agents, and custom objects, plugs into them.\n\n#### Included objects\n- **People & Companies**: contact and account records\n- **Opportunities**: your sales pipeline\n- **Notes & Tasks**: activity and follow-ups\n- **Workflows & Dashboards**: automation and reporting\n\nRemove this app and the rest of {brandName} has nothing to hang off.\n\n#### Build your own app\n\nExtend {brandName} with your own objects, fields, logic functions, or AI skills. Scaffold a new app in one command:\n\n```bash\nnpx create-twenty-app@latest my-twenty-app\n```\n\nThen inside the folder:\n\n```bash\ncd my-twenty-app\nyarn twenty dev\n```\n\nSee the [Getting Started guide](https://twenty.com/developers/extend/apps/getting-started) for the full walkthrough, and [Building Apps](https://twenty.com/developers/extend/apps/building) for the `defineApplication` / `defineEntity` APIs.':
      "Le modèle de données de base sur lequel fonctionne chaque espace de travail {brandName}.\n\n#### Ce que signifie « socle »\n\nChaque espace de travail {brandName} commence avec cet ensemble d'objets. Ils définissent la structure de votre CRM, y compris les relations, l'activité et le reporting. Tout le reste, y compris les applications de la marketplace, les agents IA et les objets personnalisés, s'y connecte.\n\n#### Objets inclus\n- **Personnes & Entreprises**: enregistrements de contacts et de comptes\n- **Opportunités**: votre pipeline commercial\n- **Notes & Tâches**: activité et suivis\n- **Flux de travail & Tableaux de bord**: automatisation et reporting\n\nSupprimez cette application et le reste de {brandName} n'a plus rien sur quoi s'appuyer.\n\n#### Créez votre propre application\n\nÉtendez {brandName} avec vos propres objets, champs, fonctions logiques ou compétences en IA. Initialisez une nouvelle application en une commande :\n\n```bash\nnpx create-twenty-app@latest my-twenty-app\n```\n\nEnsuite, dans le dossier :\n\n```bash\ncd my-twenty-app\nyarn twenty dev\n```\n\nConsultez le [Guide de démarrage](https://twenty.com/developers/extend/apps/getting-started) pour le tutoriel complet, et [Création d'applications](https://twenty.com/developers/extend/apps/building) pour les API `defineApplication` / `defineEntity`.",
    'View the source code': 'Voir le code source',
    'Welcome to {brandName}': 'Bienvenue sur {brandName}',
  },
  'twenty-emails': {
    'Connect to {brandName}': 'Connectez-vous à {brandName}',
    'Join your team on {brandName}': 'Rejoignez votre équipe sur {brandName}',
    'Source code': 'Code source',
    'View the source code': 'Voir le code source',
    'Visit the website': 'Visiter le site web',
    'What is {brandName}?': "Qu'est-ce que {brandName} ?",
  },
  'twenty-server': {
    'Join your team on {brandName}': 'Rejoignez votre équipe sur {brandName}',
    'Welcome to {brandName}: Please Confirm Your Email':
      'Bienvenue chez {brandName} : Veuillez confirmer votre email',
  },
};
