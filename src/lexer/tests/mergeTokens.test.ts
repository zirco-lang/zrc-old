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
    it("returns none on an empty input", () => expect(mergeTokens("")).toEqual([]));
    describe("simple tokens", () => {
        it("classifies a single letter as an identifier", () =>
            expect(mergeTokens("a")).toEqual([["a", { type: TokenTypes.NAME, position: { start: 0, end: 1 } }]]));
        it("classifies a single number as a constant", () =>
            expect(mergeTokens("1")).toEqual([["1", { type: TokenTypes.CONSTANT_NUMBER, position: { start: 0, end: 1 } }]]));
        it("classifies a single-letter string as a string", () =>
            expect(mergeTokens('"a"')).toEqual([['"a"', { type: TokenTypes.STRING, position: { start: 0, end: 3 } }]]));
        describe("strings with weird traits", () => {
            it("errors on string with no end", () => {
                const f = () => mergeTokens('"');
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
                const f = () => mergeTokens('"a\\');
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
                const f = () => mergeTokens('"\\"');
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
                expect(mergeTokens('"\\""')).toEqual([['"\\""', { type: TokenTypes.STRING, position: { start: 0, end: 4 } }]]));
        });
        describe("numerical constant types", () => {
            it("classifies a decimal number as a constant", () =>
                expect(mergeTokens("111")).toEqual([["111", { type: TokenTypes.CONSTANT_NUMBER, position: { start: 0, end: 3 } }]]));
            it("classifies a hexadecimal number as a constant", () =>
                expect(mergeTokens("0xFF")).toEqual([["0xFF", { type: TokenTypes.CONSTANT_NUMBER, position: { start: 0, end: 4 } }]]));
            it("classifies a binary number as a constant", () =>
                expect(mergeTokens("0b11")).toEqual([["0b11", { type: TokenTypes.CONSTANT_NUMBER, position: { start: 0, end: 4 } }]]));
            it("classifies a number with a decimal as a constant", () =>
                expect(mergeTokens("1.3")).toEqual([["1.3", { type: TokenTypes.CONSTANT_NUMBER, position: { start: 0, end: 3 } }]]));
            it("should error when given a non-binary value in a binary constant", () => {
                const f = () => mergeTokens("0b2");
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
                const f = () => mergeTokens("0xZ");
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
        it("operator", () => expect(mergeTokens("+")).toEqual([["+", { type: TokenTypes.OPERATOR, position: { start: 0, end: 1 } }]]));
    });
    describe("whitespace trimming", () => {
        // In this case, it's expected that multiple spaces are merged and start/end indicate them safely.
        it("one space between NAME tokens", () =>
            expect(mergeTokens("a b")).toEqual([
                ["a", { type: TokenTypes.NAME, position: { start: 0, end: 1 } }],
                ["b", { type: TokenTypes.NAME, position: { start: 2, end: 3 } }]
            ]));
        it("space between CONSTANT_NUMBERs", () =>
            expect(mergeTokens("1 2")).toEqual([
                ["1", { type: TokenTypes.CONSTANT_NUMBER, position: { start: 0, end: 1 } }],
                ["2", { type: TokenTypes.CONSTANT_NUMBER, position: { start: 2, end: 3 } }]
            ]));
        it("space between hexadecimal CONSTANT_NUMBERs", () =>
            expect(mergeTokens("0xF 0xF")).toEqual([
                ["0xF", { type: TokenTypes.CONSTANT_NUMBER, position: { start: 0, end: 3 } }],
                ["0xF", { type: TokenTypes.CONSTANT_NUMBER, position: { start: 4, end: 7 } }]
            ]));
        it("space between STRINGs", () =>
            expect(mergeTokens('"a" "b"')).toEqual([
                ['"a"', { type: TokenTypes.STRING, position: { start: 0, end: 3 } }],
                ['"b"', { type: TokenTypes.STRING, position: { start: 4, end: 7 } }]
            ]));
        it("one tab between tokens", () =>
            expect(mergeTokens("a\tb")).toEqual([
                ["a", { type: TokenTypes.NAME, position: { start: 0, end: 1 } }],
                ["b", { type: TokenTypes.NAME, position: { start: 2, end: 3 } }]
            ]));
        it("one newline between tokens", () =>
            expect(mergeTokens("a\nb")).toEqual([
                ["a", { type: TokenTypes.NAME, position: { start: 0, end: 1 } }],
                ["b", { type: TokenTypes.NAME, position: { start: 2, end: 3 } }]
            ]));
        it("multiple spaces between tokens", () =>
            expect(mergeTokens("a  b")).toEqual([
                ["a", { type: TokenTypes.NAME, position: { start: 0, end: 1 } }],
                ["b", { type: TokenTypes.NAME, position: { start: 3, end: 4 } }]
            ]));
    });
    describe("more complex cases", () => {
        it("identifier with a number", () => expect(mergeTokens("a1")).toEqual([["a1", { type: TokenTypes.NAME, position: { start: 0, end: 2 } }]]));
        it("sequential non-operator symbols are separate", () =>
            expect(mergeTokens("$$")).toEqual([
                ["$", { type: TokenTypes.OTHER, position: { start: 0, end: 1 } }],
                ["$", { type: TokenTypes.OTHER, position: { start: 1, end: 2 } }]
            ]));
        it("letter in a number", () => {
            const f = () => mergeTokens("1a");
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
            expect(mergeTokens("a+b")).toEqual([
                ["a", { type: TokenTypes.NAME, position: { start: 0, end: 1 } }],
                ["+", { type: TokenTypes.OPERATOR, position: { start: 1, end: 2 } }],
                ["b", { type: TokenTypes.NAME, position: { start: 2, end: 3 } }]
            ]));
        it("whitespace change in token type", () =>
            expect(mergeTokens("a + b")).toEqual([
                ["a", { type: TokenTypes.NAME, position: { start: 0, end: 1 } }],
                ["+", { type: TokenTypes.OPERATOR, position: { start: 2, end: 3 } }],
                ["b", { type: TokenTypes.NAME, position: { start: 4, end: 5 } }]
            ]));
        it("sequential decimals (sequential) should fail", () => {
            const f = () => mergeTokens("1..");
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
            const f = () => mergeTokens("1.2.");
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
            const f = () => mergeTokens("0x");
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
            expect(mergeTokens('"a""b"')).toEqual([
                ['"a"', { type: TokenTypes.STRING, position: { start: 0, end: 3 } }],
                ['"b"', { type: TokenTypes.STRING, position: { start: 3, end: 6 } }]
            ]));
        it("string then identifier", () =>
            expect(mergeTokens('"a"b')).toEqual([
                ['"a"', { type: TokenTypes.STRING, position: { start: 0, end: 3 } }],
                ["b", { type: TokenTypes.NAME, position: { start: 3, end: 4 } }]
            ]));
        it("identifier then string", () =>
            expect(mergeTokens('a"b"')).toEqual([
                ["a", { type: TokenTypes.NAME, position: { start: 0, end: 1 } }],
                ['"b"', { type: TokenTypes.STRING, position: { start: 1, end: 4 } }]
            ]));

        it("underscores in numbers", () =>
            expect(mergeTokens("1_2")).toEqual([["1_2", { type: TokenTypes.CONSTANT_NUMBER, position: { start: 0, end: 3 } }]]));
    });

    describe("comments", () => {
        describe("single-line", () => {
            it("simple single-line on its own (w/ space)", () => expect(mergeTokens("// a")).toEqual([]));
            it("simple single-line on its own (w/o space)", () => expect(mergeTokens("//a")).toEqual([]));
            it("simple single-line with trailing space", () => expect(mergeTokens("// a ")).toEqual([]));
            it("simple single line with token before", () =>
                expect(mergeTokens("a// b")).toEqual([["a", { type: TokenTypes.NAME, position: { start: 0, end: 1 } }]]));
            it("simple single line with token before (+ space)", () =>
                expect(mergeTokens("a /// b")).toEqual([["a", { type: TokenTypes.NAME, position: { start: 0, end: 1 } }]]));
        });
        describe("multi-line", () => {
            it("on its own", () => expect(mergeTokens("/*a*/")).toEqual([]));
            it("with token before", () => expect(mergeTokens("a/*a*/")).toEqual([["a", { type: TokenTypes.NAME, position: { start: 0, end: 1 } }]]));
            it("with token after", () => expect(mergeTokens("/*a*/a")).toEqual([["a", { type: TokenTypes.NAME, position: { start: 5, end: 6 } }]]));
            it("with token before and after", () =>
                expect(mergeTokens("a/*a*/a")).toEqual([
                    ["a", { type: TokenTypes.NAME, position: { start: 0, end: 1 } }],
                    ["a", { type: TokenTypes.NAME, position: { start: 6, end: 7 } }]
                ]));
            it("with nesting", () => expect(mergeTokens("/*a/*a*/a*/")).toEqual([]));
            it("unclosed", () => {
                const f = () => mergeTokens("/*a");
                let didThrow = false;
                try {
                    f();
                } catch (e) {
                    didThrow = true;
                    expect(e).toBeInstanceOf(ZircoSyntaxError);
                    expect((e as ZircoSyntaxError).type).toBe(ZircoSyntaxErrorTypes.LEXER_UNCLOSED_COMMENT);
                    expect((e as ZircoSyntaxError).position).toEqual({ start: 0, end: 3 });
                }
                expect(didThrow).toBe(true);
            });
            it("unclosed (nested)", () => {
                const f = () => mergeTokens("/*a/*a");
                let didThrow = false;
                try {
                    f();
                } catch (e) {
                    didThrow = true;
                    expect(e).toBeInstanceOf(ZircoSyntaxError);
                    expect((e as ZircoSyntaxError).type).toBe(ZircoSyntaxErrorTypes.LEXER_UNCLOSED_COMMENT);
                    expect((e as ZircoSyntaxError).position).toEqual({ start: 0, end: 6 });
                }
                expect(didThrow).toBe(true);
            });
            it("newline case", () =>
                expect(mergeTokens("a\n//a\na")).toEqual([
                    ["a", { type: TokenTypes.NAME, position: { start: 0, end: 1 } }],
                    ["a", { type: TokenTypes.NAME, position: { start: 6, end: 7 } }]
                ]));
        });
    });

    describe("multi-character operators", () => {
        const MC_OPS = [
            ["addition assignment", "+="],
            ["subtraction assignment", "-="],
            ["multiplication assignment", "*="],
            ["division assignment", "/="],
            ["increment", "++"],
            ["decrement", "--"],
            ["equality", "=="],
            ["inequality", "!="],
            ["less than or equal", "<="],
            ["greater than or equal", ">="],
            ["logical and", "&&"],
            ["logical or", "||"],
            ["bit shift left", "<<"],
            ["bit shift right", ">>"],
            ["exponent", "**"]
        ];
        for (const [name, op] of MC_OPS)
            it(name, () => expect(mergeTokens(op)).toEqual([[op, { type: TokenTypes.OPERATOR, position: { start: 0, end: 2 } }]]));
    });
});
