import { type Offer } from 'src/constants/offer';

export type TrackerPhaseTemplate = { name: string; tasks: string[] };

// Clients read these task names on interfaze.fr/suivi, so they speak to the
// client. The site's own tracker templates must stay a copy of this list.
export const TRACKER_TEMPLATES: Record<Offer, TrackerPhaseTemplate[]> = {
  WEB: [
    { name: 'On échange', tasks: ['Premier échange', 'Objectifs et contenus définis'] },
    { name: 'Vous validez le design', tasks: ['Maquettes présentées', 'Design validé'] },
    {
      name: 'On le construit',
      tasks: ['Pages développées', 'Textes et images intégrés', 'Référencement Google configuré'],
    },
    { name: 'Mise en ligne', tasks: ['Recette avec vous', 'Site en ligne', 'Prise en main'] },
  ],
  SHOP: [
    { name: 'On échange', tasks: ['Premier échange', 'Catalogue et façon de vendre définis'] },
    {
      name: 'Design & configuration',
      tasks: ['Boutique Shopify configurée', 'Design adapté à votre marque'],
    },
    {
      name: 'Catalogue & paiement',
      tasks: ['Fiches produits créées', 'Paiement configuré', 'Livraison configurée'],
    },
    { name: 'Lancement à vos côtés', tasks: ['Commande test', 'Boutique en ligne', 'Prise en main'] },
  ],
  APP: [
    { name: 'Cadrage', tasks: ['Atelier de cadrage', 'Périmètre et priorités validés'] },
    { name: 'Conception', tasks: ['Parcours validés', 'Écrans validés'] },
    { name: 'Développement', tasks: ['Première version', "Points d'étape", 'Tests'] },
    { name: 'Livraison', tasks: ['Mise en production', 'Prise en main'] },
  ],
  SMART: [
    { name: 'Repérage', tasks: ['Analyse de votre quotidien', 'Tâches à automatiser identifiées'] },
    {
      name: 'Priorités & financement',
      tasks: ["Plan d'action chiffré", "Éligibilité « Osez l'IA » vérifiée"],
    },
    {
      name: 'Mise en place',
      tasks: ['Automatisations en place', 'Assistants IA intégrés à vos outils'],
    },
    { name: 'Prise en main', tasks: ['Formation des équipes', 'Bilan'] },
  ],
};
