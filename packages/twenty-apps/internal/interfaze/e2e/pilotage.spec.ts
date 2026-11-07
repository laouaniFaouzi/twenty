import { expect, test } from '@playwright/test';
import * as fs from 'fs';
import { CoreApiClient } from 'twenty-client-sdk/core';

import { addDays, agencyToday } from '../src/utils/agency-date';
import {
  type RecordApiClient,
  toRecordApiClient,
} from '../src/utils/record-api-client';
import { SCREENSHOT_DIR, shoot, workspaceUrl } from './utils';

const PREFIX = '[e2e-pilotage]';

const WIDGET_TITLES = [
  'Nouvelles demandes sur 7 jours',
  'Demandes sans réponse après 48 h',
  'Montant signé ce mois',
  'Revenu récurrent mensuel',
  'Pipeline par étape (montants)',
  'Projets en cours par offre',
  'Demandes par source sur 6 mois',
  'Tâches de suivi en retard',
  'Contrats à renouveler sous 30 jours',
  'Erreurs de synchro sur 24 h',
];

let client: RecordApiClient;
const created: [string, string][] = [];

const create = async (objectName: string, data: Record<string, unknown>) => {
  const mutationName = `create${objectName.charAt(0).toUpperCase()}${objectName.slice(1)}`;
  const response = await client.mutation({
    [mutationName]: { __args: { data }, id: true },
  });
  const id = (response[mutationName] as { id: string }).id;

  created.push([objectName, id]);

  return id;
};

const euros = (amount: number) => ({ amountMicros: amount * 1_000_000, currencyCode: 'EUR' });

// A few records so the screenshot shows figures, not only empty charts.
test.beforeAll(async () => {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  client = toRecordApiClient(new CoreApiClient());

  const today = agencyToday(new Date());
  const companyId = await create('company', { name: `${PREFIX} Atelier` });

  await create('opportunity', {
    name: `${PREFIX} Demande`,
    companyId,
    interfazeStage: 'NEW_REQUEST',
    receivedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    requestSource: 'CONTACT',
  });
  await create('opportunity', {
    name: `${PREFIX} Devis`,
    companyId,
    interfazeStage: 'QUOTE_SENT',
    amount: euros(3200),
  });
  await create('project', { name: `${PREFIX} Site`, offer: 'WEB', status: 'IN_PROGRESS', companyId });
  await create('maintenanceContract', {
    name: `${PREFIX} Maintenance`,
    status: 'ACTIVE',
    monthlyAmount: euros(90),
    renewalDate: addDays(today, 10),
    companyId,
  });
});

test.afterAll(async () => {
  for (const [objectName, id] of created.reverse()) {
    const mutationName = `destroy${objectName.charAt(0).toUpperCase()}${objectName.slice(1)}`;

    await client.mutation({ [mutationName]: { __args: { id }, id: true } }).catch(() => {});
  }
});

test('opens Pilotage from the menu and shows its ten widgets', async ({ page }) => {
  page.on('pageerror', (error) => console.log(`[pageerror] ${error.message}`));
  await page.setViewportSize({ width: 1600, height: 1600 });
  await page.goto(`${workspaceUrl()}/`);

  await page.getByText('Pilotage', { exact: true }).first().click();

  for (const title of WIDGET_TITLES) {
    await expect(page.getByText(title, { exact: true }).first()).toBeVisible();
  }

  // Charts load after their titles; a broken one shows the word Error.
  await expect(page.getByText('Revenu récurrent mensuel', { exact: true }).first()).toBeVisible();
  await page.waitForTimeout(5_000);
  await expect(page.getByText('Error', { exact: true })).toHaveCount(0);

  await shoot(page, 'pilotage');
});
