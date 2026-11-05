import { describe, expect, it, vi } from 'vitest';

import { createSingleFlight } from 'src/utils/single-flight';

describe('createSingleFlight', () => {
  it('ignores a second run while the first one is in progress', async () => {
    const flight = createSingleFlight();
    let release: () => void = () => {};
    const task = vi.fn(() => new Promise<void>((resolve) => { release = resolve; }));

    const first = flight.run(task);
    const second = flight.run(task);
    expect(flight.isRunning()).toBe(true);
    release();
    await Promise.all([first, second]);

    expect(task).toHaveBeenCalledTimes(1);
    expect(flight.isRunning()).toBe(false);
  });

  it('runs again once the previous run is over, even after a failure', async () => {
    const flight = createSingleFlight();

    await expect(flight.run(() => Promise.reject(new Error('boom')))).rejects.toThrow('boom');
    expect(await flight.run(() => Promise.resolve('ok'))).toBe('ok');
  });
});
