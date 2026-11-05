import { describe, expect, it } from 'vitest';

import { PAGE_SEEDS } from 'src/constants/page-templates';

const headingsOf = (markdown: string) =>
  markdown
    .split('\n')
    .filter((line) => line.startsWith('## '))
    .map((line) => line.slice(3));

const seedTitled = (title: string) => {
  const seed = PAGE_SEEDS.find((candidate) => candidate.title === title);

  if (!seed) {
    throw new Error(`Seed ${title} not found`);
  }

  return seed;
};

describe('PAGE_SEEDS', () => {
  it('lists the four templates then the database help page', () => {
    expect(PAGE_SEEDS.map(({ title, isTemplate }) => [title, isTemplate])).toEqual([
      ['Compte rendu de réunion', true],
      ['Brief projet', true],
      ['Cahier des charges', true],
      ['Bilan de mise en ligne', true],
      ['Créer une base de données', false],
    ]);
  });

  it.each([
    ['Compte rendu de réunion', ['Date', 'Participants', 'Objet', 'Ce qui a été dit', 'Décisions', 'Prochaines étapes', 'Prochain rendez-vous']],
    ['Brief projet', ['Le client et son activité', 'Ce qui bloque ou ce qui manque', 'Ce qui doit changer pour lui', 'Ses clients', 'Contenus disponibles', "Exemples qu'il aime", 'Contraintes (budget, date)', 'Offre envisagée']],
    ['Cahier des charges', ['Contexte', 'Objectifs', 'Inclus', 'Non inclus', 'Pages ou écrans', 'Fonctionnalités', 'Contenus', 'Référencement', 'Hébergement et mise en ligne', 'Planning', 'Validation']],
    ['Bilan de mise en ligne', ['Ce qui a été livré', 'Date annoncée et date réelle', 'Ce qui a bien marché', "Ce qu'on améliore", 'Résultats à 30 jours', 'Proposition de maintenance']],
  ])('gives the %s template the spec sections in order', (title, sections) => {
    expect(headingsOf(seedTitled(title).markdown)).toEqual(sections);
  });

  it('turns the next steps of the meeting notes into checkboxes', () => {
    const markdown = seedTitled('Compte rendu de réunion').markdown;
    const nextSteps = markdown.slice(markdown.indexOf('## Prochaines étapes'));

    expect(nextSteps).toMatch(/\n- \[ \] /);
  });

  it('explains how to create a database in five numbered steps', () => {
    const steps = seedTitled('Créer une base de données')
      .markdown.split('\n')
      .filter((line) => /^\d\. /.test(line));

    expect(steps.map((step) => step.slice(0, 3))).toEqual(['1. ', '2. ', '3. ', '4. ', '5. ']);
    expect(steps[0]).toContain('Modèle de données');
    expect(steps[4]).toContain('Relation');
  });

  it('gives every seed an icon', () => {
    expect(PAGE_SEEDS.every((seed) => seed.icon.length > 0)).toBe(true);
  });
});
