export const GRAPH_PERFORMANCE_OPERATION_IDS = {
    CALCULATE_MAGIC: 'calculateMagic',
    SYNC_GRAPH_TOPOLOGY: 'syncGraphTopology',
    CHECK_CONNECTION: 'checkConnection',
    BUILD_MAGIC_CIRCLE_RENDER_MODELS: 'buildMagicCircleRenderModels',
} as const;

const GRAPH_PERFORMANCE_LOG_PREFIX = '[graph:performance]';
const GRAPH_PERFORMANCE_LOG_THRESHOLD_MS = 8;
const GRAPH_PERFORMANCE_DURATION_PRECISION = 100;

type GraphPerformanceOperationId =
    (typeof GRAPH_PERFORMANCE_OPERATION_IDS)[keyof typeof GRAPH_PERFORMANCE_OPERATION_IDS];

type GraphPerformanceMetadata = Record<string, number | string | boolean | undefined>;

export function measureGraphOperation<T>(
    operationId: GraphPerformanceOperationId,
    metadata: GraphPerformanceMetadata,
    operation: () => T
): T {
    if (!import.meta.env.DEV) return operation();

    const startedAt = performance.now();

    try {
        return operation();
    } finally {
        const durationMs = performance.now() - startedAt;
        if (durationMs >= GRAPH_PERFORMANCE_LOG_THRESHOLD_MS) {
            console.debug(GRAPH_PERFORMANCE_LOG_PREFIX, operationId, {
                ...metadata,
                durationMs: roundDuration(durationMs),
            });
        }
    }
}

function roundDuration(value: number): number {
    return Math.round(value * GRAPH_PERFORMANCE_DURATION_PRECISION) /
        GRAPH_PERFORMANCE_DURATION_PRECISION;
}
