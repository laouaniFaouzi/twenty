import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  answerQueries,
  createMockRecordApiClient,
  type MockRecordApiClient,
  mutationArgs,
  mutationNames,
  queryFilters,
} from 'src/__tests__/utils/create-mock-record-api-client';
import { type InterfazeStage } from 'src/fields/opportunity-interfaze-stage.field';
import { handleOpportunityStageChange } from 'src/utils/handle-opportunity-stage-change';
import { type patchSiteLead } from 'src/utils/supabase-leads';
import { type SyncSettings } from 'src/utils/sync-settings';

const SETTINGS: SyncSettings = {
  supabaseUrl: 'https://abc.supabase.co',
  supabaseSecretKey: 'sb_secret_xyz',
  webhookSecret: 'webhook-secret',
  leadOwnerEmail: null,
};

let client: MockRecordApiClient;
let patchLead: ReturnType<typeof vi.fn<typeof patchSiteLead>>;

const stageChange = (
  before: InterfazeStage,
  after: InterfazeStage,
  {
    siteLeadId = 'L1',
    siteLeadStatusSeen = 'new',
  }: { siteLeadId?: string | null; siteLeadStatusSeen?: string | null } = {},
) => ({
  recordId: 'O1',
  properties: {
    before: { interfazeStage: before },
    after: { interfazeStage: after, siteLeadId, siteLeadStatusSeen },
  },
});

const run = (
  event: ReturnType<typeof stageChange>,
  settings: SyncSettings | null = SETTINGS,
) => handleOpportunityStageChange(client, event, { settings, patchLead });

beforeEach(() => {
  client = createMockRecordApiClient();
  patchLead = vi.fn<typeof patchSiteLead>().mockResolvedValue(undefined);
  answerQueries(client, {});
});

describe('handleOpportunityStageChange', () => {
  it('sends the new stage to the site lead and remembers the status sent', async () => {
    await run(
      stageChange('DISCUSSION', 'WON', { siteLeadStatusSeen: 'in_progress' }),
    );

    expect(patchLead).toHaveBeenCalledWith(SETTINGS, 'L1', { status: 'done' });
    expect(mutationArgs(client, 'updateOpportunity')).toEqual([
      { id: 'O1', data: { siteLeadStatusSeen: 'done' } },
    ]);
  });

  it('does not call the site again for a status it already has, which stops the two sides from looping', async () => {
    await run(
      stageChange('NEW_REQUEST', 'DISCUSSION', {
        siteLeadStatusSeen: 'in_progress',
      }),
    );
    await run(
      stageChange('DISCUSSION', 'QUOTE_SENT', {
        siteLeadStatusSeen: 'in_progress',
      }),
    );

    expect(patchLead).not.toHaveBeenCalled();
    expect(mutationNames(client)).not.toContain('updateOpportunity');
  });

  it('never calls the site for an opportunity that did not come from it', async () => {
    await run(stageChange('DISCUSSION', 'WON', { siteLeadId: null }));

    expect(patchLead).not.toHaveBeenCalled();
  });

  it('never calls the site while the sync is not configured', async () => {
    await run(
      stageChange('DISCUSSION', 'WON', { siteLeadStatusSeen: 'in_progress' }),
      null,
    );

    expect(patchLead).not.toHaveBeenCalled();
  });

  it('marks the unfinished reply tasks done when the opportunity leaves new request', async () => {
    answerQueries(client, {
      taskTargets: () => [
        {
          id: 'TT1',
          task: {
            id: 'T1',
            title: 'Répondre à Marie Curie · IFZ-261106-0042',
            status: 'TODO',
          },
        },
        {
          id: 'TT2',
          task: {
            id: 'T2',
            title: "Choisir l'offre de Boulangerie Martin",
            status: 'TODO',
          },
        },
        {
          id: 'TT3',
          task: {
            id: 'T3',
            title: 'Répondre à Léo · IFZ-261001-0001',
            status: 'DONE',
          },
        },
      ],
    });

    await run(stageChange('NEW_REQUEST', 'DISCUSSION'));

    expect(queryFilters(client, 'taskTargets')).toEqual([
      { targetOpportunityId: { eq: 'O1' } },
    ]);
    expect(mutationArgs(client, 'updateTask')).toEqual([
      { id: 'T1', data: { status: 'DONE' } },
    ]);
  });

  it('leaves reply tasks alone between later stages', async () => {
    await run(
      stageChange('DISCUSSION', 'QUOTE_SENT', {
        siteLeadStatusSeen: 'in_progress',
      }),
    );

    expect(client.query).not.toHaveBeenCalled();
  });

  it('closes the reply tasks before calling the site, so a site error cannot leave them open', async () => {
    answerQueries(client, {
      taskTargets: () => [
        {
          id: 'TT1',
          task: {
            id: 'T1',
            title: 'Répondre à Marie Curie · IFZ-261106-0042',
            status: 'TODO',
          },
        },
      ],
    });
    patchLead.mockRejectedValue(
      new Error('Supabase a refusé la mise à jour de la demande L1 (500)'),
    );

    await expect(run(stageChange('NEW_REQUEST', 'DISCUSSION'))).rejects.toThrow(
      '(500)',
    );
    expect(mutationNames(client)).toEqual(['updateTask']);
  });

  it('ignores an event where the stage did not change', async () => {
    await run(stageChange('DISCUSSION', 'DISCUSSION'));

    expect(client.query).not.toHaveBeenCalled();
    expect(patchLead).not.toHaveBeenCalled();
  });
});
