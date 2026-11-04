import { describe, expect, it } from 'vitest';

import { getEdgeNodes } from 'src/utils/record-api-client';

describe('getEdgeNodes', () => {
  it('returns the nodes of a connection', () => {
    expect(
      getEdgeNodes<{ id: string }>(
        { projects: { edges: [{ node: { id: 'a' } }, { node: { id: 'b' } }] } },
        'projects',
      ),
    ).toEqual([{ id: 'a' }, { id: 'b' }]);
  });

  it('returns an empty list when the key is missing or null', () => {
    expect(getEdgeNodes({}, 'projects')).toEqual([]);
    expect(getEdgeNodes({ projects: null }, 'projects')).toEqual([]);
  });
});
