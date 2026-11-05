export type SingleFlight = {
  run: <TResult>(task: () => Promise<TResult>) => Promise<TResult | undefined>;
  isRunning: () => boolean;
};

// Ignores a task started while another one runs, so a double click on a
// button creates one page, not two.
export const createSingleFlight = (): SingleFlight => {
  let running = false;

  return {
    isRunning: () => running,
    run: async (task) => {
      if (running) {
        return undefined;
      }

      running = true;

      try {
        return await task();
      } finally {
        running = false;
      }
    },
  };
};
