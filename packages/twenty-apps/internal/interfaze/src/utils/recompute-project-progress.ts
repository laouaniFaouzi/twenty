import { type ProjectTaskStatus } from 'src/objects/project-task.object';
import { computeProjectProgress } from 'src/utils/compute-project-progress';
import { getEdgeNodes, type RecordApiClient } from 'src/utils/record-api-client';

// A tracker holds a few dozen tasks at most; one page covers it.
const PAGE_SIZE = 200;

type ProjectProgressSnapshot = {
  id: string;
  progress: number | null;
  currentPhase: string | null;
};

type PhaseNode = { id: string; name: string; position: number | null };

type TaskNode = { phaseId: string | null; status: ProjectTaskStatus };

export const recomputeProjectProgress = async (
  client: RecordApiClient,
  projectId: string,
): Promise<void> => {
  const byProject = { filter: { projectId: { eq: projectId } }, first: PAGE_SIZE };

  const response = await client.query({
    project: {
      __args: { filter: { id: { eq: projectId } } },
      id: true,
      progress: true,
      currentPhase: true,
    },
    projectPhases: {
      __args: byProject,
      edges: { node: { id: true, name: true, position: true } },
    },
    projectTasks: {
      __args: byProject,
      edges: { node: { phaseId: true, status: true } },
    },
  });

  const project = response.project as ProjectProgressSnapshot | null | undefined;

  if (!project) {
    return;
  }

  const { progress, currentPhase } = computeProjectProgress({
    phases: getEdgeNodes<PhaseNode>(response, 'projectPhases').map((phase) => ({
      ...phase,
      position: phase.position ?? 0,
    })),
    tasks: getEdgeNodes<TaskNode>(response, 'projectTasks'),
  });

  if (project.progress === progress && project.currentPhase === currentPhase) {
    return;
  }

  await client.mutation({
    updateProject: {
      __args: { id: projectId, data: { progress, currentPhase } },
      id: true,
    },
  });
};
