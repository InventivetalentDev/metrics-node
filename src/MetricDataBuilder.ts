import {Metric} from "./Metric";

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