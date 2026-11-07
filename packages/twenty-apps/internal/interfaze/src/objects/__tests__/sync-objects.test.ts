import { FieldType, ViewSortDirection, ViewType } from 'twenty-sdk/define';
import { describe, expect, it } from 'vitest';

import project from 'src/objects/project.object';
import projectPhase from 'src/objects/project-phase.object';
import projectTask from 'src/objects/project-task.object';
import syncLog, {
  SYNC_LOG_OCCURRED_AT_FIELD_UNIVERSAL_IDENTIFIER,
  SYNC_LOG_UNIVERSAL_IDENTIFIER,
} from 'src/objects/sync-log.object';
import syncLogRecentView from 'src/views/sync-log-recent.view';

type ObjectDefinition = typeof project;

const fieldNamed = (definition: ObjectDefinition, name: string) =>
  definition.config.fields?.find((field) => field.name === name);

describe('sync technical fields', () => {
  it.each([
    [project, ['siteTrackerId', 'siteUpdatedAt', 'syncHash']],
    [projectPhase, ['siteId', 'siteUpdatedAt', 'syncHash']],
    [projectTask, ['siteId', 'siteUpdatedAt', 'syncHash']],
  ])('adds the sync fields to %#, out of manual edits', (definition, names) => {
    const [siteIdName, siteUpdatedAtName, syncHashName] = names;

    expect(fieldNamed(definition, siteIdName)).toMatchObject({
      type: FieldType.TEXT,
      isNullable: true,
      isUIEditable: false,
    });
    expect(fieldNamed(definition, siteUpdatedAtName)).toMatchObject({
      type: FieldType.DATE_TIME,
      isNullable: true,
      isUIEditable: false,
    });
    expect(fieldNamed(definition, syncHashName)).toMatchObject({
      type: FieldType.TEXT,
      isNullable: true,
      isUIEditable: false,
    });
  });
});

describe('sync log', () => {
  it('defines the Journal de synchro with its fields', () => {
    expect(syncLog.success).toBe(true);
    expect(syncLog.config).toMatchObject({
      nameSingular: 'syncLog',
      namePlural: 'syncLogs',
      labelSingular: 'Entrée du journal de synchro',
      labelPlural: 'Journal de synchro',
    });
    expect(
      Object.fromEntries(
        (syncLog.config.fields ?? []).map((field) => [field.name, field.type]),
      ),
    ).toEqual({
      name: FieldType.TEXT,
      occurredAt: FieldType.DATE_TIME,
      direction: FieldType.SELECT,
      entity: FieldType.SELECT,
      siteId: FieldType.TEXT,
      recordId: FieldType.TEXT,
      error: FieldType.TEXT,
    });
  });

  it.each([
    [
      'direction',
      [
        ['SITE_TO_CRM', 'Site → HubFaze'],
        ['CRM_TO_SITE', 'HubFaze → site'],
        ['RECONCILIATION', 'Rapprochement'],
      ],
    ],
    [
      'entity',
      [
        ['LEAD', 'Demande'],
        ['TRACKER', 'Suivi'],
        ['PHASE', 'Phase'],
        ['TASK', 'Tâche'],
      ],
    ],
  ])('offers the %s values of the spec', (name, pairs) => {
    expect(
      (fieldNamed(syncLog, name)?.options ?? []).map(({ value, label }) => [
        value,
        label,
      ]),
    ).toEqual(pairs);
  });

  it('lists the most recent failures first', () => {
    expect(syncLogRecentView.success).toBe(true);
    expect(syncLogRecentView.config).toMatchObject({
      name: 'Erreurs récentes',
      objectUniversalIdentifier: SYNC_LOG_UNIVERSAL_IDENTIFIER,
      type: ViewType.TABLE,
    });
    expect(syncLogRecentView.config.sorts).toEqual([
      expect.objectContaining({
        fieldMetadataUniversalIdentifier:
          SYNC_LOG_OCCURRED_AT_FIELD_UNIVERSAL_IDENTIFIER,
        direction: ViewSortDirection.DESC,
      }),
    ]);
  });
});
