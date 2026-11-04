import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const COMPANY_CLIENT_STATUS_FIELD_UNIVERSAL_IDENTIFIER = '96233794-eaa5-4a21-913a-326a76a2afbf';

export type ClientStatus = 'PROSPECT' | 'CLIENT' | 'FORMER_CLIENT';

export const CLIENT_STATUS_OPTIONS: {
  id: string;
  value: ClientStatus;
  label: string;
  position: number;
  color: 'gray' | 'blue' | 'green' | 'red' | 'orange' | 'purple' | 'yellow' | 'turquoise' | 'sky' | 'pink';
}[] = [
  { id: 'e040a129-9cb9-4bdb-8adf-5550a04ca205', value: 'PROSPECT', label: "Prospect", position: 0, color: 'sky' as const },
  { id: '2c101bb9-2cab-4384-8ddc-b6bea63e8768', value: 'CLIENT', label: "Client", position: 1, color: 'green' as const },
  { id: 'b49d63c0-3657-487d-80d7-a6bb65ffb1cb', value: 'FORMER_CLIENT', label: "Ancien client", position: 2, color: 'gray' as const },
];

export default defineField({
  universalIdentifier: COMPANY_CLIENT_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.company.universalIdentifier,
  type: FieldType.SELECT,
  name: 'clientStatus',
  label: "Statut client",
  description: "Prospect, client ou ancien client",
  icon: 'IconUserCheck',
  defaultValue: "'PROSPECT'",
  options: CLIENT_STATUS_OPTIONS,
});
