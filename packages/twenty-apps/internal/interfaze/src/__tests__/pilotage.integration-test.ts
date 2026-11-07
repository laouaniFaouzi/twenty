import { CoreApiClient } from 'twenty-client-sdk/core';
import { MetadataApiClient } from 'twenty-client-sdk/metadata';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  type DashboardWidget,
  loadDashboardWidgets,
  widgetBreakdown,
  widgetTotal,
} from 'src/__tests__/utils/dashboard-figures';
import {
  siteRest,
  sleep,
  waitFor,
} from 'src/__tests__/utils/integration-helpers';
import { addDays, agencyToday } from 'src/utils/agency-date';
import {
  createRenewalTasks,
  renewalTaskTitle,
} from 'src/utils/create-renewal-tasks';
import { maintenanceProposalTitle } from 'src/utils/handle-project-launch';
import {
  getEdgeNodes,
  type RecordApiClient,
  toRecordApiClient,
} from 'src/utils/record-api-client';
import { refreshResponseOverdue } from 'src/utils/refresh-response-overdue';

const PREFIX = '[test-pilotage]';
const COMPANY_NAME = `${PREFIX} Fromagerie`;
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

const TOTAL_WIDGETS = [
  'Nouvelles demandes sur 7 jours',
  'Demandes sans réponse après 48 h',
  'Montant signé ce mois',
  'Revenu récurrent mensuel',
  'Tâches de suivi en retard',
  'Contrats à renouveler sous 30 jours',
  'Erreurs de synchro sur 24 h',
] as const;

const BREAKDOWN_WIDGETS = [
  'Pipeline par étape (montants)',
  'Projets en cours par offre',
  'Demandes par source sur 6 mois',
] as const;

type Snapshot = Record<string, number | Record<string, number>>;

let client: RecordApiClient;
let metadata: MetadataApiClient;
let widgets: Map<string, DashboardWidget>;
let baseline: Snapshot;
let seeded: Snapshot;
let companyId: string;
const opportunityIds: Record<string, string> = {};
const projectIds: Record<string, string> = {};
const contractIds: Record<string, string> = {};
const syncLogIds: string[] = [];

const widget = (title: string): DashboardWidget => {
  const found = widgets.get(title);

  if (!found) {
    throw new Error(`No widget titled ${title}`);
  }

  return found;
};

const snapshot = async (): Promise<Snapshot> => {
  const figures: Snapshot = {};

  for (const title of TOTAL_WIDGETS) {
    figures[title] = await widgetTotal(metadata, widget(title));
  }

  for (const title of BREAKDOWN_WIDGETS) {
    figures[title] = await widgetBreakdown(metadata, widget(title));
  }

  return figures;
};

const totalDelta = (after: Snapshot, before: Snapshot, title: string) =>
  (after[title] as number) - (before[title] as number);

const breakdownDelta = (
  after: Snapshot,
  before: Snapshot,
  title: string,
  keys: string[],
) =>
  Object.fromEntries(
    keys.map((key) => [
      key,
      ((after[title] as Record<string, number>)[key] ?? 0) -
        ((before[title] as Record<string, number>)[key] ?? 0),
    ]),
  );

const create = async (
  objectName: string,
  data: Record<string, unknown>,
): Promise<string> => {
  const mutationName = `create${objectName.charAt(0).toUpperCase()}${objectName.slice(1)}`;
  const response = await client.mutation({
    [mutationName]: { __args: { data }, id: true },
  });

  return (response[mutationName] as { id: string }).id;
};

const update = async (
  objectName: string,
  id: string,
  data: Record<string, unknown>,
) => {
  await client.mutation({
    [`update${objectName.charAt(0).toUpperCase()}${objectName.slice(1)}`]: {
      __args: { id, data },
      id: true,
    },
  });
};

const euros = (amount: number) => ({
  amountMicros: amount * 1_000_000,
  currencyCode: 'EUR',
});

type LinkedTask = { task: { id: string; title: string } | null };

const tasksLinkedTo = async (
  targetField: string,
  recordId: string,
): Promise<string[]> =>
  getEdgeNodes<LinkedTask>(
    await client.query({
      taskTargets: {
        __args: { filter: { [targetField]: { eq: recordId } }, first: 50 },
        edges: { node: { task: { id: true, title: true } } },
      },
    }),
    'taskTargets',
  )
    .map(({ task }) => task?.title)
    .filter((title): title is string => title !== undefined);

