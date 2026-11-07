import { CoreApiClient } from 'twenty-client-sdk/core';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  randomDigits,
  siteRest,
  sleep,
  waitFor,
} from 'src/__tests__/utils/integration-helpers';
import { TRACKER_TEMPLATES } from 'src/constants/tracker-templates';
import { buildTrackerSyncDependencies } from 'src/utils/push-trackers';
import { runReconciliation } from 'src/utils/reconcile-site';
import {
  getEdgeNodes,
  type RecordApiClient,
  toRecordApiClient,
} from 'src/utils/record-api-client';
import { patchSiteLead } from 'src/utils/supabase-leads';
import {
  type SitePhase,
  type SiteTask,
  type SiteTracker,
} from 'src/utils/tracker-mapping';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SITE_URL = process.env.SITE_URL ?? 'http://localhost:3000';

type ProjectTaskNode = {
  id: string;
  name: string;
  status: string;
  siteId: string | null;
};

const PROJECT_NAME = `[test-interfaze] Suivi ${randomDigits(6)}`;
const SITE_CLIENT = `[test-interfaze] Atelier ${randomDigits(6)}`;

let client: RecordApiClient;
let projectId: string;
let tracker: SiteTracker;
let syncedTask: ProjectTaskNode;
let siteTrackerId: string;
let sitePhaseId: string;
let siteTaskId: string;

const projectTasks = async (forProjectId: string): Promise<ProjectTaskNode[]> =>
  getEdgeNodes<ProjectTaskNode>(
    await client.query({
      projectTasks: {
        __args: { filter: { projectId: { eq: forProjectId } }, first: 200 },
        edges: { node: { id: true, name: true, status: true, siteId: true } },
      },
    }),
    'projectTasks',
  );

// A single-record query on a missing record answers "Record not found".
const readRecord = async <TRecord>(
  root: 'project' | 'projectPhase' | 'projectTask' | 'company',
  id: string,
  selection: Record<string, unknown>,
): Promise<TRecord | null> =>
  client
    .query({ [root]: { __args: { filter: { id: { eq: id } } }, ...selection } })
    .then((response) => (response[root] as TRecord | null | undefined) ?? null)
    .catch(() => null);

const siteTaskRow = async (id: string) =>
  (await siteRest<SiteTask>('GET', 'tracker_tasks', `?id=eq.${id}`))[0];

