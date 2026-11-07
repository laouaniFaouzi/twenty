import { describe, expect, it } from 'vitest';

import {
  decideMerge,
  generateTrackerToken,
  isLateSiteChange,
  phaseDataFromSite,
  phaseFieldsFromProjectPhase,
  phaseFieldsFromSite,
  projectDataFromTracker,
  type SitePhase,
  type SiteTask,
  type SiteTracker,
  syncHashOf,
  taskDataFromSite,
  taskFieldsFromProjectTask,
  taskFieldsFromSite,
  tokenFromTrackerUrl,
  trackerFieldsFromProject,
  trackerFieldsFromSite,
  trackerUrlFor,
} from 'src/utils/tracker-mapping';

const TRACKER: SiteTracker = {
  id: 'T1',
  client_name: 'Boulangerie Martin',
  offer: 'web',
  token: 'code',
  is_active: true,
  crm_id: 'P1',
  updated_at: '2026-11-07T10:00:00.000Z',
};

const PHASE: SitePhase = {
  id: 'S-PH1',
  tracker_id: 'T1',
  name: 'On échange',
  position: 0,
  crm_id: 'PH1',
  updated_at: '2026-11-07T10:00:00.000Z',
};

const TASK: SiteTask = {
  id: 'S-TA1',
  phase_id: 'S-PH1',
  name: 'Atelier de cadrage',
  description: '',
  status: 'doing',
  position: 1.5,
  crm_id: 'TA1',
  updated_at: '2026-11-07T10:00:00.000Z',
};

describe('tracker token and link', () => {
  it('encodes 24 random bytes in base64url, 32 characters', () => {
    const fixedBytes = (size: number) => Buffer.alloc(size, 0xfb);

    expect(generateTrackerToken(fixedBytes)).toBe(
      Buffer.alloc(24, 0xfb).toString('base64url'),
    );
    expect(generateTrackerToken()).toMatch(/^[A-Za-z0-9_-]{32}$/);
    expect(generateTrackerToken()).not.toBe(generateTrackerToken());
  });

  it('builds the client link and reads its code back', () => {
    expect(trackerUrlFor('https://interfaze.fr', 'abc')).toBe(
      'https://interfaze.fr/suivi/abc',
    );
    expect(tokenFromTrackerUrl('https://interfaze.fr/suivi/abc')).toBe('abc');
    expect(tokenFromTrackerUrl('https://example.com/autre')).toBeNull();
    expect(tokenFromTrackerUrl(null)).toBeNull();
  });
});

describe('fields sent to the site', () => {
  it('names the tracker after the company, or the project without one', () => {
    expect(
      trackerFieldsFromProject({
        name: 'Boulangerie Martin · WebFaze',
        offer: 'WEB',
        status: 'IN_PROGRESS',
        companyName: 'Boulangerie Martin',
      }),
    ).toEqual({
      client_name: 'Boulangerie Martin',
      offer: 'web',
      is_active: true,
    });
    expect(
      trackerFieldsFromProject({
        name: 'Refonte du site',
        offer: 'SHOP',
        status: 'LAUNCHED',
        companyName: null,
      }),
    ).toEqual({
      client_name: 'Refonte du site',
      offer: 'shop',
      is_active: true,
    });
  });

  it('archives the tracker of an archived project, and sends nothing without an offer', () => {
    expect(
      trackerFieldsFromProject({
        name: 'P',
        offer: 'APP',
        status: 'ARCHIVED',
        companyName: null,
      })?.is_active,
    ).toBe(false);
    expect(
      trackerFieldsFromProject({
        name: 'P',
        offer: null,
        status: 'IN_PROGRESS',
        companyName: null,
      }),
    ).toBeNull();
  });

  it('sends phases and tasks with their site parent, keeping decimal positions', () => {
    expect(
      phaseFieldsFromProjectPhase({ name: 'On échange', position: 0 }, 'T1'),
    ).toEqual({
      tracker_id: 'T1',
      name: 'On échange',
      position: 0,
    });
    expect(
      taskFieldsFromProjectTask(
        {
          name: 'Atelier de cadrage',
          description: null,
          status: 'DOING',
          position: 1.5,
        },
        'S-PH1',
      ),
    ).toEqual({
      phase_id: 'S-PH1',
      name: 'Atelier de cadrage',
      description: '',
      status: 'doing',
      position: 1.5,
    });
  });

  it('gives a HubFaze task and its site row the same hash when they match', () => {
    expect(
      syncHashOf(
        taskFieldsFromProjectTask(
          {
            name: 'Atelier de cadrage',
            description: null,
            status: 'DOING',
            position: 1.5,
          },
          'S-PH1',
        ),
      ),
    ).toBe(syncHashOf(taskFieldsFromSite(TASK)));
    expect(syncHashOf(phaseFieldsFromSite(PHASE))).toBe(
      syncHashOf(
        phaseFieldsFromProjectPhase({ name: 'On échange', position: 0 }, 'T1'),
      ),
    );
    expect(syncHashOf(trackerFieldsFromSite(TRACKER))).toBe(
      syncHashOf({
        client_name: 'Boulangerie Martin',
        offer: 'web',
        is_active: true,
      }),
    );
  });
});

