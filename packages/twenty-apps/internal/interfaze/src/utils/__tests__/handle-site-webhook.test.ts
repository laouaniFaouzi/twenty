import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createMockRecordApiClient,
  type MockRecordApiClient,
  mutationArgs,
} from 'src/__tests__/utils/create-mock-record-api-client';
import {
  applySitePhase,
  applySitePhaseDeleted,
  applySiteTask,
  applySiteTaskDeleted,
  applySiteTracker,
  applySiteTrackerDeleted,
} from 'src/utils/apply-site-trackers';
import { handleLeadCreated } from 'src/utils/handle-lead-created';
import {
  handleLeadDeleted,
  handleLeadUpdated,
} from 'src/utils/handle-lead-changed';
import {
  handleSiteWebhook,
  isValidWebhookSecret,
} from 'src/utils/handle-site-webhook';
import { type SiteLead } from 'src/utils/lead-mapping';
import {
  type TrackerRestClient,
  type TrackerSyncDependencies,
} from 'src/utils/push-trackers';
import { type SyncSettings } from 'src/utils/sync-settings';
import {
  type SitePhase,
  type SiteTask,
  type SiteTracker,
} from 'src/utils/tracker-mapping';

vi.mock('src/utils/handle-lead-created', () => ({
  handleLeadCreated: vi.fn(async () => ({
    outcome: 'created',
    opportunityId: 'O-new',
  })),
}));

vi.mock('src/utils/handle-lead-changed', () => ({
  handleLeadUpdated: vi.fn(async () => undefined),
  handleLeadDeleted: vi.fn(async () => undefined),
}));

vi.mock('src/utils/apply-site-trackers', () => ({
  applySiteTracker: vi.fn(async () => undefined),
  applySiteTrackerDeleted: vi.fn(async () => undefined),
  applySitePhase: vi.fn(async () => undefined),
  applySitePhaseDeleted: vi.fn(async () => undefined),
  applySiteTask: vi.fn(async () => undefined),
  applySiteTaskDeleted: vi.fn(async () => undefined),
}));

const SETTINGS: SyncSettings = {
  supabaseUrl: 'https://abc.supabase.co',
  supabaseSecretKey: 'sb_secret_xyz',
  webhookSecret: 'webhook-secret',
  leadOwnerEmail: null,
  siteUrl: 'https://interfaze.fr',
};

const LEAD: SiteLead = {
  id: 'L1',
  ref: 'IFZ-261106-0042',
  source: 'contact',
  need: 'web',
  timing: null,
  name: 'Marie Curie',
  company: null,
  email: 'marie@exemple.fr',
  phone: null,
  message: null,
  status: 'new',
  crm_id: null,
  created_at: '2026-11-06T09:00:00.000Z',
};

const TRACKER: SiteTracker = {
  id: 'T1',
  client_name: 'Boulangerie Martin',
  offer: 'web',
  token: 'code',
  is_active: true,
  crm_id: null,
  updated_at: '2026-11-07T10:00:00.000Z',
};

const PHASE: SitePhase = {
  id: 'PH1',
  tracker_id: 'T1',
  name: 'On échange',
  position: 1.5,
  crm_id: null,
  updated_at: '2026-11-07T10:00:00.000Z',
};

const TASK: SiteTask = {
  id: 'TA1',
  phase_id: 'PH1',
  name: 'Atelier',
  description: '',
  status: 'doing',
  position: 2,
  crm_id: 'TA1',
  updated_at: '2026-11-07T10:00:00.000Z',
};

let client: MockRecordApiClient;
const patchLead = vi.fn();

const TRACKER_DEPS: TrackerSyncDependencies = {
  settings: SETTINGS,
  rest: {} as TrackerRestClient,
  now: () => new Date('2026-11-07T10:00:00.000Z'),
  randomToken: () => 'code',
};

