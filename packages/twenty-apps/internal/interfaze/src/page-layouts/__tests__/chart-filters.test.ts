import { ViewFilterOperand } from 'twenty-sdk/define';
import { describe, expect, it } from 'vitest';

import {
  chartFilter,
  isAnyOf,
  isInPast,
  isNoneOf,
  isRelative,
  isTrue,
  relativeDate,
  withinLast,
} from 'src/page-layouts/utils/chart-filters';

const FIELD = '6b5bb3f5-3b8f-4b9e-9a51-0c2d6f3f8f11';

describe('chart filters', () => {
  it('writes relative dates in the agency time zone', () => {
    expect(relativeDate('PAST', 6, 'DAY')).toBe(
      'PAST_6_DAY;;Europe/Paris;;MONDAY;;',
    );
  });

  it('counts the current period in a window of the last n periods', () => {
    expect(withinLast(FIELD, 24, 'HOUR')).toEqual([
      {
        fieldMetadataUniversalIdentifier: FIELD,
        operand: ViewFilterOperand.IS_RELATIVE,
        value: 'PAST_23_HOUR;;Europe/Paris;;MONDAY;;',
      },
      {
        fieldMetadataUniversalIdentifier: FIELD,
        operand: ViewFilterOperand.IS_RELATIVE,
        value: 'THIS_1_HOUR;;Europe/Paris;;MONDAY;;',
      },
    ]);
  });

  it.each([
    [isAnyOf(FIELD, ['WON']), ViewFilterOperand.IS, '["WON"]'],
    [isNoneOf(FIELD, ['DONE']), ViewFilterOperand.IS_NOT, '["DONE"]'],
    [isTrue(FIELD), ViewFilterOperand.IS, 'true'],
    [isInPast(FIELD), ViewFilterOperand.IS_IN_PAST, ''],
    [
      isRelative(FIELD, 'NEXT_30_DAY'),
      ViewFilterOperand.IS_RELATIVE,
      'NEXT_30_DAY',
    ],
  ])('builds the %# filter', (filter, operand, value) => {
    expect(filter).toEqual({
      fieldMetadataUniversalIdentifier: FIELD,
      operand,
      value,
    });
  });

  it('puts the alternative filters in one OR group next to the others', () => {
    const always = isAnyOf(FIELD, ['ACTIVE']);
    const [past, current] = withinLast(FIELD, 7, 'DAY');

    expect(
      chartFilter([always], { groupId: 'group-1', filters: [past, current] }),
    ).toEqual({
      recordFilters: [
        always,
        { ...past, recordFilterGroupId: 'group-1' },
        { ...current, recordFilterGroupId: 'group-1' },
      ],
      recordFilterGroups: [{ id: 'group-1', logicalOperator: 'OR' }],
    });
  });

  it('has no group without alternatives', () => {
    expect(chartFilter([isTrue(FIELD)])).toEqual({
      recordFilters: [isTrue(FIELD)],
      recordFilterGroups: [],
    });
  });
});
