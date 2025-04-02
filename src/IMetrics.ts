import {Metric} from "./Metric";
import {Flusher} from "./Flusher";

export interface IMetrics {
    get metrics(): Set<Metric>;

    setFlusher(flusher: Flusher): void;

    metric(database: string, key: string): Metric;

    metric(database: string, key: string, retentionPolicy: string): Metric;
}
