import {Flusher, Metrics} from "./index";

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
