import {
  getEdgeNodes,
  type RecordApiClient,
} from 'src/utils/record-api-client';

const PAGE_SIZE = 200;

type PageInfo = { hasNextPage?: boolean; endCursor?: string | null };

export const fetchAllRecords = async <TNode>(
  client: RecordApiClient,
  root: string,
  {
    filter,
    node,
  }: { filter: Record<string, unknown>; node: Record<string, unknown> },
): Promise<TNode[]> => {
  const records: TNode[] = [];
  let after: string | undefined;

  do {
    const response = await client.query({
      [root]: {
        __args: { filter, first: PAGE_SIZE, ...(after ? { after } : {}) },
        pageInfo: { hasNextPage: true, endCursor: true },
        edges: { node },
      },
    });

    records.push(...getEdgeNodes<TNode>(response, root));

    const pageInfo = (response[root] as { pageInfo?: PageInfo } | null)
      ?.pageInfo;

    after = pageInfo?.hasNextPage
      ? (pageInfo.endCursor ?? undefined)
      : undefined;
  } while (after !== undefined);

  return records;
};
