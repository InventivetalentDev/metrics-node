import {IClusterConfig, InfluxDB, ISingleHostConfig} from "influx";
import {Metric} from "./Metric";
import {Flusher} from "./Flusher";
import {IMetrics} from "./IMetrics";

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