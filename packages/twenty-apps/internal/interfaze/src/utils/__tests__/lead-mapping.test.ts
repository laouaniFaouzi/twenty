import { describe, expect, it } from 'vitest';

import {
  companyNameLikePattern,
  mapLeadToOpportunityData,
  normalizeCompanyName,
  normalizeFrenchPhone,
  type SiteLead,
  splitPersonName,
  stageAfterSiteStatus,
  statusForStage,
} from 'src/utils/lead-mapping';

const LEAD: SiteLead = {
  id: 'L1',
  ref: 'IFZ-261106-0042',
  source: 'offre:web',
  need: 'web',
  timing: '1-3-mois',
  name: 'Marie Curie',
  company: 'Boulangerie Martin',
  email: 'marie@exemple.fr',
  phone: '06 12 34 56 78',
  message: 'Un site pour la boulangerie',
  status: 'new',
  crm_id: null,
  created_at: '2026-11-06T09:00:00.000Z',
};

const LINKS = {
  personId: 'P1',
  companyId: 'C1',
  ownerId: 'M1',
  companyName: 'Boulangerie Martin',
};

describe('splitPersonName', () => {
  it('takes the first word as first name and the rest as last name', () => {
    expect(splitPersonName('Marie Curie-Dupont')).toEqual({
      firstName: 'Marie',
      lastName: 'Curie-Dupont',
    });
    expect(splitPersonName('Jean  de La Fontaine ')).toEqual({
      firstName: 'Jean',
      lastName: 'de La Fontaine',
    });
  });

  it('leaves the last name empty for a single word', () => {
    expect(splitPersonName('  Léo  ')).toEqual({
      firstName: 'Léo',
      lastName: '',
    });
  });
});

describe('normalizeFrenchPhone', () => {
  it.each([
    '06 12 34 56 78',
    '06.12.34.56.78',
    '+33 6 12 34 56 78',
    '0033612345678',
  ])('reads %s as a French number', (raw) => {
    expect(normalizeFrenchPhone(raw)).toEqual({
      primaryPhoneNumber: '612345678',
      primaryPhoneCallingCode: '+33',
      primaryPhoneCountryCode: 'FR',
    });
  });

  it('keeps a foreign number in international form for the server to read', () => {
    expect(normalizeFrenchPhone('+41 79 123 45 67')).toEqual({
      primaryPhoneNumber: '+41791234567',
      primaryPhoneCallingCode: '',
      primaryPhoneCountryCode: '',
    });
    expect(normalizeFrenchPhone('0041 79 123 45 67')).toEqual({
      primaryPhoneNumber: '+41791234567',
      primaryPhoneCallingCode: '',
      primaryPhoneCountryCode: '',
    });
  });

  it.each([null, '', '   ', 'abc', '06 12', '12345678901234567890'])(
    'drops %s, which no server could read as a phone number',
    (raw) => {
      expect(normalizeFrenchPhone(raw)).toBeNull();
    },
  );
});

describe('normalizeCompanyName', () => {
  it('ignores case, accents and extra spaces', () => {
    expect(normalizeCompanyName('Boulangerie Émile  ')).toBe(
      normalizeCompanyName('  boulangerie   emile'),
    );
    expect(normalizeCompanyName('Boulangerie Émile')).toBe('boulangerie emile');
  });
});

describe('companyNameLikePattern', () => {
  it('lets every letter that can carry an accent match any single character', () => {
    expect(companyNameLikePattern('Émile')).toBe('_m_l_');
  });

  it('lets any run of spaces match anything', () => {
    expect(companyNameLikePattern(' Ma   Rue ')).toBe('m_%r__');
  });

  it('escapes the wildcards typed by the visitor', () => {
    expect(companyNameLikePattern('100%_Bt\\')).toBe('100\\%\\_bt\\\\');
  });
});

