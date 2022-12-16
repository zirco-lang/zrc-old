import lex from '../index';
import { TokenTypes } from '../mergeTokens';

describe('lex', () => {
    it('works as expected', () =>
        expect(lex('2 + 2 = 4')).toEqual([
            ['2', { type: TokenTypes.CONSTANT_NUMBER, position: { start: 0, end: 1 } }],
            ['+', { type: TokenTypes.OTHER, position: { start: 2, end: 3 } }],
            ['2', { type: TokenTypes.CONSTANT_NUMBER, position: { start: 4, end: 5 } }],
            ['=', { type: TokenTypes.OTHER, position: { start: 6, end: 7 } }],
            ['4', { type: TokenTypes.CONSTANT_NUMBER, position: { start: 8, end: 9 } }]
        ]));
});
