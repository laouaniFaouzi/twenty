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
