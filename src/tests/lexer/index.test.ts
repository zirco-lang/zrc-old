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

import type { OKLexerOutput, Token } from "../../lexer/index";
import lex, { TokenTypes } from "../../lexer/index";
import ZircoSyntaxError, { ZircoSyntaxErrorTypes } from "../../lib/structures/errors/ZircoSyntaxError";

function lexerOKResult(tokens: Token[]): OKLexerOutput {
    return { ok: true, issues: [], tokens };
}

describe("lex", () => {
    it("returns none on an empty input", () => expect(lex("")).toEqual(lexerOKResult([])));
    describe("simple tokens", () => {
        it("classifies a single letter as an identifier", () =>
            expect(lex("a")).toEqual(lexerOKResult([["a", { type: TokenTypes.Name, position: { start: 0, end: 0 } }]])));
        it("classifies a single number as a constant", () =>
            expect(lex("1")).toEqual(lexerOKResult([["1", { type: TokenTypes.Number, position: { start: 0, end: 0 } }]])));
        it("classifies a single-letter string as a string", () =>
            expect(lex('"a"')).toEqual(lexerOKResult([['"a"', { type: TokenTypes.String, position: { start: 0, end: 2 } }]])));
        describe("strings with weird traits", () => {
            it("errors on string with no end", () =>
                expect(() => lex('"')).toThrowZircoError(ZircoSyntaxError, ZircoSyntaxErrorTypes.UnclosedString, {
                    start: 0,
                    end: 0
                }));
            it("should error provided a non-closed string with an escape", () =>
                expect(() => lex('"a\\')).toThrowZircoError(ZircoSyntaxError, ZircoSyntaxErrorTypes.UnclosedString, {
                    start: 2,
                    end: 2
                }));
            it("escaped EOF", () =>
                expect(() => lex('"\\"')).toThrowZircoError(ZircoSyntaxError, ZircoSyntaxErrorTypes.UnclosedString, {
                    start: 0,
                    end: 2
                }));
            it("works with escaped quote", () =>
                expect(lex('"\\""')).toEqual(lexerOKResult([['"\\""', { type: TokenTypes.String, position: { start: 0, end: 3 } }]])));
        });
        describe("numerical constant types", () => {
            it("classifies a decimal number as a constant", () =>
                expect(lex("111")).toEqual(lexerOKResult([["111", { type: TokenTypes.Number, position: { start: 0, end: 2 } }]])));
            it("classifies a hexadecimal number as a constant", () =>
                expect(lex("0xFF")).toEqual(lexerOKResult([["0xFF", { type: TokenTypes.Number, position: { start: 0, end: 3 } }]])));
            it("classifies a binary number as a constant", () =>
                expect(lex("0b11")).toEqual(lexerOKResult([["0b11", { type: TokenTypes.Number, position: { start: 0, end: 3 } }]])));
            it("classifies a number with a decimal as a constant", () =>
                expect(lex("1.3")).toEqual(lexerOKResult([["1.3", { type: TokenTypes.Number, position: { start: 0, end: 2 } }]])));
            it("should error when given a non-binary value in a binary constant", () =>
                expect(() => lex("0b2")).toThrowZircoError(ZircoSyntaxError, ZircoSyntaxErrorTypes.NumberInvalidCharacter, {
                    start: 2,
                    end: 2
                }));
            it("should error given a Z in a hex", () =>
                expect(() => lex("0xZ")).toThrowZircoError(ZircoSyntaxError, ZircoSyntaxErrorTypes.NumberInvalidCharacter, {
                    start: 2,
                    end: 2
                }));
        });
        it("operator", () => expect(lex("+")).toEqual(lexerOKResult([["+", { type: TokenTypes.Operator, position: { start: 0, end: 0 } }]])));
    });
    describe("whitespace trimming", () => {
        // In this case, it's expected that multiple spaces are merged and start/end indicate them safely.
        it("one space between NAME tokens", () =>
            expect(lex("a b")).toEqual(
                lexerOKResult([
                    ["a", { type: TokenTypes.Name, position: { start: 0, end: 0 } }],
                    ["b", { type: TokenTypes.Name, position: { start: 2, end: 2 } }]
                ])
            ));
        it("space between CONSTANT_NUMBERs", () =>
            expect(lex("1 2")).toEqual(
                lexerOKResult([
                    ["1", { type: TokenTypes.Number, position: { start: 0, end: 0 } }],
                    ["2", { type: TokenTypes.Number, position: { start: 2, end: 2 } }]
                ])
            ));
        it("space between hexadecimal CONSTANT_NUMBERs", () =>
            expect(lex("0xF 0xF")).toEqual(
                lexerOKResult([
                    ["0xF", { type: TokenTypes.Number, position: { start: 0, end: 2 } }],
                    ["0xF", { type: TokenTypes.Number, position: { start: 4, end: 6 } }]
                ])
            ));
        it("space between STRINGs", () =>
            expect(lex('"a" "b"')).toEqual(
                lexerOKResult([
                    ['"a"', { type: TokenTypes.String, position: { start: 0, end: 2 } }],
                    ['"b"', { type: TokenTypes.String, position: { start: 4, end: 6 } }]
                ])
            ));
        it("one tab between tokens", () =>
            expect(lex("a\tb")).toEqual(
                lexerOKResult([
                    ["a", { type: TokenTypes.Name, position: { start: 0, end: 0 } }],
                    ["b", { type: TokenTypes.Name, position: { start: 2, end: 2 } }]
                ])
            ));
        it("one newline between tokens", () =>
            expect(lex("a\nb")).toEqual(
                lexerOKResult([
                    ["a", { type: TokenTypes.Name, position: { start: 0, end: 0 } }],
                    ["b", { type: TokenTypes.Name, position: { start: 2, end: 2 } }]
                ])
            ));
        it("multiple spaces between tokens", () =>
            expect(lex("a  b")).toEqual(
                lexerOKResult([
                    ["a", { type: TokenTypes.Name, position: { start: 0, end: 0 } }],
                    ["b", { type: TokenTypes.Name, position: { start: 3, end: 3 } }]
                ])
            ));
    });
    describe("more complex cases", () => {
        it("identifier with a number", () =>
            expect(lex("a1")).toEqual(lexerOKResult([["a1", { type: TokenTypes.Name, position: { start: 0, end: 1 } }]])));
        it("sequential non-operator symbols are separate", () =>
            expect(lex("$$")).toEqual(
                lexerOKResult([
                    ["$", { type: TokenTypes.Other, position: { start: 0, end: 0 } }],
                    ["$", { type: TokenTypes.Other, position: { start: 1, end: 1 } }]
                ])
            ));
        it("letter in a number", () =>
            expect(() => lex("1a")).toThrowZircoError(ZircoSyntaxError, ZircoSyntaxErrorTypes.NumberInvalidCharacter, {
                start: 1,
                end: 1
            }));
        it("no whitespace change in token type", () =>
            expect(lex("a+b")).toEqual(
                lexerOKResult([
                    ["a", { type: TokenTypes.Name, position: { start: 0, end: 0 } }],
                    ["+", { type: TokenTypes.Operator, position: { start: 1, end: 1 } }],
                    ["b", { type: TokenTypes.Name, position: { start: 2, end: 2 } }]
                ])
            ));
        it("whitespace change in token type", () =>
            expect(lex("a + b")).toEqual(
                lexerOKResult([
                    ["a", { type: TokenTypes.Name, position: { start: 0, end: 0 } }],
                    ["+", { type: TokenTypes.Operator, position: { start: 2, end: 2 } }],
                    ["b", { type: TokenTypes.Name, position: { start: 4, end: 4 } }]
                ])
            ));
        it("multiple sequential decimals should fail", () =>
            expect(() => lex("1..")).toThrowZircoError(ZircoSyntaxError, ZircoSyntaxErrorTypes.NumberMultipleDecimalPoints, {
                start: 0,
                end: 2
            }));
        it("multiple decimals should fail", () =>
            expect(() => lex("1.2.")).toThrowZircoError(ZircoSyntaxError, ZircoSyntaxErrorTypes.NumberMultipleDecimalPoints, {
                start: 0,
                end: 3
            }));
        it("opening but not a value for a constant number", () =>
            expect(() => lex("0x")).toThrowZircoError(ZircoSyntaxError, ZircoSyntaxErrorTypes.NumberPrefixWithNoValue, {
                start: 1,
                end: 1
            }));
        it("sequential strings", () =>
            expect(lex('"a""b"')).toEqual(
                lexerOKResult([
                    ['"a"', { type: TokenTypes.String, position: { start: 0, end: 2 } }],
                    ['"b"', { type: TokenTypes.String, position: { start: 3, end: 5 } }]
                ])
            ));
        it("string then identifier", () =>
            expect(lex('"a"b')).toEqual(
                lexerOKResult([
                    ['"a"', { type: TokenTypes.String, position: { start: 0, end: 2 } }],
                    ["b", { type: TokenTypes.Name, position: { start: 3, end: 3 } }]
                ])
            ));
        it("identifier then string", () =>
            expect(lex('a"b"')).toEqual(
                lexerOKResult([
                    ["a", { type: TokenTypes.Name, position: { start: 0, end: 0 } }],
                    ['"b"', { type: TokenTypes.String, position: { start: 1, end: 3 } }]
                ])
            ));

        it("underscores in numbers", () =>
            expect(lex("1_2")).toEqual(lexerOKResult([["1_2", { type: TokenTypes.Number, position: { start: 0, end: 2 } }]])));
    });

    describe("comments", () => {
        describe("single-line", () => {
            it("simple single-line on its own (w/ space)", () => expect(lex("// a")).toEqual(lexerOKResult([])));
            it("simple single-line on its own (w/o space)", () => expect(lex("//a")).toEqual(lexerOKResult([])));
            it("simple single-line with trailing space", () => expect(lex("// a ")).toEqual(lexerOKResult([])));
            it("simple single line with token before", () =>
                expect(lex("a// b")).toEqual(lexerOKResult([["a", { type: TokenTypes.Name, position: { start: 0, end: 0 } }]])));
            it("simple single line with token before (+ space)", () =>
                expect(lex("a /// b")).toEqual(lexerOKResult([["a", { type: TokenTypes.Name, position: { start: 0, end: 0 } }]])));
        });
        describe("multi-line", () => {
            it("on its own", () => expect(lex("/*a*/")).toEqual(lexerOKResult([])));
            it("with token before", () =>
                expect(lex("a/*a*/")).toEqual(lexerOKResult([["a", { type: TokenTypes.Name, position: { start: 0, end: 0 } }]])));
            it("with token after", () =>
                expect(lex("/*a*/a")).toEqual(lexerOKResult([["a", { type: TokenTypes.Name, position: { start: 5, end: 5 } }]])));
            it("with token before and after", () =>
                expect(lex("a/*a*/a")).toEqual(
                    lexerOKResult([
                        ["a", { type: TokenTypes.Name, position: { start: 0, end: 0 } }],
                        ["a", { type: TokenTypes.Name, position: { start: 6, end: 6 } }]
                    ])
                ));
            it("with nesting", () => expect(lex("/*a/*a*/a*/")).toEqual(lexerOKResult([])));
            it("unclosed", () =>
                expect(() => lex("/*a")).toThrowZircoError(ZircoSyntaxError, ZircoSyntaxErrorTypes.UnclosedBlockComment, {
                    start: 0,
                    end: 2
                }));
            it("unclosed (nested)", () =>
                expect(() => lex("/*a/*a")).toThrowZircoError(ZircoSyntaxError, ZircoSyntaxErrorTypes.UnclosedBlockComment, {
                    start: 0,
                    end: 5
                }));
            it("newline case", () =>
                expect(lex("a\n//a\na")).toEqual(
                    lexerOKResult([
                        ["a", { type: TokenTypes.Name, position: { start: 0, end: 0 } }],
                        ["a", { type: TokenTypes.Name, position: { start: 6, end: 6 } }]
                    ])
                ));
            it("block comment start marker within a line-comment", () => expect(lex("///*")).toEqual(lexerOKResult([])));
            it("un-started block comment end", () =>
                expect(lex("*/")).toEqual(
                    lexerOKResult([
                        ["*", { type: TokenTypes.Operator, position: { start: 0, end: 0 } }],
                        ["/", { type: TokenTypes.Operator, position: { start: 1, end: 1 } }]
                    ])
                ));
        });
    });

    describe("two-character operators", () => {
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
            it(name, () => expect(lex(op)).toEqual(lexerOKResult([[op, { type: TokenTypes.Operator, position: { start: 0, end: 1 } }]])));
    });
});
