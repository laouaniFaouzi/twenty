import {
  type PageLayoutWidgetUniversalConfiguration,
  ViewFilterGroupLogicalOperator,
  ViewFilterOperand,
} from 'twenty-sdk/define';

import { AGENCY_TIME_ZONE } from 'src/utils/agency-date';

type ChartFilter = NonNullable<
  Extract<
    PageLayoutWidgetUniversalConfiguration,
    { configurationType: 'AGGREGATE_CHART' }
  >['filter']
>;

type ChartRecordFilter = NonNullable<ChartFilter['recordFilters']>[number];

type RelativeDateUnit = 'HOUR' | 'DAY' | 'MONTH';

export const relativeDate = (
  direction: 'PAST' | 'THIS' | 'NEXT',
  amount: number,
  unit: RelativeDateUnit,
): string => `${direction}_${amount}_${unit};;${AGENCY_TIME_ZONE};;MONDAY;;`;

const recordFilter = (
  fieldMetadataUniversalIdentifier: string,
  operand: ViewFilterOperand,
  value: string,
): ChartRecordFilter => ({ fieldMetadataUniversalIdentifier, operand, value });

export const isAnyOf = (fieldUniversalIdentifier: string, values: string[]) =>
  recordFilter(
    fieldUniversalIdentifier,
    ViewFilterOperand.IS,
    JSON.stringify(values),
  );

export const isNoneOf = (fieldUniversalIdentifier: string, values: string[]) =>
  recordFilter(
    fieldUniversalIdentifier,
    ViewFilterOperand.IS_NOT,
    JSON.stringify(values),
  );

export const isTrue = (fieldUniversalIdentifier: string) =>
  recordFilter(fieldUniversalIdentifier, ViewFilterOperand.IS, 'true');

export const isInPast = (fieldUniversalIdentifier: string) =>
  recordFilter(fieldUniversalIdentifier, ViewFilterOperand.IS_IN_PAST, '');

export const isRelative = (fieldUniversalIdentifier: string, value: string) =>
  recordFilter(fieldUniversalIdentifier, ViewFilterOperand.IS_RELATIVE, value);

// Twenty's PAST_n windows stop at the start of the current period, so the
// current one is added beside them: today counts in "the last 7 days".
export const withinLast = (
  fieldUniversalIdentifier: string,
  amount: number,
  unit: RelativeDateUnit,
): ChartRecordFilter[] => [
  isRelative(fieldUniversalIdentifier, relativeDate('PAST', amount - 1, unit)),
  isRelative(fieldUniversalIdentifier, relativeDate('THIS', 1, unit)),
];

export const chartFilter = (
  filters: ChartRecordFilter[],
  anyOf?: { groupId: string; filters: ChartRecordFilter[] },
): ChartFilter => ({
  recordFilters: [
    ...filters,
    ...(anyOf?.filters ?? []).map((filter) => ({
      ...filter,
      recordFilterGroupId: anyOf?.groupId,
    })),
  ],
  recordFilterGroups: anyOf
    ? [
        {
          id: anyOf.groupId,
          logicalOperator: ViewFilterGroupLogicalOperator.OR,
        },
      ]
    : [],
});
