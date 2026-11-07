import { CoreApiClient } from 'twenty-client-sdk/core';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { deleteSiteTrackersOf } from 'src/__tests__/utils/integration-helpers';
import {
  getEdgeNodes,
  type RecordApiClient,
  toRecordApiClient,
} from 'src/utils/record-api-client';

const COMPANY_NAME = '[test-interfaze] Boulangerie';

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

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type ProjectNode = {
  id: string;
  name: string;
  progress: number | null;
  currentPhase: string | null;
};

type TaskNode = { id: string; name: string; status: string };

let client: RecordApiClient;
let companyId: string;
let opportunityId: string;

const setStage = async (interfazeStage: string) => {
  await client.mutation({
    updateOpportunity: {
      __args: { id: opportunityId, data: { interfazeStage } },
      id: true,
    },
  });
};

const projectsOfOpportunity = async (): Promise<ProjectNode[]> =>
  getEdgeNodes<ProjectNode>(
    await client.query({
      projects: {
        __args: { filter: { opportunityId: { eq: opportunityId } } },
        edges: {
          node: { id: true, name: true, progress: true, currentPhase: true },
        },
      },
    }),
    'projects',
  );

const projectState = async (projectId: string) => {
  const response = await client.query({
    project: {
      __args: { filter: { id: { eq: projectId } } },
      id: true,
      progress: true,
      currentPhase: true,
    },
    projectPhases: {
      __args: { filter: { projectId: { eq: projectId } }, first: 50 },
      edges: { node: { id: true } },
    },
    projectTasks: {
      __args: { filter: { projectId: { eq: projectId } }, first: 50 },
      edges: { node: { id: true, name: true, status: true } },
    },
  });

  return {
    project: response.project as ProjectNode,
    phaseCount: getEdgeNodes(response, 'projectPhases').length,
    tasks: getEdgeNodes<TaskNode>(response, 'projectTasks'),
  };
};

beforeAll(async () => {
  client = toRecordApiClient(new CoreApiClient());

  const company = await client.mutation({
    createCompany: { __args: { data: { name: COMPANY_NAME } }, id: true },
  });
  companyId = (company.createCompany as { id: string }).id;

  const opportunity = await client.mutation({
    createOpportunity: {
      __args: {
        data: {
          name: '[test-interfaze] Refonte',
          companyId,
          offer: 'WEB',
          interfazeStage: 'QUOTE_SENT',
          amount: { amountMicros: 4_800_000_000, currencyCode: 'EUR' },
        },
      },
      id: true,
    },
  });
  opportunityId = (opportunity.createOpportunity as { id: string }).id;
});

afterAll(async () => {
  await deleteSiteTrackersOf(COMPANY_NAME);

  if (opportunityId) {
    await client
      .mutation({ destroyOpportunity: { __args: { id: opportunityId }, id: true } })
      .catch(() => {});
  }

  if (companyId) {
    await client
      .mutation({ destroyCompany: { __args: { id: companyId }, id: true } })
      .catch(() => {});
  }
});

describe('Interfaze lot 1', () => {
  it('turns a won opportunity into a tracked project', async () => {
    await setStage('WON');

    const [project] = await waitFor(async () => {
      const projects = await projectsOfOpportunity();

      return projects.length > 0 ? projects : undefined;
    });

    expect(project.name).toBe(`${COMPANY_NAME} · WebFaze`);
    expect(project.id).toBe(opportunityId);

    const seeded = await waitFor(async () => {
      const state = await projectState(project.id);

      return state.tasks.length === 10 && state.project.currentPhase === 'On échange'
        ? state
        : undefined;
    });

    expect(seeded.phaseCount).toBe(4);
    expect(seeded.tasks.every((task) => task.status === 'TODO')).toBe(true);
    expect(seeded.project.progress).toBe(0);

    const company = await client.query({
      company: {
        __args: { filter: { id: { eq: companyId } } },
        id: true,
        clientStatus: true,
      },
    });
    expect((company.company as { clientStatus: string }).clientStatus).toBe('CLIENT');

    const opportunity = await client.query({
      opportunity: {
        __args: { filter: { id: { eq: opportunityId } } },
        id: true,
        closeDate: true,
      },
    });
    expect((opportunity.opportunity as { closeDate: string | null }).closeDate).toBeTruthy();

    for (const taskName of ['Premier échange', 'Objectifs et contenus définis']) {
      const task = seeded.tasks.find((candidate) => candidate.name === taskName);

      await client.mutation({
        updateProjectTask: {
          __args: { id: task?.id, data: { status: 'DONE' } },
          id: true,
        },
      });
    }

    const advanced = await waitFor(async () => {
      const state = await projectState(project.id);

      return state.project.progress === 20 ? state : undefined;
    });

    expect(advanced.project.currentPhase).toBe('Vous validez le design');
  });

  it('never creates a second project when the deal is won again', async () => {
    await setStage('DISCUSSION');
    await setStage('WON');
    await sleep(5_000);

    expect(await projectsOfOpportunity()).toHaveLength(1);
  });

  it('trashes the tasks of a deleted phase and leaves them out of the progress', async () => {
    const [project] = await projectsOfOpportunity();
    const phases = getEdgeNodes<{ id: string; name: string }>(
      await client.query({
        projectPhases: {
          __args: { filter: { projectId: { eq: project.id } }, first: 50 },
          edges: { node: { id: true, name: true } },
        },
      }),
      'projectPhases',
    );
    const launchPhase = phases.find((phase) => phase.name === 'Mise en ligne');

    await client.mutation({
      deleteProjectPhase: { __args: { id: launchPhase?.id }, id: true },
    });

    const trimmed = await waitFor(async () => {
      const state = await projectState(project.id);

      return state.tasks.length === 7 && state.project.progress === 29
        ? state
        : undefined;
    });

    expect(trimmed.phaseCount).toBe(3);
  });

  it('signs an opportunity created directly in the won column', async () => {
    const created = await client.mutation({
      createOpportunity: {
        __args: {
          data: {
            name: '[test-interfaze] Signée hors ligne',
            companyId,
            offer: 'APP',
            interfazeStage: 'WON',
          },
        },
        id: true,
      },
    });
    const wonOpportunityId = (created.createOpportunity as { id: string }).id;

    try {
      const project = await waitFor(async () => {
        const response = await client.query({
          projects: {
            __args: { filter: { opportunityId: { eq: wonOpportunityId } } },
            edges: { node: { id: true, name: true } },
          },
        });
        const [node] = getEdgeNodes<ProjectNode>(response, 'projects');

        return node;
      });

      expect(project.name).toBe(`${COMPANY_NAME} · AppFaze`);
    } finally {
      await client
        .mutation({
          destroyOpportunity: { __args: { id: wonOpportunityId }, id: true },
        })
        .catch(() => {});
    }
  });
});
