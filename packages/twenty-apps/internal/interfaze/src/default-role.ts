import {
  defineApplicationRole,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import { DEFAULT_ROLE_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { MAINTENANCE_CONTRACT_UNIVERSAL_IDENTIFIER } from 'src/objects/maintenance-contract.object';
import { PAGE_UNIVERSAL_IDENTIFIER } from 'src/objects/page.object';
import { PROJECT_UNIVERSAL_IDENTIFIER } from 'src/objects/project.object';
import { PROJECT_PHASE_UNIVERSAL_IDENTIFIER } from 'src/objects/project-phase.object';
import { PROJECT_TASK_UNIVERSAL_IDENTIFIER } from 'src/objects/project-task.object';

const READ_AND_UPDATE = {
  canReadObjectRecords: true,
  canUpdateObjectRecords: true,
  canSoftDeleteObjectRecords: false,
  canDestroyObjectRecords: false,
};

const READ_ONLY = {
  canReadObjectRecords: true,
  canUpdateObjectRecords: false,
  canSoftDeleteObjectRecords: false,
  canDestroyObjectRecords: false,
};

export default defineApplicationRole({
  universalIdentifier: DEFAULT_ROLE_UNIVERSAL_IDENTIFIER,
  label: 'Interfaze function role',
  description:
    'Rôle des automatismes Interfaze : lit et met à jour les opportunités, sociétés, projets et tâches.',
  canReadAllObjectRecords: false,
  canUpdateAllObjectRecords: false,
  canSoftDeleteAllObjectRecords: false,
  canDestroyAllObjectRecords: false,
  canUpdateAllSettings: false,
  canBeAssignedToAgents: false,
  canBeAssignedToUsers: false,
  canBeAssignedToApiKeys: false,
  objectPermissions: [
    ...[
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.taskTarget.universalIdentifier,
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.noteTarget.universalIdentifier,
      PROJECT_UNIVERSAL_IDENTIFIER,
      PROJECT_PHASE_UNIVERSAL_IDENTIFIER,
      PAGE_UNIVERSAL_IDENTIFIER,
    ].map((objectUniversalIdentifier) => ({
      objectUniversalIdentifier,
      ...READ_AND_UPDATE,
    })),
    // Soft delete serves the trash cascade of tracker phases and the three-year purge of site leads.
    ...[
      PROJECT_TASK_UNIVERSAL_IDENTIFIER,
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.universalIdentifier,
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.company.universalIdentifier,
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.note.universalIdentifier,
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.task.universalIdentifier,
    ].map((objectUniversalIdentifier) => ({
      objectUniversalIdentifier,
      ...READ_AND_UPDATE,
      canSoftDeleteObjectRecords: true,
    })),
    ...[
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember.universalIdentifier,
      MAINTENANCE_CONTRACT_UNIVERSAL_IDENTIFIER,
    ].map((objectUniversalIdentifier) => ({
      objectUniversalIdentifier,
      ...READ_ONLY,
    })),
  ],
});
