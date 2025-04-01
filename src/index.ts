import {IClusterConfig, InfluxDB, IPoint, ISingleHostConfig} from "influx";

export class Metrics implements IMetrics {

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

    metric(database: string, key: string): Metric;
    metric(database: string, key: string, retentionPolicy: string): Metric;
    metric(database: string, key: string, retentionPolicy: string = null): Metric {
        let m = new Metric(this, database, key, retentionPolicy);
        this.metrics.add(m);
        return m;
    }

}

export interface IMetrics {
    get metrics(): Set<Metric>;

    setFlusher(flusher: Flusher): void;

    metric(database: string, key: string): Metric;

    metric(database: string, key: string, retentionPolicy: string): Metric;
}

export class Flusher {

    private readonly handler: IMetrics;
    callback: Function;

    constructor(handler: IMetrics) {
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
                let promise: Promise<void> = (this.handler as Metrics).influx.writePoints(points, {
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
            m._cache.forEach((counts, tagsKey) => {
                const tags = Metric._parseKey(tagsKey);
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

    readonly _timer: NodeJS.Timeout | number;

    constructor(handler: Metrics, interval: number) {
        super(handler);
        this._timer = setInterval(() => this.flush(), interval);
    }

    cancel() {
        clearInterval(this._timer as number);
    }
}

export class Metric {

    private readonly handler: IMetrics;
    readonly database: string;
    readonly retentionPolicy: string | null;
    readonly key: string;

    readonly _cache: Map<string, Map<string, number>> = new Map<string, Map<string, number>>(); // <tags> => <field, value>

    constructor(handler: IMetrics, database: string, key: string);
    constructor(handler: IMetrics, database: string, key: string, retentionPolicy: string);
    constructor(handler: IMetrics, database: string, key: string, retentionPolicy: string = null) {
        this.handler = handler;
        this.database = database;
        this.retentionPolicy = retentionPolicy;
        this.key = key;
    }

    _inc(amount: number = 1, field: string = "count", tags: Map<string, string>) {
        let counts = this._cache.get(Metric._mapKey(tags));
        if (!counts) {
            counts = new Map<string, number>();
        }
        let count = counts.get(field) || 0;
        count += amount;
        counts.set(field, count);
        this._cache.set(Metric._mapKey(tags), counts);
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

    static _mapKey(tags: Map<string, string>): string {
        let key = "";
        tags.forEach((v, k) => {
            if (!k) {
                return;
            }
            key += `${this._escapeTag(k)}=${this._escapeTag(v)},`;
        });
        key = key.slice(0, -1);
        return key;
    }

    static _parseKey(key: string): Map<string, string> {
        let tags = new Map<string, string>();
        let parts = key.split(",");
        parts.forEach(p => {
            let kv = p.split("=", 2);
            tags.set(kv[0], kv[1]);
        });
        return tags;
    }

    // escapes influxdb tag keys and values
    static _escapeTag(key: string): string {
        return key
            .replace(/,/g, "\\,")
            .replace(/ /g, "\\ ")
            .replace(/=/g, "\\=");
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