"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricDataBuilder = exports.Metric = exports.IntervalFlusher = exports.Flusher = exports.Metrics = void 0;
const influx_1 = require("influx");
class Metrics {
    constructor(config) {
        this.metrics = new Set();
        this.influx = new influx_1.InfluxDB(config);
    }
    setFlusher(flusher) {
        this._flusher = flusher;
    }
    metric(database, key) {
        let m = new Metric(this, database, key);
        this.metrics.add(m);
        return m;
    }
}
exports.Metrics = Metrics;
class Flusher {
    constructor(handler) {
        this.handler = handler;
    }
    flush() {
        return this._flush(this.handler.metrics);
    }
    _flush(metrics) {
        let promises = [];
        let pointsByDatabase = Flusher._collectPointsByDatabase(metrics);
        pointsByDatabase.forEach((points, db) => {
            let promise = this.handler.influx.writePoints(points, {
                database: db
            });
            promises.push(promise);
        });
        let all = Promise.all(promises);
        if (this.callback) {
            this.callback(all, pointsByDatabase);
        }
        return all;
    }
    static _collectPointsByDatabase(metrics) {
        let pointsByDatabase = new Map();
        metrics.forEach(m => {
            let points = pointsByDatabase.get(m.database);
            if (!points) {
                points = [];
            }
            let point = {
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
            points.push(point);
            pointsByDatabase.set(m.database, points);
            // Clear cached data
            m._cache.clear();
        });
        return pointsByDatabase;
    }
}
exports.Flusher = Flusher;
class IntervalFlusher extends Flusher {
    constructor(handler, interval) {
        super(handler);
        this._timer = setInterval(() => this.flush(), interval);
    }
    cancel() {
        clearInterval(this._timer);
    }
}
exports.IntervalFlusher = IntervalFlusher;
class Metric {
    constructor(handler, database, key) {
        this._cache = new Map(); // <tags> => <field, value>
        this.handler = handler;
        this.database = database;
        this.key = key;
    }
    _inc(amount = 1, field = "count", tags) {
        let counts = this._cache.get(tags);
        if (!counts) {
            counts = new Map();
        }
        let count = counts.get(field) || 0;
        count += amount;
        counts.set(field, count);
        this._cache.set(tags, counts);
    }
    field(field) {
        return new MetricDataBuilder(this).field(field);
    }
    tag(tag, value) {
        return new MetricDataBuilder(this).tag(tag, value);
    }
    inc(amount = 1) {
        return new MetricDataBuilder(this).inc(amount);
    }
}
exports.Metric = Metric;
class MetricDataBuilder {
    constructor(metric) {
        this._field = "count";
        this._tags = new Map();
        this.metric = metric;
    }
    field(field) {
        this._field = field;
        return this;
    }
    tag(tag, value) {
        this._tags.set(tag, value);
        return this;
    }
    inc(amount = 1) {
        this.metric._inc(amount, this._field, this._tags);
    }
}
exports.MetricDataBuilder = MetricDataBuilder;
