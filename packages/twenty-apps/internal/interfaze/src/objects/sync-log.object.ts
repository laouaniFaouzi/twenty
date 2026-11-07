import { defineObject, FieldType } from 'twenty-sdk/define';

export const SYNC_LOG_UNIVERSAL_IDENTIFIER =
  '7475722c-c4f6-4da2-a48f-a2b95db75fc0';

export const SYNC_LOG_NAME_FIELD_UNIVERSAL_IDENTIFIER =
  '7cf63772-e1ca-48d9-8150-bbf0496197ca';
export const SYNC_LOG_OCCURRED_AT_FIELD_UNIVERSAL_IDENTIFIER =
  'ff923d38-4286-45af-9c4d-b68b38bc3047';
export const SYNC_LOG_DIRECTION_FIELD_UNIVERSAL_IDENTIFIER =
  '9bc69860-b1cb-4efd-8165-a41aa9951f88';
export const SYNC_LOG_ENTITY_FIELD_UNIVERSAL_IDENTIFIER =
  '891d7986-7e72-4d76-a819-9970f4ef040e';
export const SYNC_LOG_SITE_ID_FIELD_UNIVERSAL_IDENTIFIER =
  '21624fb7-09f7-43a2-806e-c62824146319';
export const SYNC_LOG_RECORD_ID_FIELD_UNIVERSAL_IDENTIFIER =
  '8257c5a1-c34f-4584-9fa1-de231daf2515';
export const SYNC_LOG_ERROR_FIELD_UNIVERSAL_IDENTIFIER =
  '247f88f8-5f15-4645-9c25-3d14802135c0';

export type SyncDirection = 'SITE_TO_CRM' | 'CRM_TO_SITE' | 'RECONCILIATION';

export type SyncEntity = 'LEAD' | 'TRACKER' | 'PHASE' | 'TASK';

export default defineObject({
  universalIdentifier: SYNC_LOG_UNIVERSAL_IDENTIFIER,
  nameSingular: 'syncLog',
  namePlural: 'syncLogs',
  labelSingular: 'Entrée du journal de synchro',
  labelPlural: 'Journal de synchro',
  description:
    'Les échecs de synchronisation avec interfaze.fr, retentés par le rapprochement',
  icon: 'IconHistory',
  labelIdentifierFieldMetadataUniversalIdentifier:
    SYNC_LOG_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  fields: [
    {
      universalIdentifier: SYNC_LOG_NAME_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'name',
      label: 'Échec',
      icon: 'IconAbc',
    },
    {
      universalIdentifier: SYNC_LOG_OCCURRED_AT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.DATE_TIME,
      name: 'occurredAt',
      label: 'Date',
      icon: 'IconCalendarEvent',
      isNullable: true,
    },
    {
      universalIdentifier: SYNC_LOG_DIRECTION_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.SELECT,
      name: 'direction',
      label: 'Sens',
      icon: 'IconArrowsExchange',
      isNullable: true,
      options: [
        {
          id: '57cc5450-4e19-4bea-a3ac-042876bd6a4b',
          value: 'SITE_TO_CRM',
          label: 'Site → HubFaze',
          position: 0,
          color: 'sky',
        },
        {
          id: '252f668b-e458-4fae-bc5e-d42004c5228d',
          value: 'CRM_TO_SITE',
          label: 'HubFaze → site',
          position: 1,
          color: 'purple',
        },
        {
          id: 'bfbb8327-b951-4ed9-8612-60dafeb90ac0',
          value: 'RECONCILIATION',
          label: 'Rapprochement',
          position: 2,
          color: 'orange',
        },
      ],
    },
    {
      universalIdentifier: SYNC_LOG_ENTITY_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.SELECT,
      name: 'entity',
      label: 'Élément',
      icon: 'IconCategory',
      isNullable: true,
      options: [
        {
          id: 'c323c34c-affb-403b-b13d-3fff3a8ea6c3',
          value: 'LEAD',
          label: 'Demande',
          position: 0,
          color: 'blue',
        },
        {
          id: '8e0cff5e-adc3-4101-8f7f-2e8021bc290a',
          value: 'TRACKER',
          label: 'Suivi',
          position: 1,
          color: 'green',
        },
        {
          id: 'bc530dba-29a0-49e7-864f-c72d7db78fa6',
          value: 'PHASE',
          label: 'Phase',
          position: 2,
          color: 'turquoise',
        },
        {
          id: '552ea616-9d33-423c-a251-ae778c542b0a',
          value: 'TASK',
          label: 'Tâche',
          position: 3,
          color: 'yellow',
        },
      ],
    },
    {
      universalIdentifier: SYNC_LOG_SITE_ID_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'siteId',
      label: 'ID site',
      icon: 'IconPlug',
      isNullable: true,
    },
    {
      universalIdentifier: SYNC_LOG_RECORD_ID_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'recordId',
      label: 'ID HubFaze',
      icon: 'IconHash',
      isNullable: true,
    },
    {
      universalIdentifier: SYNC_LOG_ERROR_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'error',
      label: 'Erreur',
      icon: 'IconAlertTriangle',
      isNullable: true,
    },
  ],
});
