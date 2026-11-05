import { defineObject, FieldType } from 'twenty-sdk/define';

export const PAGE_UNIVERSAL_IDENTIFIER = '1a50b7e8-0ec1-4e22-b100-5e9f99e87034';

export const PAGE_TITLE_FIELD_UNIVERSAL_IDENTIFIER = '00aea0f5-ba0f-45f6-8d13-cb426673f186';
export const PAGE_ICON_FIELD_UNIVERSAL_IDENTIFIER = '4d04c853-c94c-4a01-9fc6-698b15dbb362';
export const PAGE_CONTENT_FIELD_UNIVERSAL_IDENTIFIER = '2d2528c0-990a-415e-9866-18cc129268e0';
export const PAGE_IS_TEMPLATE_FIELD_UNIVERSAL_IDENTIFIER = '632c2ac7-05ce-471a-9c53-6ba27e95a775';

export default defineObject({
  universalIdentifier: PAGE_UNIVERSAL_IDENTIFIER,
  nameSingular: 'page',
  namePlural: 'pages',
  labelSingular: 'Page',
  labelPlural: 'Pages',
  description: 'Une page libre, écrite avec l’éditeur en blocs, avec ses sous-pages',
  icon: 'IconNotes',
  isSearchable: true,
  labelIdentifierFieldMetadataUniversalIdentifier:
    PAGE_TITLE_FIELD_UNIVERSAL_IDENTIFIER,
  fields: [
    {
      universalIdentifier: PAGE_TITLE_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'title',
      label: 'Titre',
      icon: 'IconAbc',
    },
    {
      universalIdentifier: PAGE_ICON_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'icon',
      label: 'Icône',
      description: 'Un emoji affiché devant le titre',
      icon: 'IconMoodSmile',
      isNullable: true,
    },
    {
      universalIdentifier: PAGE_CONTENT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.RICH_TEXT,
      name: 'content',
      label: 'Contenu',
      icon: 'IconFileText',
      isNullable: true,
    },
    {
      universalIdentifier: PAGE_IS_TEMPLATE_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.BOOLEAN,
      name: 'isTemplate',
      label: 'Modèle',
      description: 'Une page modèle sert de point de départ à de nouvelles pages',
      icon: 'IconTemplate',
      defaultValue: false,
    },
  ],
});
