/**
 * zrc - the Zirco compiler
 * Copyright (C) 2022  LogN
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import ZircoSyntaxError, { ZircoSyntaxErrorTypes } from "../../lib/structures/errors/ZircoSyntaxError";
import mergeTokens, { TokenTypes } from "../mergeTokens";

// GitHub Copilot wrote the majority of these tests for me and they're
// amazing. This is kinda creepy.
// - LogN

describe("mergeTokens", () => {
    it("returns none on an empty input", () => expect(mergeTokens([])).toEqual([]));
    describe("simple tokens", () => {
        it("classifies a single letter as an identifier", () =>
            expect(mergeTokens([["a", { start: 0, end: 1 }]])).toEqual([["a", { type: TokenTypes.NAME, position: { start: 0, end: 1 } }]]));
        it("classifies a single number as a constant", () =>
            expect(mergeTokens([["1", { start: 0, end: 1 }]])).toEqual([
                ["1", { type: TokenTypes.CONSTANT_NUMBER, position: { start: 0, end: 1 } }]
            ]));
        it("classifies a single-letter string as a string", () =>
            expect(
                mergeTokens([
                    ['"', { start: 0, end: 1 }],
                    ["a", { start: 1, end: 2 }],
                    ['"', { start: 2, end: 3 }]
                ])
            ).toEqual([['"a"', { type: TokenTypes.STRING, position: { start: 0, end: 3 } }]]));
        describe("strings with weird traits", () => {
            it("errors on string with no end", () => {
                const f = () => mergeTokens([['"', { start: 0, end: 1 }]]);
                let didThrow = false;
                try {
                    f();
                } catch (e) {
                    didThrow = true;
                    expect(e).toBeInstanceOf(ZircoSyntaxError);
                    // we don't check message in case the enum types change as it's not defined to be something officially anyway
                    expect((e as ZircoSyntaxError).type).toBe(ZircoSyntaxErrorTypes.LEXER_STRING_UNCLOSED);
                    expect((e as ZircoSyntaxError).position).toEqual({ start: 0, end: 1 });
                }
                expect(didThrow).toBe(true);
            });
            it("should error provided a non-closed string with an escape", () => {
                const f = () =>
                    mergeTokens([
                        ['"', { start: 0, end: 1 }],
                        ["a", { start: 1, end: 2 }],
                        ["\\", { start: 2, end: 3 }]
                    ]);
                let didThrow = false;
                try {
                    f();
                } catch (e) {
                    didThrow = true;
                    expect(e).toBeInstanceOf(ZircoSyntaxError);
                    expect((e as ZircoSyntaxError).type).toBe(ZircoSyntaxErrorTypes.LEXER_STRING_ESCAPE_EOF);
                    expect((e as ZircoSyntaxError).position).toEqual({ start: 2, end: 3 });
                }
                expect(didThrow).toBe(true);
            });
            it("escaped EOF", () => {
                const f = () =>
                    mergeTokens([
                        ['"', { start: 0, end: 1 }],
                        ["\\", { start: 1, end: 2 }],
                        ['"', { start: 2, end: 3 }]
                    ]);
                let didThrow = false;
                try {
                    f();
                } catch (e) {
                    didThrow = true;
                    expect(e).toBeInstanceOf(ZircoSyntaxError);
                    expect((e as ZircoSyntaxError).type).toBe(ZircoSyntaxErrorTypes.LEXER_STRING_UNCLOSED);
                    expect((e as ZircoSyntaxError).position).toEqual({ start: 0, end: 3 });
                }
                expect(didThrow).toBe(true);
            });
            it("works with escaped quote", () =>
                expect(
                    mergeTokens([
                        ['"', { start: 0, end: 1 }],
                        ["\\", { start: 1, end: 2 }],
                        ['"', { start: 2, end: 3 }],
                        ['"', { start: 3, end: 4 }]
                    ])
                ).toEqual([['"\\""', { type: TokenTypes.STRING, position: { start: 0, end: 4 } }]]));
        });
        describe("numerical constant types", () => {
            it("classifies a decimal number as a constant", () =>
                expect(
                    mergeTokens([
                        ["1", { start: 0, end: 1 }],
                        ["1", { start: 1, end: 2 }],
                        ["1", { start: 2, end: 3 }]
                    ])
                ).toEqual([["111", { type: TokenTypes.CONSTANT_NUMBER, position: { start: 0, end: 3 } }]]));
            it("classifies a hexadecimal number as a constant", () =>
                expect(
                    mergeTokens([
                        ["0", { start: 0, end: 1 }],
                        ["x", { start: 1, end: 2 }],
                        ["F", { start: 2, end: 3 }],
                        ["F", { start: 3, end: 4 }]
                    ])
                ).toEqual([["0xFF", { type: TokenTypes.CONSTANT_NUMBER, position: { start: 0, end: 4 } }]]));
            it("classifies a binary number as a constant", () =>
                expect(
                    mergeTokens([
                        ["0", { start: 0, end: 1 }],
                        ["b", { start: 1, end: 2 }],
                        ["1", { start: 2, end: 3 }],
                        ["1", { start: 3, end: 4 }]
                    ])
                ).toEqual([["0b11", { type: TokenTypes.CONSTANT_NUMBER, position: { start: 0, end: 4 } }]]));
            it("classifies a number with a decimal as a constant", () =>
                expect(
                    mergeTokens([
                        ["1", { start: 0, end: 1 }],
                        [".", { start: 1, end: 2 }],
                        ["3", { start: 2, end: 3 }]
                    ])
                ).toEqual([["1.3", { type: TokenTypes.CONSTANT_NUMBER, position: { start: 0, end: 3 } }]]));
            it("should error when given a non-binary value in a binary constant", () => {
                const f = () =>
                    mergeTokens([
                        ["0", { start: 0, end: 1 }],
                        ["b", { start: 1, end: 2 }],
                        ["2", { start: 2, end: 3 }]
                    ]);
                let didThrow = false;
                try {
                    f();
                } catch (e) {
                    didThrow = true;
                    expect(e).toBeInstanceOf(ZircoSyntaxError);
                    expect((e as ZircoSyntaxError).type).toBe(ZircoSyntaxErrorTypes.LEXER_NUMBER_INVALID_CHARACTER);
                    expect((e as ZircoSyntaxError).position).toEqual({ start: 2, end: 3 });
                }
                expect(didThrow).toBe(true);
            });
            it("should error given a Z in a hex", () => {
                const f = () =>
                    mergeTokens([
                        ["0", { start: 0, end: 1 }],
                        ["x", { start: 1, end: 2 }],
                        ["Z", { start: 2, end: 3 }]
                    ]);
                let didThrow = false;
                try {
                    f();
                } catch (e) {
                    didThrow = true;
                    expect(e).toBeInstanceOf(ZircoSyntaxError);
                    expect((e as ZircoSyntaxError).type).toBe(ZircoSyntaxErrorTypes.LEXER_NUMBER_INVALID_CHARACTER);
                    expect((e as ZircoSyntaxError).position).toEqual({ start: 2, end: 3 });
                }
                expect(didThrow).toBe(true);
            });
        });
        it("operator", () =>
            expect(mergeTokens([["+", { start: 0, end: 1 }]])).toEqual([["+", { type: TokenTypes.OPERATOR, position: { start: 0, end: 1 } }]]));
    });
    describe("whitespace trimming", () => {
        // In this case, it's expected that multiple spaces are merged and start/end indicate them safely.
        it("one space between NAME tokens", () =>
            expect(
                mergeTokens([
                    ["a", { start: 0, end: 1 }],
                    [" ", { start: 1, end: 2 }],
                    ["b", { start: 2, end: 3 }]
                ])
            ).toEqual([
                ["a", { type: TokenTypes.NAME, position: { start: 0, end: 1 } }],
                ["b", { type: TokenTypes.NAME, position: { start: 2, end: 3 } }]
            ]));
        it("space between CONSTANT_NUMBERs", () =>
            expect(
                mergeTokens([
                    ["1", { start: 0, end: 1 }],
                    [" ", { start: 1, end: 2 }],
                    ["2", { start: 2, end: 3 }]
                ])
            ).toEqual([
                ["1", { type: TokenTypes.CONSTANT_NUMBER, position: { start: 0, end: 1 } }],
                ["2", { type: TokenTypes.CONSTANT_NUMBER, position: { start: 2, end: 3 } }]
            ]));
        it("space between hexadecimal CONSTANT_NUMBERs", () =>
            expect(
                mergeTokens([
                    ["0", { start: 0, end: 1 }],
                    ["x", { start: 1, end: 2 }],
                    ["F", { start: 2, end: 3 }],
                    [" ", { start: 3, end: 4 }],
                    ["0", { start: 4, end: 5 }],
                    ["x", { start: 5, end: 6 }],
                    ["F", { start: 6, end: 7 }]
                ])
            ).toEqual([
                ["0xF", { type: TokenTypes.CONSTANT_NUMBER, position: { start: 0, end: 3 } }],
                ["0xF", { type: TokenTypes.CONSTANT_NUMBER, position: { start: 4, end: 7 } }]
            ]));
        it("space between STRINGs", () =>
            expect(
                mergeTokens([
                    ['"', { start: 0, end: 1 }],
                    ["a", { start: 1, end: 2 }],
                    ['"', { start: 2, end: 3 }],
                    [" ", { start: 3, end: 4 }],
                    ['"', { start: 4, end: 5 }],
                    ["b", { start: 5, end: 6 }],
                    ['"', { start: 6, end: 7 }]
                ])
            ).toEqual([
                ['"a"', { type: TokenTypes.STRING, position: { start: 0, end: 3 } }],
                ['"b"', { type: TokenTypes.STRING, position: { start: 4, end: 7 } }]
            ]));
        it("one tab between tokens", () =>
            expect(
                mergeTokens([
                    ["a", { start: 0, end: 1 }],
                    ["\t", { start: 1, end: 2 }],
                    ["b", { start: 2, end: 3 }]
                ])
            ).toEqual([
                ["a", { type: TokenTypes.NAME, position: { start: 0, end: 1 } }],
                ["b", { type: TokenTypes.NAME, position: { start: 2, end: 3 } }]
            ]));
        it("one newline between tokens", () =>
            expect(
                mergeTokens([
                    ["a", { start: 0, end: 1 }],
                    ["\n", { start: 1, end: 2 }],
                    ["b", { start: 2, end: 3 }]
                ])
            ).toEqual([
                ["a", { type: TokenTypes.NAME, position: { start: 0, end: 1 } }],
                ["b", { type: TokenTypes.NAME, position: { start: 2, end: 3 } }]
            ]));
        it("multiple spaces between tokens", () =>
            expect(
                mergeTokens([
                    ["a", { start: 0, end: 1 }],
                    [" ", { start: 1, end: 2 }],
                    [" ", { start: 2, end: 3 }],
                    ["b", { start: 3, end: 4 }]
                ])
            ).toEqual([
                ["a", { type: TokenTypes.NAME, position: { start: 0, end: 1 } }],
                ["b", { type: TokenTypes.NAME, position: { start: 3, end: 4 } }]
            ]));
    });
    describe("more complex cases", () => {
        it("identifier with a number", () =>
            expect(
                mergeTokens([
                    ["a", { start: 0, end: 1 }],
                    ["1", { start: 1, end: 2 }]
                ])
            ).toEqual([["a1", { type: TokenTypes.NAME, position: { start: 0, end: 2 } }]]));
        it("sequential non-operator symbols are separate", () =>
            expect(
                mergeTokens([
                    ["$", { start: 0, end: 1 }],
                    ["$", { start: 1, end: 2 }]
                ])
            ).toEqual([
                ["$", { type: TokenTypes.OTHER, position: { start: 0, end: 1 } }],
                ["$", { type: TokenTypes.OTHER, position: { start: 1, end: 2 } }]
            ]));
        it("letter in a number", () => {
            const f = () =>
                mergeTokens([
                    ["1", { start: 0, end: 1 }],
                    ["a", { start: 1, end: 2 }]
                ]);
            let didThrow = false;
            try {
                f();
            } catch (e) {
                didThrow = true;
                expect(e).toBeInstanceOf(ZircoSyntaxError);
                expect((e as ZircoSyntaxError).type).toBe(ZircoSyntaxErrorTypes.LEXER_NUMBER_INVALID_CHARACTER);
                expect((e as ZircoSyntaxError).position).toEqual({ start: 1, end: 2 });
            }
            expect(didThrow).toBe(true);
        });
        it("no whitespace change in token type", () =>
            expect(
                mergeTokens([
                    ["a", { start: 0, end: 1 }],
                    ["+", { start: 1, end: 2 }],
                    ["b", { start: 2, end: 3 }]
                ])
            ).toEqual([
                ["a", { type: TokenTypes.NAME, position: { start: 0, end: 1 } }],
                ["+", { type: TokenTypes.OPERATOR, position: { start: 1, end: 2 } }],
                ["b", { type: TokenTypes.NAME, position: { start: 2, end: 3 } }]
            ]));
        it("whitespace change in token type", () =>
            expect(
                mergeTokens([
                    ["a", { start: 0, end: 1 }],
                    [" ", { start: 1, end: 2 }],
                    ["+", { start: 2, end: 3 }],
                    [" ", { start: 3, end: 4 }],
                    ["b", { start: 4, end: 5 }]
                ])
            ).toEqual([
                ["a", { type: TokenTypes.NAME, position: { start: 0, end: 1 } }],
                ["+", { type: TokenTypes.OPERATOR, position: { start: 2, end: 3 } }],
                ["b", { type: TokenTypes.NAME, position: { start: 4, end: 5 } }]
            ]));
        it("sequential decimals (sequential) should fail", () => {
            const f = () =>
                mergeTokens([
                    ["1", { start: 0, end: 1 }],
                    [".", { start: 1, end: 2 }],
                    [".", { start: 2, end: 3 }]
                ]);
            let didThrow = false;

            try {
                f();
            } catch (e) {
                didThrow = true;
                expect(e).toBeInstanceOf(ZircoSyntaxError);
                expect((e as ZircoSyntaxError).type).toBe(ZircoSyntaxErrorTypes.LEXER_NUMBER_MULTIPLE_DECIMALS);
                expect((e as ZircoSyntaxError).position).toEqual({ start: 2, end: 3 });
            }
            expect(didThrow).toBe(true);
        });
        it("sequential decimals (separated) should fail", () => {
            const f = () =>
                mergeTokens([
                    ["1", { start: 0, end: 1 }],
                    [".", { start: 1, end: 2 }],
                    ["2", { start: 2, end: 3 }],
                    [".", { start: 3, end: 4 }]
                ]);
            let didThrow = false;
            try {
                f();
            } catch (e) {
                didThrow = true;
                expect(e).toBeInstanceOf(ZircoSyntaxError);
                expect((e as ZircoSyntaxError).type).toBe(ZircoSyntaxErrorTypes.LEXER_NUMBER_MULTIPLE_DECIMALS);
                expect((e as ZircoSyntaxError).position).toEqual({ start: 3, end: 4 });
            }
            expect(didThrow).toBe(true);
        });
        it("opening but not a value for a constant number", () => {
            const f = () =>
                mergeTokens([
                    ["0", { start: 0, end: 1 }],
                    ["x", { start: 1, end: 2 }]
                ]);
            let didThrow = false;
            try {
                f();
            } catch (e) {
                didThrow = true;
                expect(e).toBeInstanceOf(ZircoSyntaxError);
                expect((e as ZircoSyntaxError).type).toBe(ZircoSyntaxErrorTypes.LEXER_NUMBER_TYPE_PREFIX_NO_VALUE);
                expect((e as ZircoSyntaxError).position).toEqual({ start: 1, end: 2 });
            }
            expect(didThrow).toBe(true);
        });
        it("sequential strings", () =>
            expect(
                mergeTokens([
                    ['"', { start: 0, end: 1 }],
                    ["a", { start: 1, end: 2 }],
                    ['"', { start: 2, end: 3 }],
                    ['"', { start: 3, end: 4 }],
                    ["b", { start: 4, end: 5 }],
                    ['"', { start: 5, end: 6 }]
                ])
            ).toEqual([
                ['"a"', { type: TokenTypes.STRING, position: { start: 0, end: 3 } }],
                ['"b"', { type: TokenTypes.STRING, position: { start: 3, end: 6 } }]
            ]));
        it("string then identifier", () =>
            expect(
                mergeTokens([
                    ['"', { start: 0, end: 1 }],
                    ["a", { start: 1, end: 2 }],
                    ['"', { start: 2, end: 3 }],
                    ["b", { start: 3, end: 4 }]
                ])
            ).toEqual([
                ['"a"', { type: TokenTypes.STRING, position: { start: 0, end: 3 } }],
                ["b", { type: TokenTypes.NAME, position: { start: 3, end: 4 } }]
            ]));
        it("identifier then string", () =>
            expect(
                mergeTokens([
                    ["a", { start: 0, end: 1 }],
                    ['"', { start: 1, end: 2 }],
                    ["b", { start: 2, end: 3 }],
                    ['"', { start: 3, end: 4 }]
                ])
            ).toEqual([
                ["a", { type: TokenTypes.NAME, position: { start: 0, end: 1 } }],
                ['"b"', { type: TokenTypes.STRING, position: { start: 1, end: 4 } }]
            ]));

        it("underscores in numbers", () =>
            expect(
                mergeTokens([
                    ["1", { start: 0, end: 1 }],
                    ["_", { start: 1, end: 2 }],
                    ["2", { start: 2, end: 3 }]
                ])
            ).toEqual([["1_2", { type: TokenTypes.CONSTANT_NUMBER, position: { start: 0, end: 3 } }]]));
    });

    describe("comments", () => {
        describe("single-line", () => {
            it("simple single-line on its own (w/ space)", () =>
                expect(
                    mergeTokens([
                        ["/", { start: 0, end: 1 }],
                        ["/", { start: 1, end: 2 }],
                        [" ", { start: 2, end: 3 }],
                        ["a", { start: 3, end: 4 }]
                    ])
                ).toEqual([]));
            it("simple single-line on its own (w/o space)", () =>
                expect(
                    mergeTokens([
                        ["/", { start: 0, end: 1 }],
                        ["/", { start: 1, end: 2 }],
                        ["a", { start: 2, end: 3 }]
                    ])
                ).toEqual([]));
            it("simple single-line with trailing space", () =>
                expect(
                    mergeTokens([
                        ["/", { start: 0, end: 1 }],
                        ["/", { start: 1, end: 2 }],
                        [" ", { start: 2, end: 3 }],
                        ["a", { start: 3, end: 4 }],
                        [" ", { start: 4, end: 5 }]
                    ])
                ).toEqual([]));
            it("simple single line with token before", () =>
                expect(
                    mergeTokens([
                        ["a", { start: 0, end: 1 }],
                        ["/", { start: 1, end: 2 }],
                        ["/", { start: 2, end: 3 }],
                        [" ", { start: 3, end: 4 }],
                        ["b", { start: 4, end: 5 }]
                    ])
                ).toEqual([["a", { type: TokenTypes.NAME, position: { start: 0, end: 1 } }]]));
            it("simple single line with token before (+ space)", () =>
                expect(
                    mergeTokens([
                        ["a", { start: 0, end: 1 }],
                        [" ", { start: 1, end: 2 }],
                        ["/", { start: 2, end: 3 }],
                        ["/", { start: 3, end: 4 }],
                        [" ", { start: 4, end: 5 }],
                        ["b", { start: 5, end: 6 }]
                    ])
                ).toEqual([["a", { type: TokenTypes.NAME, position: { start: 0, end: 1 } }]]));
        });
        describe("multi-line", () => {
            it("on its own", () =>
                expect(
                    mergeTokens([
                        ["/", { start: 0, end: 1 }],
                        ["*", { start: 1, end: 2 }],
                        ["a", { start: 2, end: 3 }],
                        ["*", { start: 3, end: 4 }],
                        ["/", { start: 4, end: 5 }]
                    ])
                ).toEqual([]));
            it("with token before", () =>
                expect(
                    mergeTokens([
                        ["a", { start: 0, end: 1 }],
                        ["/", { start: 1, end: 2 }],
                        ["*", { start: 2, end: 3 }],
                        ["a", { start: 3, end: 4 }],
                        ["*", { start: 4, end: 5 }],
                        ["/", { start: 5, end: 6 }]
                    ])
                ).toEqual([["a", { type: TokenTypes.NAME, position: { start: 0, end: 1 } }]]));
            it("with token after", () =>
                expect(
                    mergeTokens([
                        ["/", { start: 0, end: 1 }],
                        ["*", { start: 1, end: 2 }],
                        ["a", { start: 2, end: 3 }],
                        ["*", { start: 3, end: 4 }],
                        ["/", { start: 4, end: 5 }],
                        ["a", { start: 5, end: 6 }]
                    ])
                ).toEqual([["a", { type: TokenTypes.NAME, position: { start: 5, end: 6 } }]]));
            it("with token before and after", () =>
                expect(
                    mergeTokens([
                        ["a", { start: 0, end: 1 }],
                        ["/", { start: 1, end: 2 }],
                        ["*", { start: 2, end: 3 }],
                        ["a", { start: 3, end: 4 }],
                        ["*", { start: 4, end: 5 }],
                        ["/", { start: 5, end: 6 }],
                        ["a", { start: 6, end: 7 }]
                    ])
                ).toEqual([
                    ["a", { type: TokenTypes.NAME, position: { start: 0, end: 1 } }],
                    ["a", { type: TokenTypes.NAME, position: { start: 6, end: 7 } }]
                ]));
            it("with nesting", () =>
                expect(
                    mergeTokens([
                        ["/", { start: 0, end: 1 }],
                        ["*", { start: 1, end: 2 }],
                        ["a", { start: 2, end: 3 }],
                        ["/", { start: 3, end: 4 }],
                        ["*", { start: 4, end: 5 }],
                        ["a", { start: 5, end: 6 }],
                        ["*", { start: 6, end: 7 }],
                        ["/", { start: 7, end: 8 }],
                        ["a", { start: 8, end: 9 }],
                        ["*", { start: 9, end: 10 }],
                        ["/", { start: 10, end: 11 }]
                    ])
                ).toEqual([]));
            it("unclosed", () => {
                const f = () =>
                    mergeTokens([
                        ["/", { start: 0, end: 1 }],
                        ["*", { start: 1, end: 2 }],
                        ["a", { start: 2, end: 3 }]
                    ]);
                let didThrow = false;
                try {
                    f();
                } catch (e) {
                    didThrow = true;
                    expect(e).toBeInstanceOf(ZircoSyntaxError);
                    expect((e as ZircoSyntaxError).type).toBe(ZircoSyntaxErrorTypes.UNCLOSED_COMMENT);
                    expect((e as ZircoSyntaxError).position).toEqual({ start: 0, end: 3 });
                }
                expect(didThrow).toBe(true);
            });
            it('unclosed (nested)', () => {
                const f = () => mergeTokens([
                    ['/', { start: 0, end: 1 }],
                    ['*', { start: 1, end: 2 }],
                    ['a', { start: 2, end: 3 }],
                    ['/', { start: 3, end: 4 }],
                    ['*', { start: 4, end: 5 }],
                    ['a', { start: 5, end: 6 }],
                ]);
                let didThrow = false;
                try { f(); }
                catch (e) {
                    didThrow = true;
                    expect(e).toBeInstanceOf(ZircoSyntaxError);
                    expect((e as ZircoSyntaxError).type).toBe(ZircoSyntaxErrorTypes.UNCLOSED_COMMENT);
                    expect((e as ZircoSyntaxError).position).toEqual({ start: 0, end: 6 });
                }
                expect(didThrow).toBe(true);
            });
        });
    });

    describe("multi-character operators", () => {
        it("addition assignment", () =>
            expect(
                mergeTokens([
                    ["+", { start: 0, end: 1 }],
                    ["=", { start: 1, end: 2 }]
                ])
            ).toEqual([["+=", { type: TokenTypes.OPERATOR, position: { start: 0, end: 2 } }]]));

        it("subtraction assignment", () =>
            expect(
                mergeTokens([
                    ["-", { start: 0, end: 1 }],
                    ["=", { start: 1, end: 2 }]
                ])
            ).toEqual([["-=", { type: TokenTypes.OPERATOR, position: { start: 0, end: 2 } }]]));

        it("multiplication assignment", () =>
            expect(
                mergeTokens([
                    ["*", { start: 0, end: 1 }],
                    ["=", { start: 1, end: 2 }]
                ])
            ).toEqual([["*=", { type: TokenTypes.OPERATOR, position: { start: 0, end: 2 } }]]));

        it("division assignment", () =>
            expect(
                mergeTokens([
                    ["/", { start: 0, end: 1 }],
                    ["=", { start: 1, end: 2 }]
                ])
            ).toEqual([["/=", { type: TokenTypes.OPERATOR, position: { start: 0, end: 2 } }]]));

        it("increment", () =>
            expect(
                mergeTokens([
                    ["+", { start: 0, end: 1 }],
                    ["+", { start: 1, end: 2 }]
                ])
            ).toEqual([["++", { type: TokenTypes.OPERATOR, position: { start: 0, end: 2 } }]]));

        it("decrement", () =>
            expect(
                mergeTokens([
                    ["-", { start: 0, end: 1 }],
                    ["-", { start: 1, end: 2 }]
                ])
            ).toEqual([["--", { type: TokenTypes.OPERATOR, position: { start: 0, end: 2 } }]]));

        it("equality", () =>
            expect(
                mergeTokens([
                    ["=", { start: 0, end: 1 }],
                    ["=", { start: 1, end: 2 }]
                ])
            ).toEqual([["==", { type: TokenTypes.OPERATOR, position: { start: 0, end: 2 } }]]));

        it("inequality", () =>
            expect(
                mergeTokens([
                    ["!", { start: 0, end: 1 }],
                    ["=", { start: 1, end: 2 }]
                ])
            ).toEqual([["!=", { type: TokenTypes.OPERATOR, position: { start: 0, end: 2 } }]]));

        it("greater than or equal to", () =>
            expect(
                mergeTokens([
                    [">", { start: 0, end: 1 }],
                    ["=", { start: 1, end: 2 }]
                ])
            ).toEqual([[">=", { type: TokenTypes.OPERATOR, position: { start: 0, end: 2 } }]]));

        it("less than or equal to", () =>
            expect(
                mergeTokens([
                    ["<", { start: 0, end: 1 }],
                    ["=", { start: 1, end: 2 }]
                ])
            ).toEqual([["<=", { type: TokenTypes.OPERATOR, position: { start: 0, end: 2 } }]]));

        it("logical and", () =>
            expect(
                mergeTokens([
                    ["&", { start: 0, end: 1 }],
                    ["&", { start: 1, end: 2 }]
                ])
            ).toEqual([["&&", { type: TokenTypes.OPERATOR, position: { start: 0, end: 2 } }]]));

        it("logical or", () =>
            expect(
                mergeTokens([
                    ["|", { start: 0, end: 1 }],
                    ["|", { start: 1, end: 2 }]
                ])
            ).toEqual([["||", { type: TokenTypes.OPERATOR, position: { start: 0, end: 2 } }]]));

        it("bit shift left", () =>
            expect(
                mergeTokens([
                    ["<", { start: 0, end: 1 }],
                    ["<", { start: 1, end: 2 }]
                ])
            ).toEqual([["<<", { type: TokenTypes.OPERATOR, position: { start: 0, end: 2 } }]]));

        it("bit shift right", () =>
            expect(
                mergeTokens([
                    [">", { start: 0, end: 1 }],
                    [">", { start: 1, end: 2 }]
                ])
            ).toEqual([[">>", { type: TokenTypes.OPERATOR, position: { start: 0, end: 2 } }]]));

        it("exponent", () =>
            expect(
                mergeTokens([
                    ["*", { start: 0, end: 1 }],
                    ["*", { start: 1, end: 2 }]
                ])
            ).toEqual([["**", { type: TokenTypes.OPERATOR, position: { start: 0, end: 2 } }]]));
    });
});
