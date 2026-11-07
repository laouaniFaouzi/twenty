import { defineObject, FieldType } from 'twenty-sdk/define';

import {
  OFFER_COLORS,
  OFFER_LABELS,
  OFFERS,
  type Offer,
} from 'src/constants/offer';

export type ProjectStatus = 'IN_PROGRESS' | 'LAUNCHED' | 'ARCHIVED';

export const PROJECT_UNIVERSAL_IDENTIFIER =
  'bf82e1ba-d721-45ec-b76d-3bbc5567457d';

export const PROJECT_NAME_FIELD_UNIVERSAL_IDENTIFIER =
  'eda34af4-4a5e-4e99-a759-5ec358d9a5b0';
export const PROJECT_OFFER_FIELD_UNIVERSAL_IDENTIFIER =
  '39783a6e-49e7-4fbf-ba0b-816ac4e2859d';
export const PROJECT_STATUS_FIELD_UNIVERSAL_IDENTIFIER =
  'b126b716-ef0b-4c1e-8653-681cc3e91ef6';
export const PROJECT_PRICE_FIELD_UNIVERSAL_IDENTIFIER =
  'e6f0353c-6c8d-4b5a-956b-046b429b484d';
export const PROJECT_ANNOUNCED_LAUNCH_DATE_FIELD_UNIVERSAL_IDENTIFIER =
  '4d6e660c-bf6b-44e1-8c14-dfa319a27d40';
export const PROJECT_LAUNCHED_AT_FIELD_UNIVERSAL_IDENTIFIER =
  '30cda85d-80be-446e-a379-b3ccd3fc8725';
export const PROJECT_PROGRESS_FIELD_UNIVERSAL_IDENTIFIER =
  'e2eb4479-6189-4250-9df9-5789e0089ff0';
export const PROJECT_CURRENT_PHASE_FIELD_UNIVERSAL_IDENTIFIER =
  'a1d44bfb-c222-4bab-b6b8-3034820c5621';
export const PROJECT_TRACKER_URL_FIELD_UNIVERSAL_IDENTIFIER =
  '77d06112-9676-421e-ab2b-80e6483983cb';

export const PROJECT_STATUS_OPTIONS: {
  id: string;
  value: ProjectStatus;
  label: string;
  position: number;
  color: 'blue' | 'green' | 'gray';
}[] = [
  {
    id: '30bc1fe5-aab9-464e-9a45-2e88d5a03939',
    value: 'IN_PROGRESS',
    label: 'En cours',
    position: 0,
    color: 'blue',
  },
  {
    id: '644addc5-e9fb-48be-a662-3df7b543a086',
    value: 'LAUNCHED',
    label: 'Mis en ligne',
    position: 1,
    color: 'green',
  },
  {
    id: '63826c49-8590-4c8d-9d5a-25ddd42e74c7',
    value: 'ARCHIVED',
    label: 'Archivé',
    position: 2,
    color: 'gray',
  },
];

const PROJECT_OFFER_OPTION_IDS: Record<Offer, string> = {
  WEB: '748eeacd-4941-47bb-8184-d36630ba95a8',
  SHOP: 'dd01a367-4aba-4230-8f41-2e729b73b1df',
  APP: '9b88c1b7-accf-4637-8a33-350bd0f995dc',
  SMART: 'c2c0e028-d366-4987-8ae2-604969c72fb6',
};

export const PROJECT_SITE_TRACKER_ID_FIELD_UNIVERSAL_IDENTIFIER =
  '6a6c329f-4a63-41d3-8e2c-6a2c9bb34113';
export const PROJECT_SITE_UPDATED_AT_FIELD_UNIVERSAL_IDENTIFIER =
  '7bf1483f-8d4c-4882-8e92-8ba846a234e7';
export const PROJECT_SYNC_HASH_FIELD_UNIVERSAL_IDENTIFIER =
  '53243fa7-3fe2-485c-8d7d-bef51dfde628';

