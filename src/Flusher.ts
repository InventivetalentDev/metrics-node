import {IPoint} from "influx";
import {IMetrics, Metric, Metrics} from "./index";

export class Flusher {

    callback: (pointsByDatabase: Map<string, IPoint[]>) => void;

    constructor(readonly handler: IMetrics) {
    }

    async flush() {
        return await this._flush(this.handler.metrics);
    }

    async _flush(metrics: Set<Metric>) {
        let promises: Promise<void>[] = [];
        let pointsByDatabase = this._collectPointsByDatabase(metrics);
        pointsByDatabase.forEach((points, dbRp) => {
            if (points && points.length > 0) {
                const [db, rp] = dbRp.split(":");
                let promise: Promise<void> = this._writePoints(points, db === "null" ? undefined : db, rp === "null" ? undefined : rp);
                promises.push(promise);
            }
        })
        await Promise.all(promises);
        if (this.callback) {
            this.callback(pointsByDatabase);
        }
    }

    async _writePoints(points: IPoint[], db: string | undefined, rp: string | undefined) {
        return await (this.handler as Metrics).influx.writePoints(points, {
            database: db,
            retentionPolicy: rp
        });
    }

    _collectPointsByDatabase(metrics: Set<Metric>): Map<string, IPoint[]> {
        let pointsByDatabase: Map<string, IPoint[]> = new Map<string, IPoint[]>();
        metrics.forEach(m => {
            const k = `${m.database || null}:${m.retentionPolicy || null}`;
            let points = pointsByDatabase.get(k);
            if (!points) {
                points = [];
            }

            m._cache.forEach((counts, tagsKey) => {
                let point: IPoint = {
                    measurement: m.key,
                    tags: {},
                    fields: {}
                };

                const tags = Metric._parseKey(tagsKey);
                tags.forEach((v, k) => {
                    if (v) {
                        point.tags[k] = v;
                    }
                });
                counts.forEach((v, k) => {
                    if (v) {
                        point.fields[k] = v;
                    }
                });

                if (point.fields) {
                    points.push(point);
                    pointsByDatabase.set(k, points);
                }
            });


            // Clear cached data
            m._cache.clear();
        });
        return pointsByDatabase;
    }

}