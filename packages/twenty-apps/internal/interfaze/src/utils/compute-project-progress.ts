import { type ProjectTaskStatus } from 'src/objects/project-task.object';

export const PROJECT_DONE_LABEL = 'Terminé';

type PhaseInput = { id: string; name: string; position: number };

type TaskInput = { phaseId: string | null; status: ProjectTaskStatus };

export type ProjectProgress = { progress: number; currentPhase: string };

export const computeProjectProgress = ({
  phases,
  tasks,
}: {
  phases: PhaseInput[];
  tasks: TaskInput[];
}): ProjectProgress => {
  const phasesByPosition = [...phases].sort(
    (first, second) => first.position - second.position,
  );

  if (tasks.length === 0) {
    return { progress: 0, currentPhase: phasesByPosition[0]?.name ?? '' };
  }

  const doneCount = tasks.filter((task) => task.status === 'DONE').length;
  const progress = Math.round((doneCount / tasks.length) * 100);

  const currentPhase = phasesByPosition.find((phase) =>
    tasks.some((task) => task.phaseId === phase.id && task.status !== 'DONE'),
  );

  if (currentPhase) {
    return { progress, currentPhase: currentPhase.name };
  }

  return {
    progress,
    currentPhase: doneCount === tasks.length ? PROJECT_DONE_LABEL : '',
  };
};
