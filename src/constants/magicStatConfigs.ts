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

export const MAGIC_CIRCLE_CONNECTION_INSTABILITY_COST = 1;
