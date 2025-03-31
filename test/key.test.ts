import {Metric} from "../src";

describe('key', () => {
    test('should stringify key', () => {
        const map = new Map<string, string>();
        map.set('key1', 'value1');
        map.set('key2', 'value2');
        let s = Metric._mapKey(map);
        expect(s).toBe('key1=value1,key2=value2');
    });
    test('should parse key', () => {
        const s = 'key1=value1,key2=value2';
        const map = Metric._parseKey(s);
        expect(map.size).toBe(2);
        expect(map.get('key1')).toBe('value1');
        expect(map.get('key2')).toBe('value2');
    });
});

describe('key-escaped', () => {
    test('should escape key', () => {
        const map = new Map<string, string>();
        map.set('test1','val1,val2');
        map.set('test,2','val3');
        map.set('test=3','val4');
        let s = Metric._mapKey(map);
        expect(s).toBe('test1=val1\\,val2,test\\,2=val3,test\\=3=val4');
    })
})