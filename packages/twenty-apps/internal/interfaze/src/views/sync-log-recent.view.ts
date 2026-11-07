import { defineView, ViewSortDirection, ViewType } from 'twenty-sdk/define';

import {
  SYNC_LOG_DIRECTION_FIELD_UNIVERSAL_IDENTIFIER,
  SYNC_LOG_ENTITY_FIELD_UNIVERSAL_IDENTIFIER,
  SYNC_LOG_ERROR_FIELD_UNIVERSAL_IDENTIFIER,
  SYNC_LOG_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  SYNC_LOG_OCCURRED_AT_FIELD_UNIVERSAL_IDENTIFIER,
  SYNC_LOG_SITE_ID_FIELD_UNIVERSAL_IDENTIFIER,
  SYNC_LOG_UNIVERSAL_IDENTIFIER,
} from 'src/objects/sync-log.object';

export default defineView({
  universalIdentifier: '03ca4546-82ca-49dd-9db1-2ac1a9c91ef6',
  name: 'Erreurs récentes',
  objectUniversalIdentifier: SYNC_LOG_UNIVERSAL_IDENTIFIER,
  type: ViewType.TABLE,
  icon: 'IconHistory',
  position: 0,
  fields: [
    {
      universalIdentifier: '58aa3dcd-4b4f-493a-9d67-d3b9984d7aec',
      fieldMetadataUniversalIdentifier:
        SYNC_LOG_NAME_FIELD_UNIVERSAL_IDENTIFIER,
      position: 0,
      isVisible: true,
      size: 200,
    },
    {
      universalIdentifier: '2e36cd51-92e6-4475-9492-0562ca0a4415',
      fieldMetadataUniversalIdentifier:
        SYNC_LOG_OCCURRED_AT_FIELD_UNIVERSAL_IDENTIFIER,
      position: 1,
      isVisible: true,
      size: 170,
    },
    {
      universalIdentifier: 'e374366b-d552-492a-b705-f936312e57f3',
      fieldMetadataUniversalIdentifier:
        SYNC_LOG_DIRECTION_FIELD_UNIVERSAL_IDENTIFIER,
      position: 2,
      isVisible: true,
      size: 150,
    },
    {
      universalIdentifier: '4864bffc-23ba-4a33-852c-6215951aef66',
      fieldMetadataUniversalIdentifier:
        SYNC_LOG_ENTITY_FIELD_UNIVERSAL_IDENTIFIER,
      position: 3,
      isVisible: true,
      size: 120,
    },
    {
      universalIdentifier: 'c76f3f34-2a63-4a8c-87a8-bd64dc093721',
      fieldMetadataUniversalIdentifier:
        SYNC_LOG_ERROR_FIELD_UNIVERSAL_IDENTIFIER,
      position: 4,
      isVisible: true,
      size: 400,
    },
    {
      universalIdentifier: 'ed3739c2-da1f-40f6-97fd-86b393216e00',
      fieldMetadataUniversalIdentifier:
        SYNC_LOG_SITE_ID_FIELD_UNIVERSAL_IDENTIFIER,
      position: 5,
      isVisible: true,
      size: 200,
    },
  ],
  sorts: [
    {
      universalIdentifier: 'a8e5b1d4-f01d-4d45-9dee-38f6ace40502',
      fieldMetadataUniversalIdentifier:
        SYNC_LOG_OCCURRED_AT_FIELD_UNIVERSAL_IDENTIFIER,
      direction: ViewSortDirection.DESC,
    },
  ],
});
