import {Flusher, IMetrics, IntervalFlusher, Metric, Metrics} from "../src";
import {IPoint} from "influx";

export class TestFlusher extends Flusher {

    collectedPoints: Map<string, IPoint[]> = new Map<string, IPoint[]>();

    writtenDb: (string | undefined)[]=[];
    writtenRp: (string | undefined)[]=[];
    writtenPoints: IPoint[][] = [];

    constructor(handler: IMetrics) {
        super(handler);
    }

    _collectPointsByDatabase(metrics: Set<Metric>): Map<string, IPoint[]> {
        this.collectedPoints = super._collectPointsByDatabase(metrics);
        return this.collectedPoints;
    }

    async _writePoints(points: IPoint[], db: string | undefined, rp: string | undefined): Promise<void> {
        console.log("db: ", db);
        this.writtenDb.push(db);
        console.log("rp: ", rp);
        this.writtenRp.push(rp);
        console.log("points: ", points);
        this.writtenPoints.push(points);
    }
}