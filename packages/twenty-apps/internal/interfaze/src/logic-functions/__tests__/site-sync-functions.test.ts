import { afterEach, describe, expect, it, vi } from 'vitest';

import onOpportunityStageChanged from 'src/logic-functions/on-opportunity-stage-changed';
import siteWebhook from 'src/logic-functions/site-webhook';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('site-webhook', () => {
  it('is a public POST route that receives the shared secret header', () => {
    expect(siteWebhook.success).toBe(true);
    expect(siteWebhook.config.httpRouteTriggerSettings).toEqual({
      path: '/hubfaze/site-webhook',
      httpMethod: 'POST',
      isAuthRequired: false,
      forwardedRequestHeaders: ['x-hubfaze-secret'],
    });
  });

  it('answers 503 while the sync variables are not set', async () => {
    vi.stubEnv('SUPABASE_URL', '');
    vi.stubEnv('SUPABASE_SECRET_KEY', '');
    vi.stubEnv('HUBFAZE_WEBHOOK_SECRET', '');

    const response = await siteWebhook.config.handler(
      {
        headers: { 'x-hubfaze-secret': 'anything' },
        queryStringParameters: {},
        pathParameters: {},
        body: { table: 'leads', type: 'INSERT', record: null },
        isBase64Encoded: false,
        requestContext: {
          http: { method: 'POST', path: '/hubfaze/site-webhook' },
        },
        userWorkspaceId: null,
      },
      {} as Parameters<typeof siteWebhook.config.handler>[1],
    );

    expect(response).toEqual({
      __twentyHttpResponse: true,
      status: 503,
      body: { message: 'Synchro avec le site non configurée' },
    });
  });
});

describe('on-opportunity-stage-changed', () => {
  it('listens to stage changes only', () => {
    expect(onOpportunityStageChanged.success).toBe(true);
    expect(
      onOpportunityStageChanged.config.databaseEventTriggerSettings,
    ).toEqual({
      eventName: 'opportunity.updated',
      updatedFields: ['interfazeStage'],
    });
  });
});
