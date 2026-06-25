export const BUILD_RESULT_EXPORT_ROLE_ATTRIBUTE = 'data-build-export-role';

export const BUILD_RESULT_EXPORT_ROLES = {
    GRAPH_PREVIEW: 'graph-preview',
    COMPOSITION_STAGE_FRAME: 'composition-stage-frame',
} as const;

export type BuildResultExportRole =
    (typeof BUILD_RESULT_EXPORT_ROLES)[keyof typeof BUILD_RESULT_EXPORT_ROLES];

export function buildResultExportRoleSelector(role: BuildResultExportRole): string {
    return `[${BUILD_RESULT_EXPORT_ROLE_ATTRIBUTE}="${role}"]`;
}
