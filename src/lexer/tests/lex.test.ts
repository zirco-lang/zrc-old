/*
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

import "../../../setupJest";

import ZircoSyntaxError, { ZircoSyntaxErrorTypes } from "../../lib/structures/errors/ZircoSyntaxError";
import lex, { TokenTypes } from "../lex";

describe("lex", () => {
    it("returns none on an empty input", () => expect(lex("")).toEqual([]));
    describe("simple tokens", () => {
        it("classifies a single letter as an identifier", () =>
            expect(lex("a")).toEqual([["a", { type: TokenTypes.NAME, position: { start: 0, end: 1 } }]]));
        it("classifies a single number as a constant", () =>
            expect(lex("1")).toEqual([["1", { type: TokenTypes.CONSTANT_NUMBER, position: { start: 0, end: 1 } }]]));
        it("classifies a single-letter string as a string", () =>
            expect(lex('"a"')).toEqual([['"a"', { type: TokenTypes.STRING, position: { start: 0, end: 3 } }]]));
        describe("strings with weird traits", () => {
            it("errors on string with no end", () =>
                expect(() => lex('"')).toThrowZircoError(ZircoSyntaxError, ZircoSyntaxErrorTypes.LEXER_STRING_UNCLOSED, {
                    start: 0,
                    end: 1
                }));
            it("should error provided a non-closed string with an escape", () =>
                expect(() => lex('"a\\')).toThrowZircoError(ZircoSyntaxError, ZircoSyntaxErrorTypes.LEXER_STRING_ESCAPE_EOF, {
                    start: 2,
                    end: 3
                }));
            it("escaped EOF", () =>
                expect(() => lex('"\\"')).toThrowZircoError(ZircoSyntaxError, ZircoSyntaxErrorTypes.LEXER_STRING_UNCLOSED, {
                    start: 0,
                    end: 3
                }));
            it("works with escaped quote", () =>
                expect(lex('"\\""')).toEqual([['"\\""', { type: TokenTypes.STRING, position: { start: 0, end: 4 } }]]));
        });
        describe("numerical constant types", () => {
            it("classifies a decimal number as a constant", () =>
                expect(lex("111")).toEqual([["111", { type: TokenTypes.CONSTANT_NUMBER, position: { start: 0, end: 3 } }]]));
            it("classifies a hexadecimal number as a constant", () =>
                expect(lex("0xFF")).toEqual([["0xFF", { type: TokenTypes.CONSTANT_NUMBER, position: { start: 0, end: 4 } }]]));
            it("classifies a binary number as a constant", () =>
                expect(lex("0b11")).toEqual([["0b11", { type: TokenTypes.CONSTANT_NUMBER, position: { start: 0, end: 4 } }]]));
            it("classifies a number with a decimal as a constant", () =>
                expect(lex("1.3")).toEqual([["1.3", { type: TokenTypes.CONSTANT_NUMBER, position: { start: 0, end: 3 } }]]));
            it("should error when given a non-binary value in a binary constant", () =>
                expect(() => lex("0b2")).toThrowZircoError(ZircoSyntaxError, ZircoSyntaxErrorTypes.LEXER_NUMBER_INVALID_CHARACTER, {
                    start: 2,
                    end: 3
                }));
            it("should error given a Z in a hex", () =>
                expect(() => lex("0xZ")).toThrowZircoError(ZircoSyntaxError, ZircoSyntaxErrorTypes.LEXER_NUMBER_INVALID_CHARACTER, {
                    start: 2,
                    end: 3
                }));
        });
        it("operator", () => expect(lex("+")).toEqual([["+", { type: TokenTypes.OPERATOR, position: { start: 0, end: 1 } }]]));
    });
    describe("whitespace trimming", () => {
        // In this case, it's expected that multiple spaces are merged and start/end indicate them safely.
        it("one space between NAME tokens", () =>
            expect(lex("a b")).toEqual([
                ["a", { type: TokenTypes.NAME, position: { start: 0, end: 1 } }],
                ["b", { type: TokenTypes.NAME, position: { start: 2, end: 3 } }]
            ]));
        it("space between CONSTANT_NUMBERs", () =>
            expect(lex("1 2")).toEqual([
                ["1", { type: TokenTypes.CONSTANT_NUMBER, position: { start: 0, end: 1 } }],
                ["2", { type: TokenTypes.CONSTANT_NUMBER, position: { start: 2, end: 3 } }]
            ]));
        it("space between hexadecimal CONSTANT_NUMBERs", () =>
            expect(lex("0xF 0xF")).toEqual([
                ["0xF", { type: TokenTypes.CONSTANT_NUMBER, position: { start: 0, end: 3 } }],
                ["0xF", { type: TokenTypes.CONSTANT_NUMBER, position: { start: 4, end: 7 } }]
            ]));
        it("space between STRINGs", () =>
            expect(lex('"a" "b"')).toEqual([
                ['"a"', { type: TokenTypes.STRING, position: { start: 0, end: 3 } }],
                ['"b"', { type: TokenTypes.STRING, position: { start: 4, end: 7 } }]
            ]));
        it("one tab between tokens", () =>
            expect(lex("a\tb")).toEqual([
                ["a", { type: TokenTypes.NAME, position: { start: 0, end: 1 } }],
                ["b", { type: TokenTypes.NAME, position: { start: 2, end: 3 } }]
            ]));
        it("one newline between tokens", () =>
            expect(lex("a\nb")).toEqual([
                ["a", { type: TokenTypes.NAME, position: { start: 0, end: 1 } }],
                ["b", { type: TokenTypes.NAME, position: { start: 2, end: 3 } }]
            ]));
        it("multiple spaces between tokens", () =>
            expect(lex("a  b")).toEqual([
                ["a", { type: TokenTypes.NAME, position: { start: 0, end: 1 } }],
                ["b", { type: TokenTypes.NAME, position: { start: 3, end: 4 } }]
            ]));
    });
    describe("more complex cases", () => {
        it("identifier with a number", () => expect(lex("a1")).toEqual([["a1", { type: TokenTypes.NAME, position: { start: 0, end: 2 } }]]));
        it("sequential non-operator symbols are separate", () =>
            expect(lex("$$")).toEqual([
                ["$", { type: TokenTypes.OTHER, position: { start: 0, end: 1 } }],
                ["$", { type: TokenTypes.OTHER, position: { start: 1, end: 2 } }]
            ]));
        it("letter in a number", () =>
            expect(() => lex("1a")).toThrowZircoError(ZircoSyntaxError, ZircoSyntaxErrorTypes.LEXER_NUMBER_INVALID_CHARACTER, {
                start: 1,
                end: 2
            }));
        it("no whitespace change in token type", () =>
            expect(lex("a+b")).toEqual([
                ["a", { type: TokenTypes.NAME, position: { start: 0, end: 1 } }],
                ["+", { type: TokenTypes.OPERATOR, position: { start: 1, end: 2 } }],
                ["b", { type: TokenTypes.NAME, position: { start: 2, end: 3 } }]
            ]));
        it("whitespace change in token type", () =>
            expect(lex("a + b")).toEqual([
                ["a", { type: TokenTypes.NAME, position: { start: 0, end: 1 } }],
                ["+", { type: TokenTypes.OPERATOR, position: { start: 2, end: 3 } }],
                ["b", { type: TokenTypes.NAME, position: { start: 4, end: 5 } }]
            ]));
        it("sequential decimals (sequential) should fail", () =>
            expect(() => lex("1..")).toThrowZircoError(ZircoSyntaxError, ZircoSyntaxErrorTypes.LEXER_NUMBER_MULTIPLE_DECIMALS, {
                start: 2,
                end: 3
            }));
        it("sequential decimals (separated) should fail", () =>
            expect(() => lex("1.2.")).toThrowZircoError(ZircoSyntaxError, ZircoSyntaxErrorTypes.LEXER_NUMBER_MULTIPLE_DECIMALS, {
                start: 3,
                end: 4
            }));
        it("opening but not a value for a constant number", () =>
            expect(() => lex("0x")).toThrowZircoError(ZircoSyntaxError, ZircoSyntaxErrorTypes.LEXER_NUMBER_TYPE_PREFIX_NO_VALUE, {
                start: 1,
                end: 2
            }));
        it("sequential strings", () =>
            expect(lex('"a""b"')).toEqual([
                ['"a"', { type: TokenTypes.STRING, position: { start: 0, end: 3 } }],
                ['"b"', { type: TokenTypes.STRING, position: { start: 3, end: 6 } }]
            ]));
        it("string then identifier", () =>
            expect(lex('"a"b')).toEqual([
                ['"a"', { type: TokenTypes.STRING, position: { start: 0, end: 3 } }],
                ["b", { type: TokenTypes.NAME, position: { start: 3, end: 4 } }]
            ]));
        it("identifier then string", () =>
            expect(lex('a"b"')).toEqual([
                ["a", { type: TokenTypes.NAME, position: { start: 0, end: 1 } }],
                ['"b"', { type: TokenTypes.STRING, position: { start: 1, end: 4 } }]
            ]));

        it("underscores in numbers", () =>
            expect(lex("1_2")).toEqual([["1_2", { type: TokenTypes.CONSTANT_NUMBER, position: { start: 0, end: 3 } }]]));
    });

    describe("comments", () => {
        describe("single-line", () => {
            it("simple single-line on its own (w/ space)", () => expect(lex("// a")).toEqual([]));
            it("simple single-line on its own (w/o space)", () => expect(lex("//a")).toEqual([]));
            it("simple single-line with trailing space", () => expect(lex("// a ")).toEqual([]));
            it("simple single line with token before", () =>
                expect(lex("a// b")).toEqual([["a", { type: TokenTypes.NAME, position: { start: 0, end: 1 } }]]));
            it("simple single line with token before (+ space)", () =>
                expect(lex("a /// b")).toEqual([["a", { type: TokenTypes.NAME, position: { start: 0, end: 1 } }]]));
        });
        describe("multi-line", () => {
            it("on its own", () => expect(lex("/*a*/")).toEqual([]));
            it("with token before", () => expect(lex("a/*a*/")).toEqual([["a", { type: TokenTypes.NAME, position: { start: 0, end: 1 } }]]));
            it("with token after", () => expect(lex("/*a*/a")).toEqual([["a", { type: TokenTypes.NAME, position: { start: 5, end: 6 } }]]));
            it("with token before and after", () =>
                expect(lex("a/*a*/a")).toEqual([
                    ["a", { type: TokenTypes.NAME, position: { start: 0, end: 1 } }],
                    ["a", { type: TokenTypes.NAME, position: { start: 6, end: 7 } }]
                ]));
            it("with nesting", () => expect(lex("/*a/*a*/a*/")).toEqual([]));
            it("unclosed", () =>
                expect(() => lex("/*a")).toThrowZircoError(ZircoSyntaxError, ZircoSyntaxErrorTypes.LEXER_UNCLOSED_COMMENT, {
                    start: 0,
                    end: 3
                }));
            it("unclosed (nested)", () =>
                expect(() => lex("/*a/*a")).toThrowZircoError(ZircoSyntaxError, ZircoSyntaxErrorTypes.LEXER_UNCLOSED_COMMENT, {
                    start: 0,
                    end: 6
                }));
            it("newline case", () =>
                expect(lex("a\n//a\na")).toEqual([
                    ["a", { type: TokenTypes.NAME, position: { start: 0, end: 1 } }],
                    ["a", { type: TokenTypes.NAME, position: { start: 6, end: 7 } }]
                ]));
            it("block comment start marker within a line-comment", () => expect(lex("///*")).toEqual([]));
            it("un-started block comment end", () =>
                expect(lex("*/")).toEqual([
                    ["*", { type: TokenTypes.OPERATOR, position: { start: 0, end: 1 } }],
                    ["/", { type: TokenTypes.OPERATOR, position: { start: 1, end: 2 } }]
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
            it(name, () => expect(lex(op)).toEqual([[op, { type: TokenTypes.OPERATOR, position: { start: 0, end: 2 } }]]));
    });
});
