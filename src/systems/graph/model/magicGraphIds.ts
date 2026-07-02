const MAGIC_GRAPH_ID_SEGMENT_LENGTH = 10;

export type MagicGraphIdFactory = () => string;

export function createMagicGraphIdSegment(): string {
    return crypto.randomUUID()
        .replaceAll('-', '')
        .slice(0, MAGIC_GRAPH_ID_SEGMENT_LENGTH);
}