describe('Pilotage dashboard figures', () => {
  beforeAll(async () => {
    client = toRecordApiClient(new CoreApiClient());
    metadata = new MetadataApiClient();
    widgets = await loadDashboardWidgets(metadata, 'Pilotage');

    await refreshResponseOverdue(client, new Date());
    baseline = await snapshot();

    const now = Date.now();
    const today = agencyToday(new Date(now));
    const at = (offset: number) => new Date(now + offset).toISOString();

    companyId = await create('company', { name: COMPANY_NAME });

    const opportunities: [string, Record<string, unknown>][] = [
      [
        'O1',
        {
          interfazeStage: 'NEW_REQUEST',
          receivedAt: at(-HOUR),
          requestSource: 'HOME',
        },
      ],
      [
        'O2',
        {
          interfazeStage: 'NEW_REQUEST',
          receivedAt: at(-3 * DAY),
          requestSource: 'CONTACT',
        },
      ],
      [
        'O3',
        {
          interfazeStage: 'NEW_REQUEST',
          receivedAt: at(-10 * DAY),
          requestSource: 'OFFER_WEB',
        },
      ],
      [
        'O4',
        {
          interfazeStage: 'NEW_REQUEST',
          receivedAt: at(-240 * DAY),
          requestSource: 'OFFER_SHOP',
        },
      ],
      ['O5', { interfazeStage: 'DISCUSSION', amount: euros(1000) }],
      ['O6', { interfazeStage: 'QUOTE_SENT', amount: euros(2500) }],
      ['O7', { interfazeStage: 'LOST', amount: euros(9000) }],
      ['O8', { interfazeStage: 'WON', amount: euros(4000), closeDate: at(0) }],
    ];

    for (const [key, data] of opportunities) {
      opportunityIds[key] = await create('opportunity', {
        name: `${PREFIX} ${key}`,
        companyId,
        ...data,
      });
    }

    const projects: [string, Record<string, unknown>][] = [
      ['P1', { offer: 'WEB', status: 'IN_PROGRESS' }],
      ['P2', { offer: 'WEB', status: 'IN_PROGRESS' }],
      ['P3', { offer: 'SMART', status: 'IN_PROGRESS', companyId }],
      ['P4', { offer: 'SHOP', status: 'ARCHIVED' }],
    ];

    for (const [key, data] of projects) {
      projectIds[key] = await create('project', {
        name: `${PREFIX} ${key}`,
        ...data,
      });
    }

    const firstPhaseId = await waitFor(
      async () =>
        getEdgeNodes<{ id: string }>(
          await client.query({
            projectPhases: {
              __args: {
                filter: { projectId: { eq: projectIds.P1 } },
                first: 1,
              },
              edges: { node: { id: true } },
            },
          }),
          'projectPhases',
        )[0]?.id,
    );

    const trackerTasks: [string, string, string][] = [
      ['late', addDays(today, -2), 'TODO'],
      ['late but done', addDays(today, -2), 'DONE'],
      ['not due yet', addDays(today, 2), 'TODO'],
    ];

    for (const [label, dueDate, status] of trackerTasks) {
      await create('projectTask', {
        name: `${PREFIX} ${label}`,
        phaseId: firstPhaseId,
        dueDate,
        status,
        position: 100,
      });
    }

    const contracts: [string, string, number, string][] = [
      ['K1', 'ACTIVE', 100, addDays(today, 10)],
      ['K2', 'ACTIVE', 50, addDays(today, 60)],
      ['K3', 'TERMINATED', 70, addDays(today, 5)],
      ['K4', 'ACTIVE', 30, addDays(today, -3)],
      ['K5', 'ACTIVE', 20, today],
    ];

    for (const [key, status, amount, renewalDate] of contracts) {
      contractIds[key] = await create('maintenanceContract', {
        name: `${PREFIX} ${key}`,
        status,
        monthlyAmount: euros(amount),
        renewalDate,
        companyId,
      });
    }

    for (const offset of [-HOUR, -30 * HOUR]) {
      syncLogIds.push(
        await create('syncLog', {
          name: `${PREFIX} failure`,
          occurredAt: at(offset),
          direction: 'RECONCILIATION',
          entity: 'TASK',
          error: 'test',
        }),
      );
    }

    await refreshResponseOverdue(client, new Date());

    // Projects signed or seeded run their automations on the worker.
    await sleep(5_000);
    seeded = await snapshot();
  });

  afterAll(async () => {
    const allProjectIds = Object.values(projectIds);

    if (process.env.SUPABASE_URL && allProjectIds.length > 0) {
      await siteRest(
        'DELETE',
        'trackers',
        `?crm_id=in.(${allProjectIds.join(',')})`,
        undefined,
        { fromHubFaze: true },
      ).catch(() => undefined);
    }

    const tasks = getEdgeNodes<{ id: string }>(
      await client.query({
        tasks: {
          __args: { filter: { title: { ilike: `%${PREFIX}%` } }, first: 100 },
          edges: { node: { id: true } },
        },
      }),
      'tasks',
    ).map(({ id }) => id);

    for (const [mutationName, filter] of [
      ['destroyTasks', { id: { in: tasks } }],
      ['destroyProjectTasks', { projectId: { in: allProjectIds } }],
      ['destroyProjectPhases', { projectId: { in: allProjectIds } }],
      ['destroyProjects', { id: { in: allProjectIds } }],
      [
        'destroyMaintenanceContracts',
        { id: { in: Object.values(contractIds) } },
      ],
      ['destroySyncLogs', { id: { in: syncLogIds } }],
      ['destroyOpportunities', { id: { in: Object.values(opportunityIds) } }],
      ['destroyCompanies', { id: { in: [companyId].filter(Boolean) } }],
    ] as const) {
      await client
        .mutation({ [mutationName]: { __args: { filter }, id: true } })
        .catch(() => undefined);
    }
  });

  it('shows the right figures on the dashboard', () => {
    expect(
      Object.fromEntries(
        TOTAL_WIDGETS.map((title) => [
          title,
          totalDelta(seeded, baseline, title),
        ]),
      ),
    ).toEqual({
      'Nouvelles demandes sur 7 jours': 2,
      'Demandes sans réponse après 48 h': 3,
      'Montant signé ce mois': 4000,
      'Revenu récurrent mensuel': 200,
      'Tâches de suivi en retard': 1,
      'Contrats à renouveler sous 30 jours': 3,
      'Erreurs de synchro sur 24 h': 1,
    });

    expect(
      breakdownDelta(seeded, baseline, 'Pipeline par étape (montants)', [
        'NEW_REQUEST',
        'DISCUSSION',
        'QUOTE_SENT',
      ]),
    ).toEqual({ NEW_REQUEST: 0, DISCUSSION: 1000, QUOTE_SENT: 2500 });
    expect(Object.keys(seeded['Pipeline par étape (montants)'])).not.toEqual(
      expect.arrayContaining(['LOST']),
    );
    expect(Object.keys(seeded['Pipeline par étape (montants)'])).not.toEqual(
      expect.arrayContaining(['WON']),
    );

    expect(
      breakdownDelta(seeded, baseline, 'Projets en cours par offre', [
        'WEB',
        'SMART',
        'SHOP',
      ]),
    ).toEqual({ WEB: 2, SMART: 1, SHOP: 0 });

    expect(
      breakdownDelta(seeded, baseline, 'Demandes par source sur 6 mois', [
        'HOME',
        'CONTACT',
        'OFFER_WEB',
        'OFFER_SHOP',
      ]),
    ).toEqual({ HOME: 1, CONTACT: 1, OFFER_WEB: 1, OFFER_SHOP: 0 });
  });

  it('drops a request from the overdue count as soon as it leaves Nouvelle demande', async () => {
    await update('opportunity', opportunityIds.O3, {
      interfazeStage: 'DISCUSSION',
    });

    expect(
      (await widgetTotal(
        metadata,
        widget('Demandes sans réponse après 48 h'),
      )) - (seeded['Demandes sans réponse après 48 h'] as number),
    ).toBe(-1);
  });

  it('marks a launched project and proposes a maintenance contract once', async () => {
    const proposal = maintenanceProposalTitle(COMPANY_NAME);
    const today = agencyToday(new Date());

    await update('project', projectIds.P3, { launchedAt: today });

    await waitFor(async () => {
      const response = await client.query({
        projects: {
          __args: { filter: { id: { eq: projectIds.P3 } }, first: 1 },
          edges: { node: { status: true } },
        },
      });

      return getEdgeNodes<{ status: string }>(response, 'projects')[0]
        ?.status === 'LAUNCHED'
        ? true
        : undefined;
    });

    await waitFor(async () =>
      (await tasksLinkedTo('targetProjectId', projectIds.P3)).includes(proposal)
        ? true
        : undefined,
    );

    await update('project', projectIds.P3, { launchedAt: addDays(today, -1) });
    await sleep(5_000);

    expect(
      (await tasksLinkedTo('targetProjectId', projectIds.P3)).filter(
        (title) => title === proposal,
      ),
    ).toHaveLength(1);

    expect(
      breakdownDelta(await snapshot(), seeded, 'Projets en cours par offre', [
        'SMART',
      ]),
    ).toEqual({ SMART: -1 });
  });

  it('creates each renewal task once', async () => {
    const tasksByContract = async () =>
      Object.fromEntries(
        await Promise.all(
          Object.entries(contractIds).map(async ([key, id]) => [
            key,
            (await tasksLinkedTo('targetMaintenanceContractId', id)).filter(
              (title) => title === renewalTaskTitle(`${PREFIX} ${key}`),
            ).length,
          ]),
        ),
      );

    await createRenewalTasks(client, { now: new Date(), leadOwnerEmail: null });

    expect(await tasksByContract()).toEqual({
      K1: 1,
      K2: 0,
      K3: 0,
      K4: 1,
      K5: 1,
    });

    const markers = getEdgeNodes<{
      id: string;
      renewalDate: string;
      renewalTaskCreatedFor: string | null;
    }>(
      await client.query({
        maintenanceContracts: {
          __args: {
            filter: {
              id: { in: [contractIds.K1, contractIds.K4, contractIds.K5] },
            },
            first: 10,
          },
          edges: {
            node: { id: true, renewalDate: true, renewalTaskCreatedFor: true },
          },
        },
      }),
      'maintenanceContracts',
    );

    expect(markers).toHaveLength(3);
    for (const { renewalDate, renewalTaskCreatedFor } of markers) {
      expect(renewalTaskCreatedFor).toBe(renewalDate);
    }

    await createRenewalTasks(client, { now: new Date(), leadOwnerEmail: null });

    expect(await tasksByContract()).toEqual({
      K1: 1,
      K2: 0,
      K3: 0,
      K4: 1,
      K5: 1,
    });
  });
});
