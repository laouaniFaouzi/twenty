import { describe, expect, it } from 'vitest';

import { TRACKER_TEMPLATES } from 'src/constants/tracker-templates';

describe('TRACKER_TEMPLATES', () => {
  it('copies the WebFaze phases and tasks of the spec', () => {
    expect(TRACKER_TEMPLATES.WEB).toEqual([
      { name: 'On échange', tasks: ['Premier échange', 'Objectifs et contenus définis'] },
      { name: 'Vous validez le design', tasks: ['Maquettes présentées', 'Design validé'] },
      { name: 'On le construit', tasks: ['Pages développées', 'Textes et images intégrés', 'Référencement Google configuré'] },
      { name: 'Mise en ligne', tasks: ['Recette avec vous', 'Site en ligne', 'Prise en main'] },
    ]);
  });

  it('copies the ShopFaze phases and tasks of the spec', () => {
    expect(TRACKER_TEMPLATES.SHOP).toEqual([
      { name: 'On échange', tasks: ['Premier échange', 'Catalogue et façon de vendre définis'] },
      { name: 'Design & configuration', tasks: ['Boutique Shopify configurée', 'Design adapté à votre marque'] },
      { name: 'Catalogue & paiement', tasks: ['Fiches produits créées', 'Paiement configuré', 'Livraison configurée'] },
      { name: 'Lancement à vos côtés', tasks: ['Commande test', 'Boutique en ligne', 'Prise en main'] },
    ]);
  });

  it('copies the AppFaze phases and tasks of the spec', () => {
    expect(TRACKER_TEMPLATES.APP).toEqual([
      { name: 'Cadrage', tasks: ['Atelier de cadrage', 'Périmètre et priorités validés'] },
      { name: 'Conception', tasks: ['Parcours validés', 'Écrans validés'] },
      { name: 'Développement', tasks: ['Première version', "Points d'étape", 'Tests'] },
      { name: 'Livraison', tasks: ['Mise en production', 'Prise en main'] },
    ]);
  });

  it('copies the SmartFaze phases and tasks of the spec', () => {
    expect(TRACKER_TEMPLATES.SMART).toEqual([
      { name: 'Repérage', tasks: ['Analyse de votre quotidien', 'Tâches à automatiser identifiées'] },
      { name: 'Priorités & financement', tasks: ["Plan d'action chiffré", 'Éligibilité « Osez l\'IA » vérifiée'] },
      { name: 'Mise en place', tasks: ['Automatisations en place', 'Assistants IA intégrés à vos outils'] },
      { name: 'Prise en main', tasks: ['Formation des équipes', 'Bilan'] },
    ]);
  });
});
