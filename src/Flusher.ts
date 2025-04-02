import {IPoint} from "influx";
import {IMetrics, Metric, Metrics} from "./index";

export class Flusher {

    callback: Function;

    constructor(readonly handler: IMetrics) {
    }

    async flush() {
        return await this._flush(this.handler.metrics);
    }

    async _flush(metrics: Set<Metric>) {
        let promises: Promise<void>[] = [];
        let pointsByDatabase = Flusher._collectPointsByDatabase(metrics);
        pointsByDatabase.forEach((points, dbRp) => {
            if (points && points.length > 0) {
                const [db, rp] = dbRp.split(":");
                let promise: Promise<void> = (this.handler as Metrics).influx.writePoints(points, {
                    database: db === "null" ? undefined : db,
                    retentionPolicy: rp === "null" ? undefined : rp
                });
                promises.push(promise);
            }
        })
        let all = Promise.all(promises);
        if (this.callback) {
            this.callback(all, pointsByDatabase);
        }
        return await all;
    }

    static _collectPointsByDatabase(metrics: Set<Metric>): Map<string, IPoint[]> {
        let pointsByDatabase: Map<string, IPoint[]> = new Map<string, IPoint[]>();
        metrics.forEach(m => {
            const k = `${m.database || null}:${m.retentionPolicy || null}`;
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