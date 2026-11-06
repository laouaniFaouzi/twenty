import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createMockRecordApiClient,
  type MockRecordApiClient,
} from 'src/__tests__/utils/create-mock-record-api-client';
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
import { type SyncSettings } from 'src/utils/sync-settings';

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

const SETTINGS: SyncSettings = {
  supabaseUrl: 'https://abc.supabase.co',
  supabaseSecretKey: 'sb_secret_xyz',
  webhookSecret: 'webhook-secret',
  leadOwnerEmail: null,
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

let client: MockRecordApiClient;
const patchLead = vi.fn();

const deliverWithSecret = (secret: string | undefined, body: unknown) =>
  handleSiteWebhook(
    client,
    { secret, body },
    { settings: SETTINGS, patchLead },
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

  it('acknowledges and ignores the tables of later lots', async () => {
    expect(
      await deliver({
        table: 'trackers',
        type: 'INSERT',
        record: { id: 'T1' },
      }),
    ).toEqual({ status: 200, message: 'Table trackers ignorée' });
    expect(client.query).not.toHaveBeenCalled();
  });
});
