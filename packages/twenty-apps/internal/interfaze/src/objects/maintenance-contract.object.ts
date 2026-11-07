import { defineObject, FieldType } from 'twenty-sdk/define';

export type MaintenanceContractStatus = 'ACTIVE' | 'TERMINATED';

export const MAINTENANCE_CONTRACT_UNIVERSAL_IDENTIFIER = 'b7594a34-9bff-4036-9a0d-aae18132fdb1';

export const MAINTENANCE_CONTRACT_NAME_FIELD_UNIVERSAL_IDENTIFIER = 'ed173f7a-9463-4d0a-bcbf-feebd0012574';
export const MAINTENANCE_CONTRACT_TYPE_FIELD_UNIVERSAL_IDENTIFIER = '2e43c463-a7ef-4078-8d2e-8f671e9b2817';
export const MAINTENANCE_CONTRACT_MONTHLY_AMOUNT_FIELD_UNIVERSAL_IDENTIFIER = 'bb2f054a-e59b-4f09-8b41-886ed69342e6';
export const MAINTENANCE_CONTRACT_BILLING_PERIOD_FIELD_UNIVERSAL_IDENTIFIER = '96da8867-3f58-4b89-b625-b18e55fbe89e';
export const MAINTENANCE_CONTRACT_START_DATE_FIELD_UNIVERSAL_IDENTIFIER = '424d92b1-68f8-406b-a9c7-dd1b742ce15f';
export const MAINTENANCE_CONTRACT_RENEWAL_DATE_FIELD_UNIVERSAL_IDENTIFIER = '0c5e1e32-8df3-4417-b949-0c1647734da0';
export const MAINTENANCE_CONTRACT_STATUS_FIELD_UNIVERSAL_IDENTIFIER = 'bde0438a-a362-47fd-84f6-0265cba636b2';
export const MAINTENANCE_CONTRACT_RENEWAL_TASK_CREATED_FOR_FIELD_UNIVERSAL_IDENTIFIER = 'c275190a-a844-4811-aeb8-7b2d9656e213';

export default defineObject({
  universalIdentifier: MAINTENANCE_CONTRACT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'maintenanceContract',
  namePlural: 'maintenanceContracts',
  labelSingular: 'Contrat de maintenance',
  labelPlural: 'Contrats de maintenance',
  description: "Un contrat d'hébergement ou de maintenance après la mise en ligne",
  icon: 'IconTool',
  labelIdentifierFieldMetadataUniversalIdentifier:
    MAINTENANCE_CONTRACT_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  fields: [
    {
      universalIdentifier: MAINTENANCE_CONTRACT_NAME_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'name',
      label: 'Nom',
      icon: 'IconAbc',
    },
    {
      universalIdentifier: MAINTENANCE_CONTRACT_TYPE_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.SELECT,
      name: 'contractType',
      label: 'Type',
      icon: 'IconCategory',
      isNullable: true,
      options: [
        { id: '84bedcde-3eb0-4b70-abbe-0dcf44728d1e', value: 'HOSTING', label: 'Hébergement', position: 0, color: 'sky' },
        { id: '0085574a-b433-412b-9ef1-c15635770d8c', value: 'MAINTENANCE', label: 'Maintenance', position: 1, color: 'blue' },
        { id: '519ecaf7-80c9-4f59-9d65-bfc48d8051d4', value: 'HOSTING_AND_MAINTENANCE', label: 'Hébergement + maintenance', position: 2, color: 'purple' },
        { id: '5f389565-1c73-4b54-bfaf-b869193b5e43', value: 'EVOLUTIONS', label: 'Évolutions', position: 3, color: 'orange' },
      ],
    },
    {
      universalIdentifier: MAINTENANCE_CONTRACT_MONTHLY_AMOUNT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.CURRENCY,
      name: 'monthlyAmount',
      label: 'Montant mensuel',
      description: 'Équivalent mensuel, même pour une facturation annuelle',
      icon: 'IconCurrencyEuro',
      isNullable: true,
    },
    {
      universalIdentifier: MAINTENANCE_CONTRACT_BILLING_PERIOD_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.SELECT,
      name: 'billingPeriod',
      label: 'Facturation',
      icon: 'IconReceipt',
      isNullable: true,
      options: [
        { id: '86eb9d2f-79ad-4ab8-bb3f-118c08434f4e', value: 'MONTHLY', label: 'Mensuelle', position: 0, color: 'blue' },
        { id: 'b7512a12-c20b-42f1-8d5f-2b8097d48c2e', value: 'YEARLY', label: 'Annuelle', position: 1, color: 'purple' },
      ],
    },
    {
      universalIdentifier: MAINTENANCE_CONTRACT_START_DATE_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.DATE,
      name: 'startDate',
      label: 'Début',
      icon: 'IconCalendarEvent',
      isNullable: true,
    },
    {
      universalIdentifier: MAINTENANCE_CONTRACT_RENEWAL_DATE_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.DATE,
      name: 'renewalDate',
      label: 'Renouvellement',
      icon: 'IconCalendarRepeat',
      isNullable: true,
    },
    {
      universalIdentifier: MAINTENANCE_CONTRACT_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.SELECT,
      name: 'status',
      label: 'Statut',
      icon: 'IconProgress',
      defaultValue: "'ACTIVE'",
      options: [
        { id: '2231658f-18fe-4ca8-b3f4-fa9b13e412fb', value: 'ACTIVE', label: 'Actif', position: 0, color: 'green' },
        { id: 'f265920e-29df-4219-acbf-3a81b1561d4d', value: 'TERMINATED', label: 'Résilié', position: 1, color: 'gray' },
      ],
    },
    {
      universalIdentifier: MAINTENANCE_CONTRACT_RENEWAL_TASK_CREATED_FOR_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.DATE,
      name: 'renewalTaskCreatedFor',
      label: 'Tâche de renouvellement créée pour',
      description:
        'Date de renouvellement pour laquelle la tâche « Renouveler le contrat … » existe déjà',
      icon: 'IconPlug',
      isNullable: true,
      isUIEditable: false,
    },
  ],
});
