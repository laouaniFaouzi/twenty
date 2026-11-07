import { defineApplication } from 'twenty-sdk/define';

import { APPLICATION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

export default defineApplication({
  universalIdentifier: APPLICATION_UNIVERSAL_IDENTIFIER,
  displayName: 'Interfaze',
  description:
    "Pipeline, projets, suivis clients, pages et maintenance d'Interfaze.",
  applicationVariables: {
    SUPABASE_URL: {
      universalIdentifier: 'bfe0b6b7-8c22-425e-9592-e8a54a7740f5',
      label: 'URL Supabase du site',
      description:
        "Adresse du projet Supabase d'interfaze.fr, sans /rest/v1 (par exemple https://abcd.supabase.co). Vide : la synchro avec le site est coupée.",
      isSecret: false,
    },
    SUPABASE_SECRET_KEY: {
      universalIdentifier: 'da8d8925-d20d-4a54-a3e7-75fc2c3abd52',
      label: 'Clé secrète Supabase',
      description:
        "Clé secrète (sb_secret_…) ou clé service_role du Supabase du site, utilisée pour renvoyer l'étape des opportunités vers les demandes.",
      isSecret: true,
    },
    HUBFAZE_WEBHOOK_SECRET: {
      universalIdentifier: '75182652-685d-456c-a9ac-d1e17d83095b',
      label: 'Secret du webhook du site',
      description:
        'Secret partagé avec le site : le même que le secret Vault hubfaze_webhook_secret. Les appels sans ce secret sont refusés.',
      isSecret: true,
    },
    LEAD_OWNER_EMAIL: {
      universalIdentifier: 'f632c526-5574-4635-8cf1-4e8a73153bc0',
      label: 'Responsable des demandes',
      description:
        "E-mail du membre de l'espace qui reçoit les nouvelles demandes et la tâche « Répondre sous 48 h ». Vide : opportunités et tâches sans responsable.",
      isSecret: false,
    },
    SITE_URL: {
      universalIdentifier: 'c7447f0d-419c-4af5-8c0b-4cc871aec40f',
      label: 'Adresse du site',
      description:
        "Adresse d'interfaze.fr, utilisée pour les liens de suivi client (adresse + /suivi/ + code).",
      isSecret: false,
      value: 'https://interfaze.fr',
    },
  },
});
