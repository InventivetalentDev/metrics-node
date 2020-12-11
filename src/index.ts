import { InfluxDB, IPoint, ISingleHostConfig } from "influx";

export class Metrics {

    readonly influx: InfluxDB;
    readonly metrics: Set<Metric> = new Set<Metric>();

    private _flusher: Flusher;

    constructor(config: ISingleHostConfig) {
        this.influx = new InfluxDB(config);
    }

    setFlusher(flusher: Flusher) {
        this._flusher = flusher;
    }

    metric(database: string, key: string): Metric {
        let m = new Metric(this, database, key);
        this.metrics.add(m);
        return m;
    }

}

export class Flusher {

    private readonly handler: Metrics;

    constructor(handler: Metrics) {
        this.handler = handler;
    }

    flush(metrics: Set<Metric>) {
        let promises: Promise<void>[] = [];
        let pointsByDatabase = this._collectPointsByDatabase(metrics);
        pointsByDatabase.forEach((points, db) => {
            let promise: Promise<void> = this.handler.influx.writePoints(points, {
                database: db
            });
            promises.push(promise);
        })
        return Promise.all(promises);
    }

    _collectPointsByDatabase(metrics: Set<Metric>): Map<string, IPoint[]> {
        let pointsByDatabase: Map<string, IPoint[]> = new Map<string, IPoint[]>();
        metrics.forEach(m => {
            let points = pointsByDatabase.get(m.database);
            if (!points) {
                points = [];
            }
            let point: IPoint = {
                measurement: m.key
            };
            m._cache.forEach((counts, tags) => {
                point.tags = {};
                tags.forEach((v, k) => point.tags[k] = v);
                point.fields = {};
                counts.forEach((v, k) => {
                    point.fields[k] = v;
                })
            });
            points.push(point);
            pointsByDatabase.set(m.database, points);

            // Clear cached data
            m._cache.clear();
        });
        return pointsByDatabase;
    }

}

export class IntervalFlusher extends Flusher {

    readonly _timer: NodeJS.Timeout;

    constructor(handler: Metrics, interval: number) {
        super(handler);
        this._timer = setInterval(this.flush, interval);
    }

    cancel() {
        clearInterval(this._timer);
    }
}

export class Metric {

    private readonly handler: Metrics;
    readonly database: string;
    readonly key: string;

    readonly _cache: Map<Map<string, string>, Map<string, number>> = new Map<Map<string, string>, Map<string, number>>(); // <tags> => <field, value>

    constructor(handler: Metrics, database: string, key: string) {
        this.handler = handler;
        this.database = database;
        this.key = key;
    }

    _inc(amount: number = 1, field: string = "count", tags: Map<string, string>) {
        let counts = this._cache.get(tags);
        if (!counts) {
            counts = new Map<string, number>();
        }
        let count = counts.get(field) || 0;
        count += amount;
        counts.set(field, count);
        this._cache.set(tags, counts);
    }

    field(field: string): MetricDataBuilder {
        return new MetricDataBuilder(this).field(field);
    }

    tag(tag: string, value: string): MetricDataBuilder {
        return new MetricDataBuilder(this).tag(tag, value);
    }

    inc(amount: number = 1): void {
        return new MetricDataBuilder(this).inc(amount);
    }

}

export class MetricDataBuilder {

    private readonly metric: Metric;

    private _field: string = "count";
    private _tags: Map<string, string> = new Map<string, string>();

    constructor(metric: Metric) {
        this.metric = metric;
    }

    field(field: string): MetricDataBuilder {
        this._field = field;
        return this;
    }

    tag(tag: string, value: string): MetricDataBuilder {
        this._tags.set(tag, value);
        return this;
    }

    inc(amount: number = 1): void {
        this.metric._inc(amount, this._field, this._tags);
    }

}
