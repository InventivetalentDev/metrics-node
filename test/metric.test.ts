// import '@types/jest';
import {DummyMetrics} from "./DummyMetrics";
import {Flusher, IMetrics, IntervalFlusher, Metric, Metrics} from "../src";
import exp = require("node:constants");

let metrics: IMetrics;
let metric: Metric;
describe('metric', () => {

    describe('create', () => {
        test('should create a metric', () => {
            metrics = new DummyMetrics();
            metric = metrics.metric('testdb', 'test');
            expect(metric).toBeDefined();
        });
    });

    describe('inc', () => {
        test('should increment a metric', () => {
            expect(metric._cache.size).toBe(0);

            metric.inc();
            console.log(metric._cache)
            expect(metric._cache.size).toBe(1);
        });
        test('should increment the metric again', () => {
            expect(metric._cache.size).toBe(1);

            metric.inc(3);
            console.log(metric._cache)
            expect(metric._cache.size).toBe(1); // same metric, should not increase
        });
    })

    describe('inc-tag', () => {
        test('should increment a metric with tag', () => {
            expect(metric._cache.size).toBe(1);

            metric
                .tag('server', 'test')
                .inc();
            console.log(metric._cache)
            expect(metric._cache.size).toBe(2); // new metric, should be separate
        });
        test('should increment the metric again', () => {
            expect(metric._cache.size).toBe(2);

            metric
                .tag('server', 'test')
                .inc();
            console.log(metric._cache)
            expect(metric._cache.size).toBe(2); // same metric, should not increase
        });
    })

});

describe('flusher', () => {

    describe('collect', () => {
        test('should collect the metrics', () => {
            const flusher = new Flusher(metrics);
            expect(flusher).toBeDefined();
            expect(metrics.metrics).toBeDefined();
            let collected = flusher._collectPointsByDatabase(metrics.metrics);
            expect(collected).toBeDefined();
            console.log(collected);

            let firstKey = collected.keys().next().value;
            expect(firstKey).toBeDefined();
            expect(firstKey.db).toBe('testdb');
            expect(firstKey.rp).toBeNull();

            let firstValue = collected.get(firstKey);
            expect(firstValue).toBeDefined();
            console.log(firstValue);
            let firstPoint = firstValue[0];
            expect(firstPoint).toBeDefined();
            expect(firstPoint.fields).toBeDefined();
            expect(firstPoint.tags).toBeDefined();
            expect(firstPoint.measurement).toBe('test');
        })
    })

})