import { type CoreApiClient } from 'twenty-client-sdk/core';

export type RecordApiRequest = Record<string, unknown>;

export type RecordApiResponse = Record<string, unknown>;

export type RecordApiClient = {
  query: (request: RecordApiRequest) => Promise<RecordApiResponse>;
  mutation: (request: RecordApiRequest) => Promise<RecordApiResponse>;
};

// The generated client is typed against the workspace schema at generation
// time, which does not include this app's objects until it is installed.
export const toRecordApiClient = (client: CoreApiClient): RecordApiClient => ({
  query: (request) =>
    client.query(request as never) as Promise<RecordApiResponse>,
  mutation: (request) =>
    client.mutation(request as never) as Promise<RecordApiResponse>,
});

type Connection<TNode> = { edges?: { node: TNode }[] | null } | null;

export const getEdgeNodes = <TNode>(
  response: RecordApiResponse,
  key: string,
): TNode[] => {
  const connection = response[key] as Connection<TNode> | undefined;

  return connection?.edges?.map((edge) => edge.node) ?? [];
};
