export const MAGIC_STAT_BRANCH_AGGREGATION_IDS = {
    SUM: 'sum',
    MAX: 'max',
} as const;

export const MAGIC_STAT_BRANCH_AGGREGATIONS = Object.values(MAGIC_STAT_BRANCH_AGGREGATION_IDS);

export const MAGIC_STAT_AGGREGATION_OPERATION_IDS = {
    SUM: 'sum',
    MULTIPLY: 'multiply',
    MAX: 'max',
} as const;

export const MAGIC_STAT_AGGREGATION_OPERATIONS = Object.values(MAGIC_STAT_AGGREGATION_OPERATION_IDS);

export const MAGIC_STAT_SCALING_OPERATION_IDS = {
    NONE: 'none',
    EXPONENTIAL_BY_NODE_COUNT: 'exponentialByNodeCount',
} as const;

export const MAGIC_STAT_SCALING_OPERATIONS = Object.values(MAGIC_STAT_SCALING_OPERATION_IDS);
