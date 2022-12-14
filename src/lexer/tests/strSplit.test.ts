// for some reason with the babel processor used, paths end in .ts
// only in tests
import strSplit from '../strSplit';

describe('strSplit', () => {
    it('returns nothing for nothing', () => expect(strSplit('')).toEqual([]));
    it('works on length 1', () => expect(strSplit('e')).toEqual([['e', { start: 0, end: 1 }]]));
    it('works on long string', () =>
        expect(strSplit('abcdef')).toEqual([
            ['a', { start: 0, end: 1 }],
            ['b', { start: 1, end: 2 }],
            ['c', { start: 2, end: 3 }],
            ['d', { start: 3, end: 4 }],
            ['e', { start: 4, end: 5 }],
            ['f', { start: 5, end: 6 }]
        ]));
});
