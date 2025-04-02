// import '@types/jest';
import {DummyMetrics} from "./DummyMetrics";
import {Flusher, IMetrics, IntervalFlusher, Metric, Metrics} from "../src";
import exp = require("node:constants");
import {TestFlusher} from "./TestFlusher";
import {IPoint} from "influx";

let metrics: IMetrics;
let metric1: Metric;
let metric2: Metric;
describe('metric', () => {

    describe('create', () => {
        test('should create metrics', () => {
            metrics = new DummyMetrics();
        });

        test('should create a metric', () => {
            metric1 = metrics.metric('testdb', 'test');
            expect(metric1).toBeDefined();
        });
        test('should create another metric with different retention', () => {
            metric2 = metrics.metric('testdb', 'test_rp', 'one_month');
            expect(metric2).toBeDefined();
        });
    });

    describe('inc', () => {
        test('should increment metric1', () => {
            expect(metric1._cache.size).toBe(0);

            metric1.inc();
            console.log(metric1._cache)
            expect(metric1._cache.size).toBe(1);
            expect(metric1._cache.has('')).toBeTruthy();
            expect(metric1._cache.get('').get('count')).toBe(1);
        });
        test('should increment metric1 again', () => {
            expect(metric1._cache.size).toBe(1);

            metric1.inc(3);
            console.log(metric1._cache)
            expect(metric1._cache.size).toBe(1); // same metric, should not increase
            expect(metric1._cache.has('')).toBeTruthy();
            expect(metric1._cache.get('').get('count')).toBe(4);
        });

        test('should increment metric2', () => {
            expect(metric2._cache.size).toBe(0);

            metric2.inc();
            console.log(metric2._cache)
            expect(metric2._cache.size).toBe(1);
            expect(metric2._cache.has('')).toBeTruthy();
            expect(metric2._cache.get('').get('count')).toBe(1);
        });
        test('should increment metric2 again', () => {
            expect(metric2._cache.size).toBe(1);

            metric2.inc(5);
            console.log(metric2._cache)
            expect(metric2._cache.size).toBe(1); // same metric, should not increase
            expect(metric2._cache.has('')).toBeTruthy();
            expect(metric2._cache.get('').get('count')).toBe(6);
        });
    })

    describe('inc-tag', () => {
        test('should increment metric1 with tag', () => {
            expect(metric1._cache.size).toBe(1);

            metric1
                .tag('server', 'test')
                .inc();
            console.log(metric1._cache)
            expect(metric1._cache.size).toBe(2); // new metric, should be separate
            expect(metric1._cache.has('')).toBeTruthy();
            expect(metric1._cache.get('').get('count')).toBe(4);
            expect(metric1._cache.has('server=test')).toBeTruthy();
            expect(metric1._cache.get('server=test').get('count')).toBe(1);
        });
        test('should increment metric1 again', () => {
            expect(metric1._cache.size).toBe(2);

            metric1
                .tag('server', 'test')
                .inc();
            console.log(metric1._cache)
            expect(metric1._cache.size).toBe(2); // same metric, should not increase
            expect(metric1._cache.has('')).toBeTruthy();
            expect(metric1._cache.get('').get('count')).toBe(4);
            expect(metric1._cache.has('server=test')).toBeTruthy();
            expect(metric1._cache.get('server=test').get('count')).toBe(2);
        });

        test('should increment metric2 with tag', () => {
            expect(metric2._cache.size).toBe(1);

            metric2
                .tag('server', 'test')
                .inc();
            console.log(metric2._cache)
            expect(metric2._cache.size).toBe(2); // new metric, should be separate
            expect(metric2._cache.has('')).toBeTruthy();
            expect(metric2._cache.get('').get('count')).toBe(6);
            expect(metric2._cache.has('server=test')).toBeTruthy();
            expect(metric2._cache.get('server=test').get('count')).toBe(1);
        });
        test('should increment metric2 again', () => {
            expect(metric2._cache.size).toBe(2);

            metric2
                .tag('server', 'test')
                .inc(2);
            console.log(metric2._cache)
            expect(metric2._cache.size).toBe(2); // same metric, should not increase
            expect(metric2._cache.has('')).toBeTruthy();
            expect(metric2._cache.get('').get('count')).toBe(6);
            expect(metric2._cache.has('server=test')).toBeTruthy();
            expect(metric2._cache.get('server=test').get('count')).toBe(3);
        });
    });

    describe('inc-tag-2', () => {
        test('should increment metric1 with different tag', () => {
            expect(metric1._cache.size).toBe(2);

            metric1
                .tag('server', 'test')
                .tag('another', 'one')
                .inc();
            console.log(metric1._cache)
            expect(metric1._cache.size).toBe(3); // new metric, should be separate
            expect(metric1._cache.has('')).toBeTruthy();
            expect(metric1._cache.get('').get('count')).toBe(4);
            expect(metric1._cache.has('server=test')).toBeTruthy();
            expect(metric1._cache.get('server=test').get('count')).toBe(2);
            expect(metric1._cache.has('another=one,server=test')).toBeTruthy();
            expect(metric1._cache.get('another=one,server=test').get('count')).toBe(1);
        });
        test('should increment metric1 again', () => {
            expect(metric1._cache.size).toBe(3);

            metric1
                .tag('server', 'test')
                .tag('another', 'one')
                .inc();
            console.log(metric1._cache)
            expect(metric1._cache.size).toBe(3); // same metric, should not increase
            expect(metric1._cache.has('')).toBeTruthy();
            expect(metric1._cache.get('').get('count')).toBe(4);
            expect(metric1._cache.has('server=test')).toBeTruthy();
            expect(metric1._cache.get('server=test').get('count')).toBe(2);
            expect(metric1._cache.has('another=one,server=test')).toBeTruthy();
            expect(metric1._cache.get('another=one,server=test').get('count')).toBe(2);
        });

        test('should increment metric2 with different tag', () => {
            expect(metric2._cache.size).toBe(2);

            metric2
                .tag('server', 'test')
                .tag('another', 'one')
                .inc();
            console.log(metric2._cache)
            expect(metric2._cache.size).toBe(3); // new metric, should be separate
            expect(metric2._cache.has('')).toBeTruthy();
            expect(metric2._cache.get('').get('count')).toBe(6);
            expect(metric2._cache.has('server=test')).toBeTruthy();
            expect(metric2._cache.get('server=test').get('count')).toBe(3);
            expect(metric2._cache.has('another=one,server=test')).toBeTruthy();
            expect(metric2._cache.get('another=one,server=test').get('count')).toBe(1);
        });
        test('should increment metric2 again', () => {
            expect(metric2._cache.size).toBe(3);

            metric2
                .tag('server', 'test')
                .tag('another', 'one')
                .inc();
            console.log(metric2._cache)
            expect(metric2._cache.size).toBe(3); // same metric, should not increase
            expect(metric2._cache.has('')).toBeTruthy();
            expect(metric2._cache.get('').get('count')).toBe(6);
            expect(metric2._cache.has('server=test')).toBeTruthy();
            expect(metric2._cache.get('server=test').get('count')).toBe(3);
            expect(metric2._cache.has('another=one,server=test')).toBeTruthy();
            expect(metric2._cache.get('another=one,server=test').get('count')).toBe(2);
        });
    })

});

