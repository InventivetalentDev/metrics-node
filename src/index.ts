import {IClusterConfig, InfluxDB, IPoint, ISingleHostConfig} from "influx";

export class Metrics {

    readonly influx: InfluxDB;
    readonly metrics: Set<Metric> = new Set<Metric>();

    private _flusher: Flusher;

    constructor(url?: string);
    constructor(config: ISingleHostConfig);
    constructor(config: IClusterConfig);
    constructor(urlOrConfig: string | ISingleHostConfig | IClusterConfig) {
        if (!urlOrConfig) {
            urlOrConfig = process.env.INFLUX_URL;
        }
        if (!urlOrConfig) {
            throw new Error("No InfluxDB URL/config provided");
        }
        if (typeof urlOrConfig === "string") {
            this.influx = new InfluxDB(urlOrConfig);
        } else {
            this.influx = new InfluxDB(urlOrConfig);
        }
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
    callback: Function;

    constructor(handler: Metrics) {
        this.handler = handler;
    }

    flush() {
        return this._flush(this.handler.metrics);
    }

    _flush(metrics: Set<Metric>) {
        let promises: Promise<void>[] = [];
        let pointsByDatabase = Flusher._collectPointsByDatabase(metrics);
        pointsByDatabase.forEach((points, dbRp) => {
            if (points && points.length > 0) {
                let promise: Promise<void> = this.handler.influx.writePoints(points, {
                    database: dbRp.db,
                    retentionPolicy: dbRp.rp
                });
                promises.push(promise);
            }
        })
        let all = Promise.all(promises);
        if (this.callback) {
            this.callback(all, pointsByDatabase);
        }
        return all;
    }

    static _collectPointsByDatabase(metrics: Set<Metric>): Map<DBandRP, IPoint[]> {
        let pointsByDatabase: Map<DBandRP, IPoint[]> = new Map<DBandRP, IPoint[]>();
        metrics.forEach(m => {
            const k: DBandRP = {db: m.database, rp: m.retentionPolicy};
            let points = pointsByDatabase.get(k);
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
                });
            });
            if (point.fields) {
                points.push(point);
                pointsByDatabase.set(k, points);
            }

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
        this._timer = setInterval(() => this.flush(), interval);
    }

    cancel() {
        clearInterval(this._timer);
    }
}

export class Metric {

    private readonly handler: Metrics;
    readonly database: string;
    readonly retentionPolicy: string | null;
    readonly key: string;

    readonly _cache: Map<Map<string, string>, Map<string, number>> = new Map<Map<string, string>, Map<string, number>>(); // <tags> => <field, value>

    constructor(handler: Metrics, database: string, key: string);
    constructor(handler: Metrics, database: string, key: string, retentionPolicy: string = null) {
        this.handler = handler;
        this.database = database;
        this.retentionPolicy = retentionPolicy;
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

interface DBandRP {
    db: string;
    rp: string;
}