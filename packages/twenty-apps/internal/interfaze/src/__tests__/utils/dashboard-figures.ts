import { type MetadataApiClient } from 'twenty-client-sdk/metadata';

export type DashboardWidget = {
  title: string;
  objectMetadataId: string;
  configuration: Record<string, unknown>;
};

type LayoutAnswer = {
  name: string;
  tabs?: {
    widgets?: {
      title: string;
      objectMetadataId: string | null;
      configuration: Record<string, unknown>;
    }[];
  }[];
};

type ChartAnswer = {
  data: unknown[];
  formattedToRawLookup?: Record<string, unknown>;
  indexBy?: string;
  keys?: string[];
};

const COMMON_CHART_FIELDS = {
  configurationType: true,
  aggregateFieldMetadataId: true,
  aggregateOperation: true,
  filter: true,
  timezone: true,
  firstDayOfTheWeek: true,
} as const;

// The chart services validate their input: the GraphQL extras and unset options stay out.
const chartInput = (configuration: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(configuration).filter(
      ([key, value]) => key !== '__typename' && value !== null,
    ),
  );

export const loadDashboardWidgets = async (
  metadata: MetadataApiClient,
  layoutName: string,
): Promise<Map<string, DashboardWidget>> => {
  const response = (await metadata.query({
    getPageLayouts: {
      __args: { pageLayoutType: 'STANDALONE_PAGE' },
      name: true,
      tabs: {
        widgets: {
          title: true,
          objectMetadataId: true,
          configuration: {
            on_AggregateChartConfiguration: COMMON_CHART_FIELDS,
            on_PieChartConfiguration: {
              ...COMMON_CHART_FIELDS,
              groupByFieldMetadataId: true,
              dateGranularity: true,
              orderBy: true,
              hideEmptyCategory: true,
            },
            on_BarChartConfiguration: {
              ...COMMON_CHART_FIELDS,
              primaryAxisGroupByFieldMetadataId: true,
              primaryAxisDateGranularity: true,
              primaryAxisOrderBy: true,
              omitNullValues: true,
              layout: true,
            },
          },
        },
      },
    },
  } as never)) as { getPageLayouts: LayoutAnswer[] };

  const layout = response.getPageLayouts.find(
    ({ name }) => name === layoutName,
  );

  if (!layout) {
    throw new Error(`No standalone page named ${layoutName}`);
  }

  return new Map(
    (layout.tabs ?? [])
      .flatMap(({ widgets }) => widgets ?? [])
      .map(({ title, objectMetadataId, configuration }) => [
        title,
        {
          title,
          objectMetadataId: objectMetadataId ?? '',
          configuration: chartInput(configuration),
        },
      ]),
  );
};

const createdAtFieldIds = new Map<string, string>();

const createdAtFieldIdOf = async (
  metadata: MetadataApiClient,
  objectMetadataId: string,
): Promise<string> => {
  const known = createdAtFieldIds.get(objectMetadataId);

  if (known) {
    return known;
  }

  const response = (await metadata.query({
    fields: {
      __args: {
        paging: { first: 500 },
        filter: { objectMetadataId: { eq: objectMetadataId } },
      },
      edges: { node: { id: true, name: true } },
    },
  } as never)) as {
    fields: { edges: { node: { id: string; name: string } }[] };
  };

  const field = response.fields.edges.find(
    ({ node }) => node.name === 'createdAt',
  );

  if (!field) {
    throw new Error(`No createdAt field on object ${objectMetadataId}`);
  }

  createdAtFieldIds.set(objectMetadataId, field.node.id);

  return field.node.id;
};

const pieChartData = async (
  metadata: MetadataApiClient,
  objectMetadataId: string,
  configuration: Record<string, unknown>,
): Promise<ChartAnswer> =>
  (
    (await metadata.query({
      pieChartData: {
        __args: { input: { objectMetadataId, configuration } },
        data: { key: true, value: true },
        formattedToRawLookup: true,
      },
    } as never)) as { pieChartData: ChartAnswer }
  ).pieChartData;

// A figure tile is the sum of the same aggregate split by creation year:
// same chart service, same filter conversion as the dashboard itself.
export const widgetTotal = async (
  metadata: MetadataApiClient,
  widget: DashboardWidget,
): Promise<number> => {
  const answer = await pieChartData(metadata, widget.objectMetadataId, {
    ...widget.configuration,
    configurationType: 'PIE_CHART',
    groupByFieldMetadataId: await createdAtFieldIdOf(
      metadata,
      widget.objectMetadataId,
    ),
    dateGranularity: 'YEAR',
  });

  return (answer.data as { value: number }[]).reduce(
    (total, { value }) => total + value,
    0,
  );
};

const rawKey = (answer: ChartAnswer, formatted: unknown): string =>
  String(answer.formattedToRawLookup?.[String(formatted)] ?? formatted);

export const widgetBreakdown = async (
  metadata: MetadataApiClient,
  widget: DashboardWidget,
): Promise<Record<string, number>> => {
  if (widget.configuration.configurationType === 'PIE_CHART') {
    const answer = await pieChartData(
      metadata,
      widget.objectMetadataId,
      widget.configuration,
    );

    return Object.fromEntries(
      (answer.data as { key: string; value: number }[]).map(
        ({ key, value }) => [rawKey(answer, key), value],
      ),
    );
  }

  const answer = (
    (await metadata.query({
      barChartData: {
        __args: {
          input: {
            objectMetadataId: widget.objectMetadataId,
            configuration: widget.configuration,
          },
        },
        data: true,
        indexBy: true,
        keys: true,
        formattedToRawLookup: true,
      },
    } as never)) as { barChartData: ChartAnswer }
  ).barChartData;

  const [valueKey] = answer.keys ?? [];

  return Object.fromEntries(
    (answer.data as Record<string, number | string>[]).map((row) => [
      rawKey(answer, row[answer.indexBy ?? '']),
      Number(row[valueKey] ?? 0),
    ]),
  );
};
