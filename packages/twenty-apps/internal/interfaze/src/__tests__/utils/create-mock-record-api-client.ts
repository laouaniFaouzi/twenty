import { vi } from 'vitest';

export const createMockRecordApiClient = () => ({
  query: vi.fn().mockResolvedValue({}),
  mutation: vi.fn().mockResolvedValue({}),
});

export type MockRecordApiClient = ReturnType<typeof createMockRecordApiClient>;

export const mutationNames = (client: MockRecordApiClient): string[] =>
  client.mutation.mock.calls.map(([request]) => Object.keys(request)[0]);

export const mutationArgs = (
  client: MockRecordApiClient,
  mutationName: string,
): Record<string, unknown>[] =>
  client.mutation.mock.calls
    .map(([request]) => request[mutationName])
    .filter(Boolean)
    .map((selection) => selection.__args);

export const connection = <TNode>(nodes: TNode[]) => ({
  edges: nodes.map((node) => ({ node })),
});

type QuerySelection = { __args?: { filter?: Record<string, unknown> } };

export type QueryAnswers = Partial<
  Record<string, (filter: Record<string, unknown>) => unknown[]>
>;

// Answers every root of a query with the nodes its answer returns for that root's filter.
export const answerQueries = (
  client: MockRecordApiClient,
  answers: QueryAnswers,
) => {
  client.query.mockImplementation(
    async (request: Record<string, QuerySelection>) =>
      Object.fromEntries(
        Object.entries(request).map(([root, selection]) => [
          root,
          connection(answers[root]?.(selection.__args?.filter ?? {}) ?? []),
        ]),
      ),
  );
};

export const queryFilters = (client: MockRecordApiClient, root: string) =>
  client.query.mock.calls
    .map(([request]) => (request as Record<string, QuerySelection>)[root])
    .filter(Boolean)
    .map((selection) => selection.__args?.filter);
