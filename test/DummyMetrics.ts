import {Flusher, IMetrics, Metric, Metrics} from "../src";

export class DummyMetrics implements IMetrics {

    readonly metrics: Set<Metric> = new Set<Metric>();

    private _flusher: Flusher;

    setFlusher(flusher: Flusher) {
        this._flusher = flusher;
    }

    metric(database: string, key: string): Metric;
    metric(database: string, key: string, retentionPolicy: string): Metric;
    metric(database: string, key: string, retentionPolicy: string = null): Metric {
        let m = new Metric(this, database, key, retentionPolicy);
        this.metrics.add(m);
        return m;
    }

}