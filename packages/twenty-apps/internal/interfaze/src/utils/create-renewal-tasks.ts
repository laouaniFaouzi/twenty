import { addDays, agencyToday } from 'src/utils/agency-date';
import { createInternalTask } from 'src/utils/create-internal-task';
import { fetchAllRecords } from 'src/utils/fetch-all-records';
import { findMemberIdByEmail } from 'src/utils/handle-lead-created';
import { presentText } from 'src/utils/present-text';
import { type RecordApiClient } from 'src/utils/record-api-client';

export const RENEWAL_WINDOW_IN_DAYS = 30;

// 8:00 UTC falls on the morning of the renewal date in Paris, summer and winter.
const RENEWAL_TASK_DUE_TIME = 'T08:00:00.000Z';

type RenewalState = {
  renewalDate: string | null;
  renewalTaskCreatedFor: string | null;
};

type RenewalContract = RenewalState & {
  id: string;
  name: string | null;
  company: { id: string; name: string | null } | null;
  project: { ownerId: string | null } | null;
};

export const renewalTaskTitle = (contractName: string): string =>
  `Renouveler le contrat ${contractName}`;

// Late renewals stay due, so a missed one still gets its task.
export const isRenewalTaskDue = <TContract extends RenewalState>(
  contract: TContract,
  today: string,
): contract is TContract & { renewalDate: string } => {
  const renewalDate = presentText(contract.renewalDate);

  return (
    renewalDate !== null &&
    renewalDate <= addDays(today, RENEWAL_WINDOW_IN_DAYS) &&
    contract.renewalTaskCreatedFor !== renewalDate
  );
};

export const createRenewalTasks = async (
  client: RecordApiClient,
  { now, leadOwnerEmail }: { now: Date; leadOwnerEmail: string | null },
): Promise<{ created: number; failures: number }> => {
  const today = agencyToday(now);

  const contracts = await fetchAllRecords<RenewalContract>(
    client,
    'maintenanceContracts',
    {
      filter: {
        status: { eq: 'ACTIVE' },
        renewalDate: { lte: addDays(today, RENEWAL_WINDOW_IN_DAYS) },
      },
      node: {
        id: true,
        name: true,
        renewalDate: true,
        renewalTaskCreatedFor: true,
        company: { id: true, name: true },
        project: { ownerId: true },
      },
    },
  );

  let leadOwnerId: Promise<string | null> | undefined;
  const findLeadOwnerId = () =>
    (leadOwnerId ??= findMemberIdByEmail(client, leadOwnerEmail));

  let created = 0;
  let failures = 0;

  for (const contract of contracts) {
    if (!isRenewalTaskDue(contract, today)) {
      continue;
    }

    try {
      const task = await createInternalTask(client, {
        title: renewalTaskTitle(
          presentText(contract.name) ??
            presentText(contract.company?.name) ??
            'sans nom',
        ),
        assigneeId: contract.project?.ownerId ?? (await findLeadOwnerId()),
        dueAt: `${contract.renewalDate}${RENEWAL_TASK_DUE_TIME}`,
        target: { objectName: 'maintenanceContract', recordId: contract.id },
        extraTargets: contract.company
          ? [{ objectName: 'company', recordId: contract.company.id }]
          : [],
      });

      await client.mutation({
        updateMaintenanceContract: {
          __args: {
            id: contract.id,
            data: { renewalTaskCreatedFor: contract.renewalDate },
          },
          id: true,
        },
      });

      created += task.created ? 1 : 0;
    } catch {
      // The marker stays unset, so tomorrow's run tries this contract again.
      failures += 1;
    }
  }

  return { created, failures };
};
