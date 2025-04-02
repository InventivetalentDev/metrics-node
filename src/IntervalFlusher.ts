import {Flusher, IMetrics} from "./index";

export class IntervalFlusher extends Flusher {

    readonly _timer: NodeJS.Timeout | number;

    constructor(handler: IMetrics, interval: number) {
        super(handler);
        this._timer = setInterval(() => this.flush(), interval);
    }

    cancel() {
        clearInterval(this._timer as number);
    }
}
