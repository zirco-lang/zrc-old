// for some reason with the babel processor used, paths end in .ts
// only in tests
import strSplit from '../strSplit.ts';

describe('strSplit', () => {
    it('returns nothing for nothing', () => expect(strSplit('')).toEqual([]));
    it('works on length 1', () => expect(strSplit('e')).toEqual(['e']));
    it('works on long string', () => expect(strSplit('abcdef')).toEqual(['a','b','c','d','e','f']));
});
