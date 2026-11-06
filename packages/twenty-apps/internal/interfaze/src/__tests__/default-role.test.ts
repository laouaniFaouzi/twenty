import { STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS } from 'twenty-sdk/define';
import { describe, expect, it } from 'vitest';

import defaultRole from 'src/default-role';
import { MAINTENANCE_CONTRACT_UNIVERSAL_IDENTIFIER } from 'src/objects/maintenance-contract.object';
import { PAGE_UNIVERSAL_IDENTIFIER } from 'src/objects/page.object';
import { PROJECT_UNIVERSAL_IDENTIFIER } from 'src/objects/project.object';
import { PROJECT_PHASE_UNIVERSAL_IDENTIFIER } from 'src/objects/project-phase.object';
import { PROJECT_TASK_UNIVERSAL_IDENTIFIER } from 'src/objects/project-task.object';

const permissionFor = (objectUniversalIdentifier: string) =>
  defaultRole.config?.objectPermissions?.find(
    (permission) =>
      permission.objectUniversalIdentifier === objectUniversalIdentifier,
  );

describe('default role', () => {
  it('grants nothing workspace-wide', () => {
    expect(defaultRole.success).toBe(true);
    expect(defaultRole.config).toMatchObject({
      canReadAllObjectRecords: false,
      canUpdateAllObjectRecords: false,
      canSoftDeleteAllObjectRecords: false,
      canDestroyAllObjectRecords: false,
    });
  });

  it('grants read and update on the objects the automations touch, never delete', () => {
    for (const objectUniversalIdentifier of [
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.task.universalIdentifier,
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.taskTarget.universalIdentifier,
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.noteTarget.universalIdentifier,
      PROJECT_UNIVERSAL_IDENTIFIER,
      PROJECT_PHASE_UNIVERSAL_IDENTIFIER,
      PAGE_UNIVERSAL_IDENTIFIER,
    ]) {
      expect(permissionFor(objectUniversalIdentifier)).toMatchObject({
        canReadObjectRecords: true,
        canUpdateObjectRecords: true,
        canSoftDeleteObjectRecords: false,
        canDestroyObjectRecords: false,
      });
    }
  });

  it('can move tracker tasks to the trash with their phase, never destroy them', () => {
    expect(permissionFor(PROJECT_TASK_UNIVERSAL_IDENTIFIER)).toMatchObject({
      canReadObjectRecords: true,
      canUpdateObjectRecords: true,
      canSoftDeleteObjectRecords: true,
      canDestroyObjectRecords: false,
    });
  });

  it('can move site leads records to the trash for the three-year rule, never destroy them', () => {
    for (const objectUniversalIdentifier of [
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.universalIdentifier,
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.company.universalIdentifier,
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.note.universalIdentifier,
    ]) {
      expect(permissionFor(objectUniversalIdentifier)).toMatchObject({
        canReadObjectRecords: true,
        canUpdateObjectRecords: true,
        canSoftDeleteObjectRecords: true,
        canDestroyObjectRecords: false,
      });
    }
  });

  it.each([
    [
      'workspace members',
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember.universalIdentifier,
    ],
    ['maintenance contracts', MAINTENANCE_CONTRACT_UNIVERSAL_IDENTIFIER],
  ])('only reads %s', (_, objectUniversalIdentifier) => {
    expect(permissionFor(objectUniversalIdentifier)).toMatchObject({
      canReadObjectRecords: true,
      canUpdateObjectRecords: false,
      canSoftDeleteObjectRecords: false,
      canDestroyObjectRecords: false,
    });
  });
});
