import {
  FieldType,
  OnDeleteAction,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';
import { describe, expect, it } from 'vitest';

import companyOnPage from 'src/fields/company-on-page.field';
import opportunityOnPage from 'src/fields/opportunity-on-page.field';
import pagesOnCompany from 'src/fields/pages-on-company.field';
import pagesOnOpportunity from 'src/fields/pages-on-opportunity.field';
import pagesOnProject from 'src/fields/pages-on-project.field';
import parentPageOnPage from 'src/fields/parent-page-on-page.field';
import projectOnPage from 'src/fields/project-on-page.field';
import subPagesOnPage from 'src/fields/sub-pages-on-page.field';
import page, { PAGE_UNIVERSAL_IDENTIFIER } from 'src/objects/page.object';
import { PROJECT_UNIVERSAL_IDENTIFIER } from 'src/objects/project.object';

const fieldNamed = (name: string) => {
  const field = page.config.fields?.find((candidate) => candidate.name === name);

  if (!field) {
    throw new Error(`Field ${name} not found`);
  }

  return field;
};

describe('Page object', () => {
  it('defines a searchable page titled by its title field', () => {
    expect(page.success).toBe(true);
    expect(page.config).toMatchObject({
      nameSingular: 'page',
      namePlural: 'pages',
      labelSingular: 'Page',
      labelPlural: 'Pages',
      isSearchable: true,
    });
    expect(page.config.labelIdentifierFieldMetadataUniversalIdentifier).toBe(
      fieldNamed('title').universalIdentifier,
    );
  });

  it('defines the page fields', () => {
    expect(fieldNamed('title')).toMatchObject({ type: FieldType.TEXT, label: 'Titre' });
    expect(fieldNamed('icon')).toMatchObject({ type: FieldType.TEXT, label: 'Icône' });
    expect(fieldNamed('content')).toMatchObject({
      type: FieldType.RICH_TEXT,
      label: 'Contenu',
    });
    expect(fieldNamed('isTemplate')).toMatchObject({
      type: FieldType.BOOLEAN,
      label: 'Modèle',
      defaultValue: false,
    });
  });

  it('leaves ordering to the system position field', () => {
    expect(page.config.fields?.some((field) => field.name === 'position')).toBe(false);
  });
});

type FieldDefinition = typeof parentPageOnPage;

const RELATIONS: [FieldDefinition, FieldDefinition, string, string, string, string, string][] = [
  [parentPageOnPage, subPagesOnPage, PAGE_UNIVERSAL_IDENTIFIER, 'parentPage', 'Page parente', 'subPages', 'parentPageId'],
  [projectOnPage, pagesOnProject, PROJECT_UNIVERSAL_IDENTIFIER, 'project', 'Projet', 'pages', 'projectId'],
  [companyOnPage, pagesOnCompany, STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.company.universalIdentifier, 'company', 'Société', 'pages', 'companyId'],
  [opportunityOnPage, pagesOnOpportunity, STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.universalIdentifier, 'opportunity', 'Opportunité', 'pages', 'opportunityId'],
];

describe('Page relations', () => {
  it.each(RELATIONS)(
    'links %#: both sides point at each other',
    (manyToOne, oneToMany, targetObject, name, label, inverseName, joinColumnName) => {
      expect(manyToOne.success).toBe(true);
      expect(oneToMany.success).toBe(true);
      expect(manyToOne.config).toMatchObject({
        type: FieldType.RELATION,
        name,
        label,
        objectUniversalIdentifier: PAGE_UNIVERSAL_IDENTIFIER,
        relationTargetObjectMetadataUniversalIdentifier: targetObject,
        relationTargetFieldMetadataUniversalIdentifier: oneToMany.config.universalIdentifier,
        universalSettings: {
          relationType: RelationType.MANY_TO_ONE,
          onDelete: OnDeleteAction.SET_NULL,
          joinColumnName,
        },
      });
      expect(oneToMany.config).toMatchObject({
        type: FieldType.RELATION,
        name: inverseName,
        objectUniversalIdentifier: targetObject,
        relationTargetObjectMetadataUniversalIdentifier: PAGE_UNIVERSAL_IDENTIFIER,
        relationTargetFieldMetadataUniversalIdentifier: manyToOne.config.universalIdentifier,
        universalSettings: { relationType: RelationType.ONE_TO_MANY },
      });
    },
  );

  it('labels the sub-pages side', () => {
    expect(subPagesOnPage.config.label).toBe('Sous-pages');
  });
});