export default defineObject({
  universalIdentifier: PROJECT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'project',
  namePlural: 'projects',
  labelSingular: 'Projet',
  labelPlural: 'Projets',
  description: 'Un projet client signé, avec son suivi',
  icon: 'IconBriefcase',
  labelIdentifierFieldMetadataUniversalIdentifier:
    PROJECT_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  fields: [
    {
      universalIdentifier: PROJECT_NAME_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'name',
      label: 'Nom',
      icon: 'IconAbc',
    },
    {
      universalIdentifier: PROJECT_OFFER_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.SELECT,
      name: 'offer',
      label: 'Offre',
      icon: 'IconPackage',
      isNullable: true,
      options: OFFERS.map((offer, position) => ({
        id: PROJECT_OFFER_OPTION_IDS[offer],
        value: offer,
        label: OFFER_LABELS[offer],
        position,
        color: OFFER_COLORS[offer],
      })),
    },
    {
      universalIdentifier: PROJECT_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.SELECT,
      name: 'status',
      label: 'Statut',
      icon: 'IconProgress',
      defaultValue: "'IN_PROGRESS'",
      options: PROJECT_STATUS_OPTIONS,
    },
    {
      universalIdentifier: PROJECT_PRICE_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.CURRENCY,
      name: 'price',
      label: 'Prix',
      description: 'Prix du devis signé',
      icon: 'IconCurrencyEuro',
      isNullable: true,
    },
    {
      universalIdentifier:
        PROJECT_ANNOUNCED_LAUNCH_DATE_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.DATE,
      name: 'announcedLaunchDate',
      label: 'Mise en ligne annoncée',
      description: 'Date de mise en ligne annoncée dans le devis',
      icon: 'IconCalendarDue',
      isNullable: true,
    },
    {
      universalIdentifier: PROJECT_LAUNCHED_AT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.DATE,
      name: 'launchedAt',
      label: 'Mise en ligne réelle',
      icon: 'IconRocket',
      isNullable: true,
    },
    {
      universalIdentifier: PROJECT_PROGRESS_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.NUMBER,
      name: 'progress',
      label: 'Avancement',
      description:
        'Pourcentage de tâches de suivi faites, calculé automatiquement',
      icon: 'IconPercentage',
      isNullable: true,
      isUIEditable: false,
    },
    {
      universalIdentifier: PROJECT_CURRENT_PHASE_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'currentPhase',
      label: 'Phase en cours',
      description:
        'Première phase qui a une tâche non faite, calculée automatiquement',
      icon: 'IconStairs',
      isNullable: true,
      isUIEditable: false,
    },
    {
      universalIdentifier: PROJECT_TRACKER_URL_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.LINKS,
      name: 'trackerUrl',
      label: 'Lien de suivi client',
      description: 'Lien privé du suivi sur interfaze.fr',
      icon: 'IconLink',
      isNullable: true,
    },
    {
      universalIdentifier: PROJECT_SITE_TRACKER_ID_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'siteTrackerId',
      label: 'ID suivi site',
      description: 'Identifiant du suivi sur interfaze.fr',
      icon: 'IconPlug',
      isNullable: true,
      isUIEditable: false,
    },
    {
      universalIdentifier: PROJECT_SITE_UPDATED_AT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.DATE_TIME,
      name: 'siteUpdatedAt',
      label: 'Modifié sur le site le',
      description: 'Date de la dernière version du site appliquée ou envoyée',
      icon: 'IconPlug',
      isNullable: true,
      isUIEditable: false,
    },
    {
      universalIdentifier: PROJECT_SYNC_HASH_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'syncHash',
      label: 'Empreinte de synchro',
      description:
        'Empreinte du dernier état sur lequel HubFaze et le site sont d’accord',
      icon: 'IconPlug',
      isNullable: true,
      isUIEditable: false,
    },
  ],
});
