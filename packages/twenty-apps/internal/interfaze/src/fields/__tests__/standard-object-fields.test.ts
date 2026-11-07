import {
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';
import { describe, expect, it } from 'vitest';

import companyClientStatus from 'src/fields/company-client-status.field';
import opportunityInterfazeStage from 'src/fields/opportunity-interfaze-stage.field';
import opportunityLostReason from 'src/fields/opportunity-lost-reason.field';
import opportunityNeed from 'src/fields/opportunity-need.field';
import opportunityOffer from 'src/fields/opportunity-offer.field';
import opportunityOsezIa from 'src/fields/opportunity-osez-ia.field';
import opportunityReceivedAt from 'src/fields/opportunity-received-at.field';
import opportunityRequestMessage from 'src/fields/opportunity-request-message.field';
import opportunityRequestRef from 'src/fields/opportunity-request-ref.field';
import opportunityRequestSource from 'src/fields/opportunity-request-source.field';
import opportunityResponseOverdue from 'src/fields/opportunity-response-overdue.field';
import opportunitySiteLeadId from 'src/fields/opportunity-site-lead-id.field';
import opportunitySiteLeadStatusSeen from 'src/fields/opportunity-site-lead-status-seen.field';
import opportunityTiming from 'src/fields/opportunity-timing.field';

const OPPORTUNITY =
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.universalIdentifier;
const COMPANY =
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.company.universalIdentifier;

type FieldDefinition = typeof opportunityInterfazeStage;

const optionPairs = (definition: FieldDefinition) =>
  (definition.config.options ?? []).map(({ value, label }) => [value, label]);

const SELECT_FIELDS: [
  string,
  FieldDefinition,
  string,
  string,
  [string, string][],
][] = [
  [
    'stage',
    opportunityInterfazeStage,
    OPPORTUNITY,
    'interfazeStage',
    [
      ['NEW_REQUEST', 'Nouvelle demande'],
      ['DISCUSSION', 'Échange'],
      ['QUOTE_SENT', 'Devis envoyé'],
      ['WON', 'Signé'],
      ['LOST', 'Perdu'],
    ],
  ],
  [
    'need',
    opportunityNeed,
    OPPORTUNITY,
    'need',
    [
      ['PROBLEM', 'Problème à régler'],
      ['WEB', 'WebFaze'],
      ['SHOP', 'ShopFaze'],
      ['APP', 'AppFaze'],
      ['SMART', 'SmartFaze'],
    ],
  ],
  [
    'offer',
    opportunityOffer,
    OPPORTUNITY,
    'offer',
    [
      ['WEB', 'WebFaze'],
      ['SHOP', 'ShopFaze'],
      ['APP', 'AppFaze'],
      ['SMART', 'SmartFaze'],
    ],
  ],
  [
    'request source',
    opportunityRequestSource,
    OPPORTUNITY,
    'requestSource',
    [
      ['HOME', 'Accueil'],
      ['CONTACT', 'Contact'],
      ['OFFER_WEB', 'Page WebFaze'],
      ['OFFER_SHOP', 'Page ShopFaze'],
      ['OFFER_APP', 'Page AppFaze'],
      ['OFFER_SMART', 'Page SmartFaze'],
    ],
  ],
  [
    'timing',
    opportunityTiming,
    OPPORTUNITY,
    'timing',
    [
      ['ASAP', 'Dès que possible'],
      ['ONE_TO_THREE_MONTHS', '1 à 3 mois'],
      ['NO_DATE', 'Pas de date'],
    ],
  ],
  [
    "Osez l'IA",
    opportunityOsezIa,
    OPPORTUNITY,
    'osezIa',
    [
      ['NOT_CONCERNED', 'Non concerné'],
      ['TO_CHECK', 'À vérifier'],
      ['ELIGIBLE', 'Éligible'],
      ['FILED', 'Dossier déposé'],
      ['GRANTED', 'Accordé'],
      ['REFUSED', 'Refusé'],
    ],
  ],
  [
    'lost reason',
    opportunityLostReason,
    OPPORTUNITY,
    'lostReason',
    [
      ['PRICE', 'Prix'],
      ['TIMING', 'Délai'],
      ['NO_ANSWER', 'Sans réponse'],
      ['COMPETITOR', 'Concurrent'],
      ['ABANDONED', 'Projet abandonné'],
      ['OTHER', 'Autre'],
    ],
  ],
  [
    'client status',
    companyClientStatus,
    COMPANY,
    'clientStatus',
    [
      ['PROSPECT', 'Prospect'],
      ['CLIENT', 'Client'],
      ['FORMER_CLIENT', 'Ancien client'],
    ],
  ],
];

describe('Interfaze fields on standard objects', () => {
  it.each(SELECT_FIELDS)(
    'defines the %s select with the spec values in order',
    (_, definition, objectUniversalIdentifier, name, pairs) => {
      expect(definition.success).toBe(true);
      expect(definition.config.type).toBe(FieldType.SELECT);
      expect(definition.config.objectUniversalIdentifier).toBe(
        objectUniversalIdentifier,
      );
      expect(definition.config.name).toBe(name);
      expect(optionPairs(definition)).toEqual(pairs);
    },
  );

  it('gives every option its own identifier', () => {
    const optionIds = SELECT_FIELDS.flatMap(([, definition]) =>
      (definition.config.options ?? []).map((option) => option.id),
    );

    expect(new Set(optionIds).size).toBe(optionIds.length);
  });

  it('defaults the client status to prospect', () => {
    expect(companyClientStatus.config.defaultValue).toBe("'PROSPECT'");
  });

  it.each([
    [opportunityRequestMessage, 'requestMessage', FieldType.TEXT],
    [opportunityRequestRef, 'requestRef', FieldType.TEXT],
    [opportunityReceivedAt, 'receivedAt', FieldType.DATE_TIME],
  ])(
    'defines %#: the request details on opportunities',
    (definition, name, type) => {
      expect(definition.success).toBe(true);
      expect(definition.config.objectUniversalIdentifier).toBe(OPPORTUNITY);
      expect(definition.config.name).toBe(name);
      expect(definition.config.type).toBe(type);
    },
  );

  it.each([
    [opportunitySiteLeadId, 'siteLeadId'],
    [opportunitySiteLeadStatusSeen, 'siteLeadStatusSeen'],
  ])(
    'defines %#: the site lead link on opportunities, kept out of manual edits',
    (definition, name) => {
      expect(definition.success).toBe(true);
      expect(definition.config.objectUniversalIdentifier).toBe(OPPORTUNITY);
      expect(definition.config.name).toBe(name);
      expect(definition.config.type).toBe(FieldType.TEXT);
      expect(definition.config.isUIEditable).toBe(false);
    },
  );

  it('flags requests left without answer as a technical boolean, false by default', () => {
    expect(opportunityResponseOverdue.success).toBe(true);
    expect(opportunityResponseOverdue.config).toMatchObject({
      objectUniversalIdentifier: OPPORTUNITY,
      type: FieldType.BOOLEAN,
      name: 'responseOverdue',
      label: 'Sans réponse après 48 h',
      defaultValue: false,
      isUIEditable: false,
    });
  });
});
