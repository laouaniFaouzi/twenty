import { getEdgeNodes, type RecordApiClient } from 'src/utils/record-api-client';

export type InternalTaskTarget = {
  objectName: 'opportunity' | 'company' | 'person';
  recordId: string;
};

export type InternalTaskInput = {
  title: string;
  assigneeId: string | null;
  dueAt: string | null;
  target: InternalTaskTarget;
};

type LinkedTask = {
  task: { id: string; title: string | null; status: string | null } | null;
};

const TARGET_FIELD_BY_OBJECT: Record<InternalTaskTarget['objectName'], string> = {
  opportunity: 'targetOpportunityId',
  company: 'targetCompanyId',
  person: 'targetPersonId',
};

export const createInternalTask = async (
  client: RecordApiClient,
  { title, assigneeId, dueAt, target }: InternalTaskInput,
): Promise<{ created: boolean }> => {
  const targetField = TARGET_FIELD_BY_OBJECT[target.objectName];

  const response = await client.query({
    taskTargets: {
      __args: { filter: { [targetField]: { eq: target.recordId } }, first: 100 },
      edges: {
        node: { id: true, task: { id: true, title: true, status: true } },
      },
    },
  });

  const hasOpenTwin = getEdgeNodes<LinkedTask>(response, 'taskTargets').some(
    ({ task }) => task?.title === title && task.status !== 'DONE',
  );

  if (hasOpenTwin) {
    return { created: false };
  }

  const created = await client.mutation({
    createTask: {
      __args: { data: { title, status: 'TODO', assigneeId, dueAt } },
      id: true,
    },
  });

  const taskId = (created.createTask as { id: string }).id;

  await client.mutation({
    createTaskTarget: {
      __args: { data: { taskId, [targetField]: target.recordId } },
      id: true,
    },
  });

  return { created: true };
};