describe('mapLeadToOpportunityData', () => {
  it('builds the opportunity of a new lead', () => {
    expect(mapLeadToOpportunityData(LEAD, LINKS)).toEqual({
      name: 'Boulangerie Martin · WebFaze',
      interfazeStage: 'NEW_REQUEST',
      need: 'WEB',
      offer: 'WEB',
      requestSource: 'OFFER_WEB',
      timing: 'ONE_TO_THREE_MONTHS',
      requestRef: 'IFZ-261106-0042',
      requestMessage: 'Un site pour la boulangerie',
      receivedAt: '2026-11-06T09:00:00.000Z',
      pointOfContactId: 'P1',
      companyId: 'C1',
      ownerId: 'M1',
      siteLeadId: 'L1',
      siteLeadStatusSeen: 'new',
    });
  });

  it('names the opportunity after the person and leaves the offer open for a problem to solve', () => {
    const data = mapLeadToOpportunityData(
      { ...LEAD, company: null, need: 'probleme', message: null, timing: null },
      { ...LINKS, companyId: null, companyName: null },
    );

    expect(data.name).toBe('Marie Curie · Problème à régler');
    expect(data.need).toBe('PROBLEM');
    expect(data).not.toHaveProperty('offer');
    expect(data.companyId).toBeNull();
    expect(data.requestMessage).toBeNull();
    expect(data.timing).toBeNull();
  });

  it.each([
    ['web', 'WEB'],
    ['shop', 'SHOP'],
    ['app', 'APP'],
    ['smart', 'SMART'],
  ])('maps the need %s to the offer %s', (need, offer) => {
    const data = mapLeadToOpportunityData({ ...LEAD, need }, LINKS);

    expect(data.need).toBe(offer);
    expect(data.offer).toBe(offer);
  });

  it.each([
    ['accueil', 'HOME'],
    ['contact', 'CONTACT'],
    ['offre:web', 'OFFER_WEB'],
    ['offre:shop', 'OFFER_SHOP'],
    ['offre:app', 'OFFER_APP'],
    ['offre:smart', 'OFFER_SMART'],
  ])('maps the source %s to %s', (source, requestSource) => {
    expect(
      mapLeadToOpportunityData({ ...LEAD, source }, LINKS).requestSource,
    ).toBe(requestSource);
  });

  it.each([
    ['asap', 'ASAP'],
    ['1-3-mois', 'ONE_TO_THREE_MONTHS'],
    ['sans-date', 'NO_DATE'],
  ])('maps the timing %s to %s', (timing, expected) => {
    expect(mapLeadToOpportunityData({ ...LEAD, timing }, LINKS).timing).toBe(
      expected,
    );
  });

  it('leaves out values the site may add later instead of sending an unknown option', () => {
    const data = mapLeadToOpportunityData(
      { ...LEAD, source: 'salon', need: 'audit', timing: 'un-jour' },
      LINKS,
    );

    expect(data.requestSource).toBeNull();
    expect(data.need).toBeNull();
    expect(data.timing).toBeNull();
    expect(data).not.toHaveProperty('offer');
    expect(data.name).toBe('Boulangerie Martin · Demande');
  });
});

describe('statusForStage', () => {
  it.each([
    ['NEW_REQUEST', 'new'],
    ['DISCUSSION', 'in_progress'],
    ['QUOTE_SENT', 'in_progress'],
    ['WON', 'done'],
    ['LOST', 'done'],
  ] as const)('sends %s back to the site as %s', (stage, status) => {
    expect(statusForStage(stage)).toBe(status);
  });
});

describe('stageAfterSiteStatus', () => {
  it('moves a new request to discussion when the site starts working on it', () => {
    expect(
      stageAfterSiteStatus({
        stage: 'NEW_REQUEST',
        seenStatus: 'new',
        siteStatus: 'in_progress',
      }),
    ).toEqual({ stage: 'DISCUSSION', askToClose: false });
  });

  it('never moves an opportunity that is already further along', () => {
    expect(
      stageAfterSiteStatus({
        stage: 'QUOTE_SENT',
        seenStatus: 'new',
        siteStatus: 'in_progress',
      }),
    ).toEqual({ stage: null, askToClose: false });
  });

  it('asks to close an open opportunity when the site closes the lead', () => {
    expect(
      stageAfterSiteStatus({
        stage: 'DISCUSSION',
        seenStatus: 'in_progress',
        siteStatus: 'done',
      }),
    ).toEqual({ stage: null, askToClose: true });
    expect(
      stageAfterSiteStatus({
        stage: 'NEW_REQUEST',
        seenStatus: 'new',
        siteStatus: 'done',
      }),
    ).toEqual({ stage: null, askToClose: true });
  });

  it.each(['WON', 'LOST'] as const)(
    'does not ask to close a %s opportunity',
    (stage) => {
      expect(
        stageAfterSiteStatus({
          stage,
          seenStatus: 'in_progress',
          siteStatus: 'done',
        }),
      ).toEqual({ stage: null, askToClose: false });
    },
  );

  it.each([
    ['in_progress', 'new'],
    ['done', 'in_progress'],
    ['done', 'new'],
  ] as const)('ignores a step back from %s to %s', (seenStatus, siteStatus) => {
    expect(
      stageAfterSiteStatus({ stage: 'NEW_REQUEST', seenStatus, siteStatus }),
    ).toEqual({ stage: null, askToClose: false });
  });

  it('ignores a status the opportunity has already seen', () => {
    expect(
      stageAfterSiteStatus({
        stage: 'NEW_REQUEST',
        seenStatus: 'in_progress',
        siteStatus: 'in_progress',
      }),
    ).toEqual({ stage: null, askToClose: false });
  });

  it('reads an unknown seen status as new', () => {
    expect(
      stageAfterSiteStatus({
        stage: 'NEW_REQUEST',
        seenStatus: null,
        siteStatus: 'in_progress',
      }),
    ).toEqual({ stage: 'DISCUSSION', askToClose: false });
  });
});
