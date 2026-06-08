export const MAGIC_STAT_BRANCH_AGGREGATIONS = {
    SUM: 'sum',
    MAX: 'max',
} as const;

export const MAGIC_STAT_BRANCH_AGGREGATION_VALUES = Object.values(MAGIC_STAT_BRANCH_AGGREGATIONS);

export const MAGIC_STAT_AGGREGATION_OPERATIONS = {
    SUM: 'sum',
    MULTIPLY: 'multiply',
    MAX: 'max',
} as const;

export const MAGIC_STAT_AGGREGATION_OPERATION_VALUES = Object.values(MAGIC_STAT_AGGREGATION_OPERATIONS);

export const MAGIC_STAT_SCALING_OPERATIONS = {
    NONE: 'none',
    EXPONENTIAL_BY_NODE_COUNT: 'exponentialByNodeCount',
} as const;

export const MAGIC_STAT_SCALING_OPERATION_VALUES = Object.values(MAGIC_STAT_SCALING_OPERATIONS);
