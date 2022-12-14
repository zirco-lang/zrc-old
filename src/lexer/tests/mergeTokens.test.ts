import mergeTokens, { TokenTypes } from '../mergeTokens';

// GitHub Copilot wrote the majority of these tests for me and they're
// amazing. This is kinda creepy.
// - LogN

describe('mergeTokens', () => {
    it('returns none on an empty input', () => expect(mergeTokens([])).toEqual([]));
    describe('simple tokens', () => {
        it('classifies a single letter as an identifier', () =>
            expect(mergeTokens([['a', { start: 0, end: 1 }]])).toEqual([['a', { type: TokenTypes.IDENTIFIER, position: { start: 0, end: 1 } }]]));
        it('classifies a single number as a constant', () =>
            expect(mergeTokens([['1', { start: 0, end: 1 }]])).toEqual([
                ['1', { type: TokenTypes.CONSTANT_NUMBER, position: { start: 0, end: 1 } }]
            ]));
        it('classifies a single-letter string as a string', () =>
            expect(
                mergeTokens([
                    ['"', { start: 0, end: 1 }],
                    ['a', { start: 1, end: 2 }],
                    ['"', { start: 2, end: 3 }]
                ])
            ).toEqual([['"a"', { type: TokenTypes.STRING, position: { start: 0, end: 3 } }]]));
        describe('strings with weird traits', () => {
            it('errors on string with no end', () => expect(() => mergeTokens([['"', { start: 0, end: 1 }]])).toThrow('Unexpected end of file'));
            it('escaped EOF', () =>
                expect(() =>
                    mergeTokens([
                        ['"', { start: 0, end: 1 }],
                        ['\\', { start: 1, end: 2 }],
                        ['"', { start: 2, end: 3 }]
                    ])
                ).toThrow('Unexpected end of file'));
            it('works with escaped quote', () =>
                expect(
                    mergeTokens([
                        ['"', { start: 0, end: 1 }],
                        ['\\', { start: 1, end: 2 }],
                        ['"', { start: 2, end: 3 }],
                        ['"', { start: 3, end: 4 }]
                    ])
                ).toEqual([['"\\""', { type: TokenTypes.STRING, position: { start: 0, end: 4 } }]]));
        });
        describe('numerical constant types', () => {
            it('classifies a decimal number as a constant', () =>
                expect(
                    mergeTokens([
                        ['1', { start: 0, end: 1 }],
                        ['1', { start: 1, end: 2 }],
                        ['1', { start: 2, end: 3 }]
                    ])
                ).toEqual([['111', { type: TokenTypes.CONSTANT_NUMBER, position: { start: 0, end: 3 } }]]));
            it('classifies a hexadecimal number as a constant', () =>
                expect(
                    mergeTokens([
                        ['0', { start: 0, end: 1 }],
                        ['x', { start: 1, end: 2 }],
                        ['F', { start: 2, end: 3 }],
                        ['F', { start: 3, end: 4 }]
                    ])
                ).toEqual([['0xFF', { type: TokenTypes.CONSTANT_NUMBER, position: { start: 0, end: 4 } }]]));
            it('classifies a binary number as a constant', () =>
                expect(
                    mergeTokens([
                        ['0', { start: 0, end: 1 }],
                        ['b', { start: 1, end: 2 }],
                        ['1', { start: 2, end: 3 }],
                        ['1', { start: 3, end: 4 }]
                    ])
                ).toEqual([['0b11', { type: TokenTypes.CONSTANT_NUMBER, position: { start: 0, end: 4 } }]]));
            it('classifies a number with a decimal as a constant', () =>
                expect(
                    mergeTokens([
                        ['1', { start: 0, end: 1 }],
                        ['.', { start: 1, end: 2 }],
                        ['3', { start: 2, end: 3 }]
                    ])
                ).toEqual([['1.3', { type: TokenTypes.CONSTANT_NUMBER, position: { start: 0, end: 3 } }]]));
        });
        it('operations are type OTHER', () =>
            expect(mergeTokens([['+', { start: 0, end: 1 }]])).toEqual([['+', { type: TokenTypes.OTHER, position: { start: 0, end: 1 } }]]));
    });
    describe('whitespace trimming', () => {
        // In this case, it's expected that multiple spaces are merged and start/end indicate them safely.
        it('one space between tokens', () =>
            expect(
                mergeTokens([
                    ['a', { start: 0, end: 1 }],
                    [' ', { start: 1, end: 2 }],
                    ['b', { start: 2, end: 3 }]
                ])
            ).toEqual([
                ['a', { type: TokenTypes.IDENTIFIER, position: { start: 0, end: 1 } }],
                ['b', { type: TokenTypes.IDENTIFIER, position: { start: 2, end: 3 } }]
            ]));
        it('one tab between tokens', () =>
            expect(
                mergeTokens([
                    ['a', { start: 0, end: 1 }],
                    ['\t', { start: 1, end: 2 }],
                    ['b', { start: 2, end: 3 }]
                ])
            ).toEqual([
                ['a', { type: TokenTypes.IDENTIFIER, position: { start: 0, end: 1 } }],
                ['b', { type: TokenTypes.IDENTIFIER, position: { start: 2, end: 3 } }]
            ]));
        it('one newline between tokens', () =>
            expect(
                mergeTokens([
                    ['a', { start: 0, end: 1 }],
                    ['\n', { start: 1, end: 2 }],
                    ['b', { start: 2, end: 3 }]
                ])
            ).toEqual([
                ['a', { type: TokenTypes.IDENTIFIER, position: { start: 0, end: 1 } }],
                ['b', { type: TokenTypes.IDENTIFIER, position: { start: 2, end: 3 } }]
            ]));
        it('multiple spaces between tokens', () =>
            expect(
                mergeTokens([
                    ['a', { start: 0, end: 1 }],
                    [' ', { start: 1, end: 2 }],
                    [' ', { start: 2, end: 3 }],
                    ['b', { start: 3, end: 4 }]
                ])
            ).toEqual([
                ['a', { type: TokenTypes.IDENTIFIER, position: { start: 0, end: 1 } }],
                ['b', { type: TokenTypes.IDENTIFIER, position: { start: 3, end: 4 } }]
            ]));
    });
    describe('more complex cases', () => {
        it('identifier with a number', () =>
            expect(
                mergeTokens([
                    ['a', { start: 0, end: 1 }],
                    ['1', { start: 1, end: 2 }]
                ])
            ).toEqual([['a1', { type: TokenTypes.IDENTIFIER, position: { start: 0, end: 2 } }]]));
        it('sequential symbols are separate', () =>
            expect(
                mergeTokens([
                    ['=', { start: 0, end: 1 }],
                    ['=', { start: 1, end: 2 }]
                ])
            ).toEqual([
                ['=', { type: TokenTypes.OTHER, position: { start: 0, end: 1 } }],
                ['=', { type: TokenTypes.OTHER, position: { start: 1, end: 2 } }]
            ]));
        it('no whitespace change in token type', () =>
            expect(
                mergeTokens([
                    ['a', { start: 0, end: 1 }],
                    ['+', { start: 1, end: 2 }],
                    ['b', { start: 2, end: 3 }]
                ])
            ).toEqual([
                ['a', { type: TokenTypes.IDENTIFIER, position: { start: 0, end: 1 } }],
                ['+', { type: TokenTypes.OTHER, position: { start: 1, end: 2 } }],
                ['b', { type: TokenTypes.IDENTIFIER, position: { start: 2, end: 3 } }]
            ]));
        it('whitespace change in token type', () =>
            expect(
                mergeTokens([
                    ['a', { start: 0, end: 1 }],
                    [' ', { start: 1, end: 2 }],
                    ['+', { start: 2, end: 3 }],
                    [' ', { start: 3, end: 4 }],
                    ['b', { start: 4, end: 5 }]
                ])
            ).toEqual([
                ['a', { type: TokenTypes.IDENTIFIER, position: { start: 0, end: 1 } }],
                ['+', { type: TokenTypes.OTHER, position: { start: 2, end: 3 } }],
                ['b', { type: TokenTypes.IDENTIFIER, position: { start: 4, end: 5 } }]
            ]));
        it('sequential strings', () =>
            expect(
                mergeTokens([
                    ['"', { start: 0, end: 1 }],
                    ['a', { start: 1, end: 2 }],
                    ['"', { start: 2, end: 3 }],
                    ['"', { start: 3, end: 4 }],
                    ['b', { start: 4, end: 5 }],
                    ['"', { start: 5, end: 6 }]
                ])
            ).toEqual([
                ['"a"', { type: TokenTypes.STRING, position: { start: 0, end: 3 } }],
                ['"b"', { type: TokenTypes.STRING, position: { start: 3, end: 6 } }]
            ]));
        it('string then identifier', () =>
            expect(
                mergeTokens([
                    ['"', { start: 0, end: 1 }],
                    ['a', { start: 1, end: 2 }],
                    ['"', { start: 2, end: 3 }],
                    ['b', { start: 3, end: 4 }]
                ])
            ).toEqual([
                ['"a"', { type: TokenTypes.STRING, position: { start: 0, end: 3 } }],
                ['b', { type: TokenTypes.IDENTIFIER, position: { start: 3, end: 4 } }]
            ]));
        it('identifier then string', () =>
            expect(
                mergeTokens([
                    ['a', { start: 0, end: 1 }],
                    ['"', { start: 1, end: 2 }],
                    ['b', { start: 2, end: 3 }],
                    ['"', { start: 3, end: 4 }]
                ])
            ).toEqual([
                ['a', { type: TokenTypes.IDENTIFIER, position: { start: 0, end: 1 } }],
                ['"b"', { type: TokenTypes.STRING, position: { start: 1, end: 4 } }]
            ]));
    });
});
