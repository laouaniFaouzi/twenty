import { CoreApiClient } from 'twenty-client-sdk/core';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  getEdgeNodes,
  type RecordApiClient,
  toRecordApiClient,
} from 'src/utils/record-api-client';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY ?? '';

const waitFor = async <TValue>(
  check: () => Promise<TValue | undefined>,
  { timeoutMs = 60_000, intervalMs = 1_000 } = {},
): Promise<TValue> => {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const value = await check();

    if (value !== undefined) {
      return value;
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error(`Condition not met within ${timeoutMs} ms`);
};

type SiteLeadRow = {
  id: string;
  ref: string;
  status: string;
  crm_id: string | null;
};

type OpportunityNode = {
  id: string;
  name: string;
  interfazeStage: string;
  pointOfContact: { id: string; emails: { primaryEmail: string } } | null;
  company: { id: string; name: string } | null;
};

type TaskNode = { id: string; title: string; status: string };

// Same calls as the site server: the secret key, no x-sync-origin header.
const siteRest = async (
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  query: string,
  body?: Record<string, unknown>,
): Promise<SiteLeadRow[]> => {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/leads${query}`, {
    method,
    headers: {
      apikey: SUPABASE_SECRET_KEY,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(
      `Site REST ${method} failed: ${response.status} ${await response.text()}`,
    );
  }

  return response.status === 204
    ? []
    : ((await response.json()) as SiteLeadRow[]);
};

const randomDigits = (length: number) =>
  String(Math.floor(Math.random() * 10 ** length)).padStart(length, '0');

const REF = `IFZ-261106-${randomDigits(4)}`;
const EMAIL = `camille.${randomDigits(6)}@exemple.fr`;
const NAME = '[test-interfaze] Camille Durand';
const COMPANY = `[test-interfaze] Atelier Durand ${randomDigits(4)}`;

let client: RecordApiClient;
let lead: SiteLeadRow;
let opportunity: OpportunityNode;

const tasksOfOpportunity = async (): Promise<TaskNode[]> =>
  getEdgeNodes<{ task: TaskNode | null }>(
    await client.query({
      taskTargets: {
        __args: {
          filter: { targetOpportunityId: { eq: opportunity.id } },
          first: 100,
        },
        edges: { node: { task: { id: true, title: true, status: true } } },
      },
    }),
    'taskTargets',
  ).flatMap(({ task }) => (task === null ? [] : [task]));

const readLead = async () => (await siteRest('GET', `?id=eq.${lead.id}`))[0];

describe.skipIf(!SUPABASE_URL)('site leads', () => {
  beforeAll(async () => {
    client = toRecordApiClient(new CoreApiClient());
    [lead] = await siteRest('POST', '', {
      ref: REF,
      source: 'offre:web',
      need: 'web',
      timing: 'asap',
      name: NAME,
      company: COMPANY,
      email: EMAIL,
      phone: '06 12 34 56 78',
      message: 'Un site pour l’atelier',
    });
  });

  afterAll(async () => {
    if (lead !== undefined) {
      await siteRest('DELETE', `?id=eq.${lead.id}`).catch(() => undefined);
    }

    if (opportunity === undefined) {
      return;
    }

    const taskIds = (await tasksOfOpportunity().catch(() => [])).map(
      ({ id }) => id,
    );

    for (const [mutationName, id] of [
      ...taskIds.map((taskId) => ['destroyTask', taskId] as const),
      ['destroyOpportunity', opportunity.id],
      ['destroyPerson', opportunity.pointOfContact?.id],
      ['destroyCompany', opportunity.company?.id],
    ] as const) {
      if (id !== undefined) {
        await client
          .mutation({ [mutationName]: { __args: { id }, id: true } })
          .catch(() => undefined);
      }
    }
  });

  it('turns a lead from the site into a person, a company, an opportunity and a reply task', async () => {
    opportunity = await waitFor(async () => {
      const [found] = getEdgeNodes<OpportunityNode>(
        await client.query({
          opportunities: {
            __args: { filter: { siteLeadId: { eq: lead.id } }, first: 1 },
            edges: {
              node: {
                id: true,
                name: true,
                interfazeStage: true,
                pointOfContact: { id: true, emails: { primaryEmail: true } },
                company: { id: true, name: true },
              },
            },
          },
        }),
        'opportunities',
      );

      return found;
    });

    expect(opportunity).toMatchObject({
      name: `${COMPANY} · WebFaze`,
      interfazeStage: 'NEW_REQUEST',
      pointOfContact: { emails: { primaryEmail: EMAIL } },
      company: { name: COMPANY },
    });

    const replyTask = await waitFor(async () =>
      (await tasksOfOpportunity()).find(
        ({ title }) => title === `Répondre à ${NAME} · ${REF}`,
      ),
    );

    expect(replyTask.status).toBe('TODO');
  });

  it('copies the opportunity id back onto the lead', async () => {
    const linked = await waitFor(async () => {
      const row = await readLead();

      return row.crm_id === null ? undefined : row;
    });

    expect(linked.crm_id).toBe(opportunity.id);
  });

  it('sends a stage change to the site and closes the reply task', async () => {
    await client.mutation({
      updateOpportunity: {
        __args: { id: opportunity.id, data: { interfazeStage: 'QUOTE_SENT' } },
        id: true,
      },
    });

    await waitFor(async () =>
      (await readLead()).status === 'in_progress' ? true : undefined,
    );

    const replyTask = await waitFor(async () =>
      (await tasksOfOpportunity()).find(
        ({ title, status }) =>
          title.startsWith('Répondre à ') && status === 'DONE',
      ),
    );

    expect(replyTask.title).toBe(`Répondre à ${NAME} · ${REF}`);
  });

  it('asks to close the opportunity when the site closes the lead, without bouncing the change back', async () => {
    await siteRest('PATCH', `?id=eq.${lead.id}`, { status: 'done' });

    const closeTask = await waitFor(async () =>
      (await tasksOfOpportunity()).find(
        ({ title }) =>
          title ===
          `Demande ${REF} clôturée sur le site : passer en Signé ou Perdu`,
      ),
    );

    expect(closeTask.status).toBe('TODO');

    await new Promise((resolve) => setTimeout(resolve, 3_000));

    const { opportunity: reread } = await client.query({
      opportunity: {
        __args: { filter: { id: { eq: opportunity.id } } },
        interfazeStage: true,
        siteLeadStatusSeen: true,
      },
    });

    expect(reread).toEqual({
      interfazeStage: 'QUOTE_SENT',
      siteLeadStatusSeen: 'done',
    });
    expect((await readLead()).status).toBe('done');
  });

  it('brings back a person from the trash when they send a new lead', async () => {
    const email = `revenant.${randomDigits(6)}@exemple.fr`;
    const { createPerson } = await client.mutation({
      createPerson: {
        __args: {
          data: {
            name: { firstName: 'Revenant', lastName: '[test-interfaze]' },
            emails: { primaryEmail: email },
          },
        },
        id: true,
      },
    });
    const trashedPersonId = (createPerson as { id: string }).id;

    await client.mutation({
      deletePerson: { __args: { id: trashedPersonId }, id: true },
    });

    const [secondLead] = await siteRest('POST', '', {
      ref: `IFZ-261106-${randomDigits(4)}`,
      source: 'contact',
      need: 'probleme',
      name: '[test-interfaze] Revenant',
      email,
    });

    let revivedOpportunityId: string | undefined;

    try {
      const revived = await waitFor(async () => {
        const [found] = getEdgeNodes<{
          id: string;
          pointOfContactId: string | null;
        }>(
          await client.query({
            opportunities: {
              __args: {
                filter: { siteLeadId: { eq: secondLead.id } },
                first: 1,
              },
              edges: { node: { id: true, pointOfContactId: true } },
            },
          }),
          'opportunities',
        );

        return found;
      });

      revivedOpportunityId = revived.id;
      expect(revived.pointOfContactId).toBe(trashedPersonId);

      const { person } = await client.query({
        person: {
          __args: { filter: { id: { eq: trashedPersonId } } },
          id: true,
          deletedAt: true,
        },
      });

      expect(person).toEqual({ id: trashedPersonId, deletedAt: null });

      await siteRest('DELETE', `?id=eq.${secondLead.id}`);
      await waitFor(async () => {
        const [stillThere] = getEdgeNodes(
          await client.query({
            opportunities: {
              __args: {
                filter: { siteLeadId: { eq: secondLead.id } },
                first: 1,
              },
              edges: { node: { id: true } },
            },
          }),
          'opportunities',
        );

        return stillThere === undefined ? true : undefined;
      });
    } finally {
      await siteRest('DELETE', `?id=eq.${secondLead.id}`).catch(
        () => undefined,
      );
      for (const [mutationName, id] of [
        ['destroyOpportunity', revivedOpportunityId],
        ['destroyPerson', trashedPersonId],
      ] as const) {
        if (id !== undefined) {
          await client
            .mutation({ [mutationName]: { __args: { id }, id: true } })
            .catch(() => undefined);
        }
      }
    }
  });

  it('refuses a call to the route without the shared secret', async () => {
    const response = await fetch(
      `${process.env.TWENTY_API_URL}/s/hubfaze/site-webhook`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-hubfaze-secret': 'wrong',
        },
        body: JSON.stringify({
          table: 'leads',
          type: 'INSERT',
          record: lead,
          old_record: null,
        }),
      },
    );

    expect(response.status).toBe(401);
  });
});