describe('syncHashOf', () => {
  it('ignores key order and changes with any value', () => {
    expect(syncHashOf({ a: 1, b: 'x' })).toBe(syncHashOf({ b: 'x', a: 1 }));
    expect(syncHashOf({ a: 1, b: 'x' })).not.toBe(syncHashOf({ a: 2, b: 'x' }));
    expect(syncHashOf({ a: 1 })).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe('data written to HubFaze', () => {
  it.each([
    [{ is_active: false }, 'IN_PROGRESS', 'ARCHIVED'],
    [{ is_active: true }, 'ARCHIVED', 'IN_PROGRESS'],
    [{ is_active: true }, 'LAUNCHED', 'LAUNCHED'],
    [{ is_active: true }, null, 'IN_PROGRESS'],
  ] as const)(
    'reads %o on a %s project as %s',
    (change, currentStatus, status) => {
      expect(
        projectDataFromTracker({ ...TRACKER, ...change }, currentStatus),
      ).toEqual({
        offer: 'WEB',
        status,
      });
    },
  );

  it('leaves an unknown offer empty', () => {
    expect(
      projectDataFromTracker({ ...TRACKER, offer: 'audit' }, null).offer,
    ).toBeNull();
  });

  it('reads phases and tasks', () => {
    expect(phaseDataFromSite(PHASE)).toEqual({
      name: 'On échange',
      position: 0,
    });
    expect(taskDataFromSite(TASK)).toEqual({
      name: 'Atelier de cadrage',
      description: '',
      status: 'DOING',
      position: 1.5,
    });
  });
});

describe('decideMerge', () => {
  const EARLY = '2026-11-07T09:00:00.000Z';
  const LATE = '2026-11-07T11:00:00.000Z';

  it('does nothing when both sides already agree', () => {
    expect(
      decideMerge({
        siteHash: 'b',
        localHash: 'b',
        syncHash: 'a',
        siteUpdatedAt: LATE,
        localUpdatedAt: EARLY,
      }),
    ).toBe('in_sync');
  });

  it('applies the site when only the site changed', () => {
    expect(
      decideMerge({
        siteHash: 'b',
        localHash: 'a',
        syncHash: 'a',
        siteUpdatedAt: EARLY,
        localUpdatedAt: LATE,
      }),
    ).toBe('apply_site');
  });

  it('pushes HubFaze when only HubFaze changed', () => {
    expect(
      decideMerge({
        siteHash: 'a',
        localHash: 'c',
        syncHash: 'a',
        siteUpdatedAt: LATE,
        localUpdatedAt: EARLY,
      }),
    ).toBe('push_local');
  });

  it('lets the most recent side win when both changed, the site on a tie', () => {
    expect(
      decideMerge({
        siteHash: 'b',
        localHash: 'c',
        syncHash: 'a',
        siteUpdatedAt: LATE,
        localUpdatedAt: EARLY,
      }),
    ).toBe('apply_site');
    expect(
      decideMerge({
        siteHash: 'b',
        localHash: 'c',
        syncHash: 'a',
        siteUpdatedAt: EARLY,
        localUpdatedAt: LATE,
      }),
    ).toBe('push_local');
    expect(
      decideMerge({
        siteHash: 'b',
        localHash: 'c',
        syncHash: null,
        siteUpdatedAt: LATE,
        localUpdatedAt: LATE,
      }),
    ).toBe('apply_site');
  });
});

describe('isLateSiteChange', () => {
  it('ignores a site change that is not newer than the last one seen', () => {
    expect(
      isLateSiteChange('2026-11-07T10:00:00.000Z', '2026-11-07T10:00:00.000Z'),
    ).toBe(true);
    expect(
      isLateSiteChange('2026-11-07T09:59:59.000Z', '2026-11-07T10:00:00.000Z'),
    ).toBe(true);
    expect(
      isLateSiteChange('2026-11-07T10:00:01.000Z', '2026-11-07T10:00:00.000Z'),
    ).toBe(false);
    expect(isLateSiteChange('2026-11-07T10:00:00.000Z', null)).toBe(false);
  });

  it('reads the microseconds of Postgres timestamps', () => {
    expect(
      isLateSiteChange(
        '2026-11-07T10:00:00.123456+00:00',
        '2026-11-07T10:00:00.123Z',
      ),
    ).toBe(true);
  });
});
