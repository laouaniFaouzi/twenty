import { type RecordApiClient } from 'src/utils/record-api-client';

export type PageEvent = {
  name: string;
  recordId: string;
  properties: {
    before?: { parentPageId: string | null };
    after?: { parentPageId: string | null };
  };
};

const parentIs = (parentPageId: string | null) =>
  parentPageId === null
    ? { parentPageId: { is: 'NULL' } }
    : { parentPageId: { eq: parentPageId } };

// Moving a page to the trash does not run the relation's onDelete, so its
// sub-pages are moved up to its parent here and remember where they came
// from, to go back if the page is restored.
export const handlePageEvent = async (
  client: RecordApiClient,
  { name, recordId, properties }: PageEvent,
): Promise<void> => {
  if (name === 'page.deleted') {
    await client.mutation({
      updatePages: {
        __args: {
          filter: { parentPageId: { eq: recordId } },
          data: {
            parentPageId: properties.before?.parentPageId ?? null,
            previousParentPageId: recordId,
          },
        },
        id: true,
      },
    });

    return;
  }

  if (name === 'page.restored') {
    // Sub-pages moved elsewhere in the meantime stay where they are.
    await client.mutation({
      updatePages: {
        __args: {
          filter: {
            and: [
              { previousParentPageId: { eq: recordId } },
              parentIs(properties.after?.parentPageId ?? null),
            ],
          },
          data: { parentPageId: recordId, previousParentPageId: null },
        },
        id: true,
      },
    });
  }
};
