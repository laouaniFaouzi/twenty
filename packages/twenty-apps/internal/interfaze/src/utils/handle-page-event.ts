import { type RecordApiClient } from 'src/utils/record-api-client';

export type PageEvent = {
  name: string;
  recordId: string;
  properties: { before?: { parentPageId: string | null } };
};

// Moving a page to the trash does not run the relation's onDelete, so its
// sub-pages are moved up to its own parent here.
export const handlePageEvent = async (
  client: RecordApiClient,
  { name, recordId, properties }: PageEvent,
): Promise<void> => {
  if (name !== 'page.deleted') {
    return;
  }

  await client.mutation({
    updatePages: {
      __args: {
        filter: { parentPageId: { eq: recordId } },
        data: { parentPageId: properties.before?.parentPageId ?? null },
      },
      id: true,
    },
  });
};