describe.skipIf(!SUPABASE_URL)('tracker sync', () => {
  beforeAll(() => {
    client = toRecordApiClient(new CoreApiClient());
  });

  afterAll(async () => {
    for (const id of [tracker?.id, siteTrackerId].filter(Boolean)) {
      await siteRest('DELETE', 'trackers', `?id=eq.${id}`, undefined, {
        fromHubFaze: true,
      }).catch(() => undefined);
    }

    const projectIds = [projectId, siteTrackerId].filter(Boolean);

    for (const [mutationName, filter] of [
      ['destroyProjectTasks', { projectId: { in: projectIds } }],
      ['destroyProjectPhases', { projectId: { in: projectIds } }],
      ['destroyProjects', { id: { in: projectIds } }],
      ['destroyCompanies', { name: { eq: SITE_CLIENT } }],
    ] as const) {
      await client
        .mutation({ [mutationName]: { __args: { filter }, id: true } })
        .catch(() => undefined);
    }
  });

  it('sends a project made in HubFaze, with its phases and tasks, to the site', async () => {
    const { createProject } = await client.mutation({
      createProject: {
        __args: {
          data: { name: PROJECT_NAME, offer: 'WEB', status: 'IN_PROGRESS' },
        },
        id: true,
      },
    });

    projectId = (createProject as { id: string }).id;
    tracker = await waitFor(
      async () =>
        (
          await siteRest<SiteTracker>(
            'GET',
            'trackers',
            `?crm_id=eq.${projectId}`,
          )
        )[0],
    );

    expect(tracker).toMatchObject({
      client_name: PROJECT_NAME,
      offer: 'web',
      is_active: true,
    });
    expect(tracker.token).toMatch(/^[A-Za-z0-9_-]{32}$/);

    const expectedTaskCount = TRACKER_TEMPLATES.WEB.reduce(
      (count, phase) => count + phase.tasks.length,
      0,
    );
    const phases = await waitFor(async () => {
      const rows = await siteRest<SitePhase>(
        'GET',
        'tracker_phases',
        `?tracker_id=eq.${tracker.id}`,
      );

      return rows.length === TRACKER_TEMPLATES.WEB.length ? rows : undefined;
    });

    await waitFor(async () => {
      const rows = await siteRest<SiteTask>(
        'GET',
        'tracker_tasks',
        `?phase_id=in.(${phases.map(({ id }) => id).join(',')})`,
      );

      return rows.length === expectedTaskCount ? rows : undefined;
    });

    const project = await waitFor(async () => {
      const found = await readRecord<{
        trackerUrl: { primaryLinkUrl: string } | null;
      }>('project', projectId, { trackerUrl: { primaryLinkUrl: true } });

      return found?.trackerUrl?.primaryLinkUrl ? found : undefined;
    });

    expect(project.trackerUrl?.primaryLinkUrl).toBe(
      `${SITE_URL}/suivi/${tracker.token}`,
    );
  });

  it('sends a task checked in HubFaze to the site', async () => {
    syncedTask = await waitFor(async () =>
      (await projectTasks(projectId)).find(({ siteId }) => siteId !== null),
    );

    await client.mutation({
      updateProjectTask: {
        __args: { id: syncedTask.id, data: { status: 'DONE' } },
        id: true,
      },
    });

    await waitFor(async () =>
      (await siteTaskRow(syncedTask.siteId as string))?.status === 'done'
        ? true
        : undefined,
    );
  });

  it('applies a task changed on the site, without sending it back', async () => {
    await siteRest('PATCH', 'tracker_tasks', `?id=eq.${syncedTask.siteId}`, {
      status: 'doing',
    });

    await waitFor(async () =>
      (
        await readRecord<{ status: string }>('projectTask', syncedTask.id, {
          status: true,
        })
      )?.status === 'DOING'
        ? true
        : undefined,
    );

    const settled = await siteTaskRow(syncedTask.siteId as string);

    await sleep(3_000);

    expect((await siteTaskRow(syncedTask.siteId as string)).updated_at).toBe(
      settled.updated_at,
    );
  });

  it('repairs a lost call with the reconciliation', async () => {
    const renamed = `Atelier renommé ${randomDigits(4)}`;

    // With the HubFaze header the trigger stays silent, exactly as when the call is lost.
    await siteRest(
      'PATCH',
      'tracker_tasks',
      `?id=eq.${syncedTask.siteId}`,
      { name: renamed },
      {
        fromHubFaze: true,
      },
    );
    await sleep(2_000);

    expect(
      (
        await readRecord<{ name: string }>('projectTask', syncedTask.id, {
          name: true,
        })
      )?.name,
    ).not.toBe(renamed);

    const trackers = buildTrackerSyncDependencies(process.env);

    if (trackers === null) {
      throw new Error(
        'SUPABASE_URL, SUPABASE_SECRET_KEY and HUBFAZE_WEBHOOK_SECRET are required',
      );
    }

    const summary = await runReconciliation(
      client,
      { settings: trackers.settings, patchLead: patchSiteLead, trackers },
      { now: new Date(), full: false },
    );

    expect(summary.failures).toBe(0);

    expect(
      (
        await readRecord<{ name: string }>('projectTask', syncedTask.id, {
          name: true,
        })
      )?.name,
    ).toBe(renamed);
  });

  it('creates the project of a tracker made on the site, with its client company', async () => {
    const [siteTracker] = await siteRest<SiteTracker>('POST', 'trackers', '', {
      client_name: SITE_CLIENT,
      offer: 'shop',
      token: `code-de-test-${randomDigits(20)}`,
    });
    const [sitePhase] = await siteRest<SitePhase>(
      'POST',
      'tracker_phases',
      '',
      {
        tracker_id: siteTracker.id,
        name: 'On échange',
        position: 0,
      },
    );
    const [siteTask] = await siteRest<SiteTask>('POST', 'tracker_tasks', '', {
      phase_id: sitePhase.id,
      name: 'Atelier de cadrage',
      position: 0,
    });

    siteTrackerId = siteTracker.id;
    sitePhaseId = sitePhase.id;
    siteTaskId = siteTask.id;

    const project = await waitFor(() =>
      readRecord<{
        id: string;
        status: string;
        offer: string;
        company: { name: string; clientStatus: string } | null;
      }>('project', siteTrackerId, {
        id: true,
        status: true,
        offer: true,
        company: { name: true, clientStatus: true },
      }).then((found) => found ?? undefined),
    );

    expect(project).toMatchObject({
      status: 'IN_PROGRESS',
      offer: 'SHOP',
      company: { name: SITE_CLIENT, clientStatus: 'CLIENT' },
    });
    await waitFor(() =>
      readRecord('projectTask', siteTaskId, { id: true }).then(
        (found) => found ?? undefined,
      ),
    );
    expect(
      await readRecord('projectPhase', sitePhaseId, { id: true }),
    ).not.toBeNull();
    await waitFor(async () =>
      (await siteTaskRow(siteTaskId))?.crm_id === siteTaskId ? true : undefined,
    );
  });

  it('archives the project of a tracker deleted on the site, keeping its phases and tasks', async () => {
    await siteRest('DELETE', 'trackers', `?id=eq.${siteTrackerId}`);

    await waitFor(async () =>
      (
        await readRecord<{ status: string }>('project', siteTrackerId, {
          status: true,
        })
      )?.status === 'ARCHIVED'
        ? true
        : undefined,
    );
    expect(
      await readRecord('projectPhase', sitePhaseId, { id: true }),
    ).not.toBeNull();
    expect(
      await readRecord('projectTask', siteTaskId, { id: true }),
    ).not.toBeNull();
  });
});