const deliverWithSecret = (secret: string | undefined, body: unknown) =>
  handleSiteWebhook(
    client,
    { secret, body },
    { settings: SETTINGS, patchLead, trackers: TRACKER_DEPS },
  );

const deliver = (body: unknown) => deliverWithSecret('webhook-secret', body);

beforeEach(() => {
  client = createMockRecordApiClient();
  vi.clearAllMocks();
});

describe('isValidWebhookSecret', () => {
  it('accepts only the exact secret', () => {
    expect(isValidWebhookSecret('webhook-secret', 'webhook-secret')).toBe(true);
    expect(isValidWebhookSecret('webhook-secreT', 'webhook-secret')).toBe(
      false,
    );
    expect(isValidWebhookSecret('webhook', 'webhook-secret')).toBe(false);
    expect(isValidWebhookSecret(undefined, 'webhook-secret')).toBe(false);
    expect(isValidWebhookSecret('', '')).toBe(false);
  });
});

describe('handleSiteWebhook', () => {
  it.each([
    ['missing', undefined],
    ['wrong', 'webhook-secreT'],
    ['of another length', 'webhook-secret-longer'],
  ])(
    'refuses a call whose secret is %s, without touching anything',
    async (_, secret) => {
      const body = {
        table: 'leads',
        type: 'INSERT',
        record: LEAD,
        old_record: null,
      };

      expect(await deliverWithSecret(secret, body)).toMatchObject({
        status: 401,
      });
      expect(client.query).not.toHaveBeenCalled();
      expect(client.mutation).not.toHaveBeenCalled();
      expect(handleLeadCreated).not.toHaveBeenCalled();
    },
  );

  it.each([
    ['no body', null],
    ['a body that is not an object', 'leads'],
    ['no table', { type: 'INSERT', record: LEAD }],
    ['an unknown type', { table: 'leads', type: 'TRUNCATE', record: LEAD }],
    [
      'an insert without its row',
      { table: 'leads', type: 'INSERT', record: null },
    ],
    [
      'a delete without its old row',
      { table: 'leads', type: 'DELETE', record: null, old_record: null },
    ],
    [
      'a lead row missing its reference',
      { table: 'leads', type: 'INSERT', record: { ...LEAD, ref: undefined } },
    ],
    [
      'a lead row with an unknown status',
      {
        table: 'leads',
        type: 'UPDATE',
        record: { ...LEAD, status: 'archived' },
      },
    ],
  ])('refuses %s', async (_, body) => {
    expect(await deliver(body)).toMatchObject({ status: 400 });
    expect(handleLeadCreated).not.toHaveBeenCalled();
    expect(handleLeadUpdated).not.toHaveBeenCalled();
    expect(handleLeadDeleted).not.toHaveBeenCalled();
  });

  it('turns a new lead into records', async () => {
    const result = await deliver({
      table: 'leads',
      type: 'INSERT',
      record: LEAD,
      old_record: null,
    });

    expect(result).toEqual({
      status: 200,
      message: 'Demande IFZ-261106-0042 : created',
    });
    expect(handleLeadCreated).toHaveBeenCalledWith(client, LEAD, {
      settings: SETTINGS,
      patchLead,
      trackers: TRACKER_DEPS,
    });
  });

  it('applies a changed lead', async () => {
    const changed = { ...LEAD, status: 'in_progress' };

    expect(
      await deliver({
        table: 'leads',
        type: 'UPDATE',
        record: changed,
        old_record: LEAD,
      }),
    ).toMatchObject({ status: 200 });
    expect(handleLeadUpdated).toHaveBeenCalledWith(client, changed);
  });

  it('applies a deleted lead from its old row', async () => {
    expect(
      await deliver({
        table: 'leads',
        type: 'DELETE',
        record: null,
        old_record: LEAD,
      }),
    ).toMatchObject({ status: 200 });
    expect(handleLeadDeleted).toHaveBeenCalledWith(client, LEAD);
  });

  it('reads the optional columns of a lead as empty when the row leaves them out', async () => {
    const {
      timing: _timing,
      company: _company,
      phone: _phone,
      message: _message,
      crm_id: _crmId,
      ...required
    } = LEAD;

    await deliver({ table: 'leads', type: 'INSERT', record: required });

    expect(handleLeadCreated).toHaveBeenCalledWith(
      client,
      LEAD,
      expect.anything(),
    );
  });

  it('acknowledges and ignores a table it does not sync', async () => {
    expect(
      await deliver({ table: 'posts', type: 'INSERT', record: { id: 'X1' } }),
    ).toEqual({ status: 200, message: 'Table posts ignorée' });
    expect(client.query).not.toHaveBeenCalled();
  });

  it.each([
    ['trackers', TRACKER, applySiteTracker, applySiteTrackerDeleted],
    ['tracker_phases', PHASE, applySitePhase, applySitePhaseDeleted],
    ['tracker_tasks', TASK, applySiteTask, applySiteTaskDeleted],
  ] as const)(
    'sends the rows of %s to their handler',
    async (table, row, apply, applyDeleted) => {
      expect(
        await deliver({ table, type: 'INSERT', record: row, old_record: null }),
      ).toMatchObject({ status: 200 });
      expect(
        await deliver({ table, type: 'UPDATE', record: row, old_record: row }),
      ).toMatchObject({ status: 200 });
      expect(
        await deliver({ table, type: 'DELETE', record: null, old_record: row }),
      ).toMatchObject({ status: 200 });

      expect(apply).toHaveBeenCalledTimes(2);
      expect(apply).toHaveBeenCalledWith(client, row, TRACKER_DEPS);
      expect(applyDeleted).toHaveBeenCalledWith(client, row);
    },
  );

  it.each([
    [
      'a tracker without its code',
      'trackers',
      { ...TRACKER, token: undefined },
    ],
    [
      'a tracker with a text is_active',
      'trackers',
      { ...TRACKER, is_active: 'oui' },
    ],
    [
      'a phase with a text position',
      'tracker_phases',
      { ...PHASE, position: '1' },
    ],
    [
      'a task with an unknown status',
      'tracker_tasks',
      { ...TASK, status: 'paused' },
    ],
  ])('refuses %s', async (_, table, record) => {
    expect(await deliver({ table, type: 'UPDATE', record })).toMatchObject({
      status: 400,
    });
    expect(applySiteTracker).not.toHaveBeenCalled();
    expect(applySitePhase).not.toHaveBeenCalled();
    expect(applySiteTask).not.toHaveBeenCalled();
  });

  it('notes a failed tracker task in the Journal de synchro and answers 500', async () => {
    vi.mocked(applySiteTask).mockRejectedValueOnce(
      new Error('Phase PH1 introuvable dans HubFaze'),
    );

    expect(
      await deliver({ table: 'tracker_tasks', type: 'UPDATE', record: TASK }),
    ).toEqual({ status: 500, message: 'Phase PH1 introuvable dans HubFaze' });
    expect(mutationArgs(client, 'createSyncLog')).toEqual([
      {
        data: {
          name: 'TASK · SITE_TO_CRM',
          occurredAt: '2026-11-07T10:00:00.000Z',
          direction: 'SITE_TO_CRM',
          entity: 'TASK',
          siteId: 'TA1',
          recordId: null,
          error: 'Phase PH1 introuvable dans HubFaze',
        },
      },
    ]);
  });

  it('notes a failed lead in the Journal de synchro too', async () => {
    vi.mocked(handleLeadCreated).mockRejectedValueOnce(
      new Error('server down'),
    );

    expect(
      await deliver({ table: 'leads', type: 'INSERT', record: LEAD }),
    ).toMatchObject({ status: 500 });
    expect(mutationArgs(client, 'createSyncLog')[0]).toMatchObject({
      data: { entity: 'LEAD', siteId: 'L1', direction: 'SITE_TO_CRM' },
    });
  });
});
