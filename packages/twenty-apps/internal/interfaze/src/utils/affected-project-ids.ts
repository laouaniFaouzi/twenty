export const affectedProjectIds = (
  ...projectIds: (string | null | undefined)[]
): string[] => [
  ...new Set(
    projectIds.filter((projectId): projectId is string => Boolean(projectId)),
  ),
];
