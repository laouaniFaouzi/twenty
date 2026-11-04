import { describe, expect, it } from 'vitest';

import { type ProjectTaskStatus } from 'src/objects/project-task.object';
import { computeProjectProgress } from 'src/utils/compute-project-progress';

const PHASES = [
  { id: 'phase-design', name: 'Vous validez le design', position: 1 },
  { id: 'phase-talk', name: 'On échange', position: 0 },
  { id: 'phase-build', name: 'On le construit', position: 2 },
];

const task = (phaseId: string | null, status: ProjectTaskStatus) => ({
  phaseId,
  status,
});

describe('computeProjectProgress', () => {
  it('rounds the share of done tasks to a whole percentage', () => {
    expect(
      computeProjectProgress({
        phases: PHASES,
        tasks: [task('phase-talk', 'DONE'), task('phase-talk', 'TODO'), task('phase-design', 'TODO')],
      }).progress,
    ).toBe(33);
    expect(
      computeProjectProgress({
        phases: PHASES,
        tasks: [task('phase-talk', 'DONE'), task('phase-talk', 'DONE'), task('phase-design', 'DOING')],
      }).progress,
    ).toBe(67);
  });

  it('picks the first phase by position that still has an unfinished task', () => {
    expect(
      computeProjectProgress({
        phases: PHASES,
        tasks: [task('phase-design', 'DOING'), task('phase-talk', 'DONE'), task('phase-build', 'TODO')],
      }).currentPhase,
    ).toBe('Vous validez le design');
  });

  it('says the project is done when every task is done', () => {
    expect(
      computeProjectProgress({
        phases: PHASES,
        tasks: [task('phase-talk', 'DONE'), task('phase-design', 'DONE')],
      }),
    ).toEqual({ progress: 100, currentPhase: 'Terminé' });
  });

  it('shows the first phase, never done, when there is no task yet', () => {
    expect(computeProjectProgress({ phases: PHASES, tasks: [] })).toEqual({
      progress: 0,
      currentPhase: 'On échange',
    });
  });

  it('shows an empty phase when there is neither phase nor task', () => {
    expect(computeProjectProgress({ phases: [], tasks: [] })).toEqual({
      progress: 0,
      currentPhase: '',
    });
  });

  it('skips an earlier phase that has no task', () => {
    expect(
      computeProjectProgress({
        phases: PHASES,
        tasks: [task('phase-design', 'TODO')],
      }).currentPhase,
    ).toBe('Vous validez le design');
  });

  it('counts a task without phase in the progress but not in the phase choice', () => {
    expect(
      computeProjectProgress({
        phases: PHASES,
        tasks: [task(null, 'TODO'), task('phase-talk', 'DONE')],
      }),
    ).toEqual({ progress: 50, currentPhase: '' });
  });
});
