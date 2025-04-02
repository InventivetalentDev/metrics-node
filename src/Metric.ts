import {IMetrics} from "./IMetrics";
import {MetricDataBuilder} from "./MetricDataBuilder";

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
        const sortedTags = new Map([...tags.entries()].sort());
        const key = Metric._mapKey(sortedTags);
        let counts = this._cache.get(key);
        if (!counts) {
            counts = new Map<string, number>();
        }
        let count = counts.get(field) || 0;
        count += amount;
        counts.set(field, count);
        this._cache.set(key, counts);
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
            if (!v) {
                v = "";
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
            .replace(/=/g, "\\=");
    }

}