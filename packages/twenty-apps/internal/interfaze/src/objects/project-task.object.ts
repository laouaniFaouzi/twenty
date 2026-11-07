import { defineObject, FieldType } from 'twenty-sdk/define';

export type ProjectTaskStatus = 'TODO' | 'DOING' | 'DONE';

export const PROJECT_TASK_UNIVERSAL_IDENTIFIER =
  '4f2b88f2-f7a1-419f-b240-122b0d6bc820';

export const PROJECT_TASK_NAME_FIELD_UNIVERSAL_IDENTIFIER =
  '66286c36-b5d4-4b2c-be0e-bc11fb5d82aa';
export const PROJECT_TASK_DESCRIPTION_FIELD_UNIVERSAL_IDENTIFIER =
  '20e6552b-5a32-4493-b3de-03046bda4ee9';
export const PROJECT_TASK_STATUS_FIELD_UNIVERSAL_IDENTIFIER =
  'eb80b460-0419-4fe0-94af-df3bb4211a19';
export const PROJECT_TASK_DUE_DATE_FIELD_UNIVERSAL_IDENTIFIER =
  '92340a22-5e7c-4403-8be8-f4222a6d937d';

export const PROJECT_TASK_STATUS_OPTIONS: {
  id: string;
  value: ProjectTaskStatus;
  label: string;
  position: number;
  color: 'gray' | 'blue' | 'green';
}[] = [
  {
    id: '3bad3de7-e806-4eda-a3aa-1374dd554d75',
    value: 'TODO',
    label: 'À faire',
    position: 0,
    color: 'gray',
  },
  {
    id: '58975391-e31e-41cc-858d-9359a2a797d9',
    value: 'DOING',
    label: 'En cours',
    position: 1,
    color: 'blue',
  },
  {
    id: '3ba4f24e-0ce8-41d8-8fcb-3fb54b54423b',
    value: 'DONE',
    label: 'Fait',
    position: 2,
    color: 'green',
  },
];

export const PROJECT_TASK_SITE_ID_FIELD_UNIVERSAL_IDENTIFIER =
  '39283568-7436-43f9-9b50-30fa90d72041';
export const PROJECT_TASK_SITE_UPDATED_AT_FIELD_UNIVERSAL_IDENTIFIER =
  'fa289c03-d762-441a-ab46-feb55126a165';
export const PROJECT_TASK_SYNC_HASH_FIELD_UNIVERSAL_IDENTIFIER =
  'c15279fb-6445-4fea-9ad9-b99be9bddce4';

export default defineObject({
  universalIdentifier: PROJECT_TASK_UNIVERSAL_IDENTIFIER,
  nameSingular: 'projectTask',
  namePlural: 'projectTasks',
  labelSingular: 'Tâche de suivi',
  labelPlural: 'Tâches de suivi',
  description:
    'Une tâche du suivi client, visible par le client sur interfaze.fr',
  icon: 'IconChecklist',
  labelIdentifierFieldMetadataUniversalIdentifier:
    PROJECT_TASK_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  fields: [
    {
      universalIdentifier: PROJECT_TASK_NAME_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'name',
      label: 'Nom',
      icon: 'IconAbc',
    },
    {
      universalIdentifier: PROJECT_TASK_DESCRIPTION_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'description',
      label: 'Description',
      icon: 'IconAlignLeft',
      isNullable: true,
    },
    {
      universalIdentifier: PROJECT_TASK_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.SELECT,
      name: 'status',
      label: 'Statut',
      icon: 'IconProgressCheck',
      defaultValue: "'TODO'",
      options: PROJECT_TASK_STATUS_OPTIONS,
    },
    {
      universalIdentifier: PROJECT_TASK_DUE_DATE_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.DATE,
      name: 'dueDate',
      label: 'Échéance',
      description: "Interne à l'équipe, jamais envoyée au site",
      icon: 'IconCalendarDue',
      isNullable: true,
    },
    {
      universalIdentifier: PROJECT_TASK_SITE_ID_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'siteId',
      label: 'ID tâche site',
      description: 'Identifiant de la tâche sur interfaze.fr',
      icon: 'IconPlug',
      isNullable: true,
      isUIEditable: false,
    },
    {
      universalIdentifier:
        PROJECT_TASK_SITE_UPDATED_AT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.DATE_TIME,
      name: 'siteUpdatedAt',
      label: 'Modifié sur le site le',
      description: 'Date de la dernière version du site appliquée ou envoyée',
      icon: 'IconPlug',
      isNullable: true,
      isUIEditable: false,
    },
    {
      universalIdentifier: PROJECT_TASK_SYNC_HASH_FIELD_UNIVERSAL_IDENTIFIER,
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
