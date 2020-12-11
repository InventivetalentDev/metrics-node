/// <reference types="node" />
import { InfluxDB, IPoint, ISingleHostConfig } from "influx";
export declare class Metrics {
    readonly influx: InfluxDB;
    readonly metrics: Set<Metric>;
    private _flusher;
    constructor(config: ISingleHostConfig);
    setFlusher(flusher: Flusher): void;
    metric(database: string, key: string): Metric;
}
export declare class Flusher {
    private readonly handler;
    callback: Function;
    constructor(handler: Metrics);
    flush(metrics: Set<Metric>): Promise<void[]>;
    static _collectPointsByDatabase(metrics: Set<Metric>): Map<string, IPoint[]>;
}
export declare class IntervalFlusher extends Flusher {
    readonly _timer: NodeJS.Timeout;
    constructor(handler: Metrics, interval: number);
    flush(metrics: Set<Metric>): Promise<void[]>;
    cancel(): void;
}
export declare class Metric {
    private readonly handler;
    readonly database: string;
    readonly key: string;
    readonly _cache: Map<Map<string, string>, Map<string, number>>;
    constructor(handler: Metrics, database: string, key: string);
    _inc(amount: number, field: string, tags: Map<string, string>): void;
    field(field: string): MetricDataBuilder;
    tag(tag: string, value: string): MetricDataBuilder;
    inc(amount?: number): void;
}
export declare class MetricDataBuilder {
    private readonly metric;
    private _field;
    private _tags;
    constructor(metric: Metric);
    field(field: string): MetricDataBuilder;
    tag(tag: string, value: string): MetricDataBuilder;
    inc(amount?: number): void;
}