describe('flusher', () => {

    let flusher: TestFlusher;
    let collected: Map<string, IPoint[]>;

    describe('collect and flush', () => {
        test('should collect the metrics', () => {
            flusher = new TestFlusher(metrics);
            expect(flusher).toBeDefined();
            expect(metrics.metrics).toBeDefined();
            flusher.flush();
            //let collected = flusher._collectPointsByDatabase(metrics.metrics);
            collected = flusher.collectedPoints;
            expect(collected).toBeDefined();
            console.log('collected', collected);
        })

        test('collected 1 should match', () => {
            // let firstKey = collected.keys().next().value;
            // expect(firstKey).toBeDefined();
            // expect(firstKey).toBe('testdb:null');
            expect(collected.has("testdb:null")).toBeTruthy();

            let firstValue = collected.get("testdb:null");
            expect(firstValue).toBeDefined();
            console.log('firstValue', firstValue);
            expect(firstValue.length).toBe(3); // one for each tag combination
            {
                let firstPoint = firstValue[0];
                expect(firstPoint).toBeDefined();
                expect(firstPoint.fields).toBeDefined();
                expect(firstPoint.tags).toBeDefined();
                expect(firstPoint.measurement).toBe('test');
                expect(firstPoint.fields.count).toBeDefined();
                expect(firstPoint.fields.count).toBe(4);
            }
            {
                let secondPoint = firstValue[1];
                expect(secondPoint).toBeDefined();
                expect(secondPoint.fields).toBeDefined();
                expect(secondPoint.tags).toBeDefined();
                expect(secondPoint.tags.server).toBeDefined();
                expect(secondPoint.tags.another).not.toBeDefined();
                expect(secondPoint.measurement).toBe('test');
                expect(secondPoint.fields.count).toBeDefined();
                expect(secondPoint.fields.count).toBe(2);
            }
            {
                let thirdPoint = firstValue[2];
                expect(thirdPoint).toBeDefined();
                expect(thirdPoint.fields).toBeDefined();
                expect(thirdPoint.tags).toBeDefined();
                expect(thirdPoint.tags.server).toBeDefined();
                expect(thirdPoint.tags.another).toBeDefined();
                expect(thirdPoint.measurement).toBe('test');
                expect(thirdPoint.fields.count).toBeDefined();
                expect(thirdPoint.fields.count).toBe(2);
            }
        });

        test('collected 2 should match', () => {
            // let secondKey = collected.keys().next().value;
            // expect(secondKey).toBeDefined();
            // expect(secondKey).toBe('testdb:one_month');
            expect(collected.has("testdb:one_month")).toBeTruthy();

            let secondValue = collected.get("testdb:one_month");
            expect(secondValue).toBeDefined();
            console.log('secondValue', secondValue);
            expect(secondValue.length).toBe(3); // one for each tag combination
            {
                let firstPoint = secondValue[0];
                expect(firstPoint).toBeDefined();
                expect(firstPoint.fields).toBeDefined();
                expect(firstPoint.tags).toBeDefined();
                expect(firstPoint.measurement).toBe('test_rp');
                expect(firstPoint.fields.count).toBeDefined();
                expect(firstPoint.fields.count).toBe(6);
            }
            {
                let secondPoint = secondValue[1];
                expect(secondPoint).toBeDefined();
                expect(secondPoint.fields).toBeDefined();
                expect(secondPoint.tags).toBeDefined();
                expect(secondPoint.tags.server).toBeDefined();
                expect(secondPoint.tags.another).not.toBeDefined();
                expect(secondPoint.measurement).toBe('test_rp');
                expect(secondPoint.fields.count).toBeDefined();
                expect(secondPoint.fields.count).toBe(3);
            }
            {
                let thirdPoint = secondValue[2];
                expect(thirdPoint).toBeDefined();
                expect(thirdPoint.fields).toBeDefined();
                expect(thirdPoint.tags).toBeDefined();
                expect(thirdPoint.tags.server).toBeDefined();
                expect(thirdPoint.tags.another).toBeDefined();
                expect(thirdPoint.measurement).toBe('test_rp');
                expect(thirdPoint.fields.count).toBeDefined();
                expect(thirdPoint.fields.count).toBe(2);
            }
        });

        test('flushed 1 should match', () => {
            console.log(flusher.writtenDb);
            console.log(flusher.writtenRp)
            console.log('writtenDb1', flusher.writtenDb[0]);
            console.log('writtenRp1', flusher.writtenRp[0])
            expect(flusher.writtenDb[0]).toBe('testdb');
            expect(flusher.writtenRp[0]).toBe(undefined);
        });

        test('flushed 2 should match', () => {
            console.log('writtenDb2', flusher.writtenDb[0]);
            console.log('writtenRp2', flusher.writtenRp[0]);
            expect(flusher.writtenDb[1]).toBe('testdb');
            expect(flusher.writtenRp[1]).toBe('one_month');

        });

        test('cache 1 should be empty', () => {
            expect(metric1._cache.size).toBe(0);
        });

        test('cache 2 should be empty', () => {
            expect(metric2._cache.size).toBe(0);
        });
    })


})