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

import type { FailedLexerOutput, OKLexerOutput } from "../../lexer/index";
import lex from "../../lexer/index";
import type { NameToken, NumberToken, OtherToken, StringToken, Token, TokenTypeWithoutValue, TokenWithoutValue } from "../../lexer/tokens";
import { TokenTypes } from "../../lexer/tokens";
import ZircoSyntaxError, { ZircoSyntaxErrorTypes } from "../../lib/structures/errors/ZircoSyntaxError";
import type Interval from "../../lib/types/Interval";
import type { ZircoIssue, ZircoIssueTypes } from "../../lib/types/ZircoIssue";

function lexerOKResult(tokens: Token[]): OKLexerOutput {
    return { ok: true, issues: [], tokens };
}

function lexerFailedResult(issues: ZircoIssue<ZircoIssueTypes>[]): FailedLexerOutput {
    return { ok: false, issues, tokens: null };
}

const interval = (start: number, end: number): Interval => ({ start, end });
const name = (name: string, position: Interval): NameToken => ({ type: TokenTypes.Name, raw: name, value: name, position });
const number = (value: number, raw: string, position: Interval): NumberToken => ({ type: TokenTypes.Number, raw, value, position });
const string = (value: string, raw: string, position: Interval): StringToken => ({ type: TokenTypes.String, raw, value, position });

const tokenWithoutValueFactory =
    <T extends TokenTypeWithoutValue>(type: T, raw: string) =>
    (position: Interval): TokenWithoutValue<T> => ({ type, raw, position });

const plus = tokenWithoutValueFactory(TokenTypes.Plus, "+");
const minus = tokenWithoutValueFactory(TokenTypes.Minus, "-");
const star = tokenWithoutValueFactory(TokenTypes.Star, "*");
const slash = tokenWithoutValueFactory(TokenTypes.Slash, "/");
const percent = tokenWithoutValueFactory(TokenTypes.Percent, "%");
const equals = tokenWithoutValueFactory(TokenTypes.Equals, "=");
const exclamation = tokenWithoutValueFactory(TokenTypes.Exclamation, "!");
const lessThan = tokenWithoutValueFactory(TokenTypes.LessThan, "<");
const greaterThan = tokenWithoutValueFactory(TokenTypes.GreaterThan, ">");
const leftParen = tokenWithoutValueFactory(TokenTypes.LeftParen, "(");
const rightParen = tokenWithoutValueFactory(TokenTypes.RightParen, ")");
const leftBrace = tokenWithoutValueFactory(TokenTypes.LeftBrace, "{");
const rightBrace = tokenWithoutValueFactory(TokenTypes.RightBrace, "}");
const leftBracket = tokenWithoutValueFactory(TokenTypes.LeftBracket, "[");
const rightBracket = tokenWithoutValueFactory(TokenTypes.RightBracket, "]");
const comma = tokenWithoutValueFactory(TokenTypes.Comma, ",");
const dot = tokenWithoutValueFactory(TokenTypes.Dot, ".");
const colon = tokenWithoutValueFactory(TokenTypes.Colon, ":");
const semicolon = tokenWithoutValueFactory(TokenTypes.Semicolon, ";");
const plusEquals = tokenWithoutValueFactory(TokenTypes.PlusEquals, "+=");
const minusEquals = tokenWithoutValueFactory(TokenTypes.MinusEquals, "-=");
const starEquals = tokenWithoutValueFactory(TokenTypes.StarEquals, "*=");
const slashEquals = tokenWithoutValueFactory(TokenTypes.SlashEquals, "/=");
const doubleEquals = tokenWithoutValueFactory(TokenTypes.EqualsEquals, "==");
const bangEquals = tokenWithoutValueFactory(TokenTypes.ExclamationEquals, "!=");
const lessEquals = tokenWithoutValueFactory(TokenTypes.LessThanEquals, "<=");
const greaterEquals = tokenWithoutValueFactory(TokenTypes.GreaterThanEquals, ">=");
const doublePlus = tokenWithoutValueFactory(TokenTypes.PlusPlus, "++");
const doubleMinus = tokenWithoutValueFactory(TokenTypes.MinusMinus, "--");
const doubleAmpersand = tokenWithoutValueFactory(TokenTypes.AmpersandAmpersand, "&&");
const doublePipe = tokenWithoutValueFactory(TokenTypes.PipePipe, "||");
const doubleStar = tokenWithoutValueFactory(TokenTypes.StarStar, "**");
const doubleLessThan = tokenWithoutValueFactory(TokenTypes.LessThanLessThan, "<<");
const doubleGreaterThan = tokenWithoutValueFactory(TokenTypes.GreaterThanGreaterThan, ">>");
const minusGreaterThan = tokenWithoutValueFactory(TokenTypes.MinusGreaterThan, "->");

const other = (raw: string, position: Interval): OtherToken => ({ type: TokenTypes.Other, raw, position });

describe("lex", () => {
    it("returns none on an empty input", () => expect(lex("")).toEqual(lexerOKResult([])));
    describe("simple tokens", () => {
        it("classifies a single letter as an identifier", () => expect(lex("a")).toEqual(lexerOKResult([name("a", interval(0, 0))])));
        it("classifies a single number as a constant", () => expect(lex("1")).toEqual(lexerOKResult([number(1, "1", interval(0, 0))])));
        it("classifies a single-letter string as a string", () => expect(lex('"a"')).toEqual(lexerOKResult([string("a", '"a"', interval(0, 2))])));
        describe("strings with weird traits", () => {
            it("errors on string with no end", () =>
                expect(lex('"')).toEqual(lexerFailedResult([new ZircoSyntaxError(ZircoSyntaxErrorTypes.UnclosedString, interval(0, 0), {})])));
            it("should error provided a non-closed string with an escape", () =>
                expect(lex('"a\\')).toEqual(lexerFailedResult([new ZircoSyntaxError(ZircoSyntaxErrorTypes.UnclosedString, interval(2, 2), {})])));
            it("escaped EOF", () =>
                expect(lex('"\\"')).toEqual(lexerFailedResult([new ZircoSyntaxError(ZircoSyntaxErrorTypes.UnclosedString, interval(0, 2), {})])));
            it("works with escaped quote", () => expect(lex('"\\""')).toEqual(lexerOKResult([string('"', '"\\""', interval(0, 3))])));
        });
        describe("numerical constant types", () => {
            it("classifies a decimal number as a constant", () => expect(lex("111")).toEqual(lexerOKResult([number(111, "111", interval(0, 2))])));
            it("classifies a hexadecimal number as a constant", () =>
                expect(lex("0xFF")).toEqual(lexerOKResult([number(0xff, "0xFF", interval(0, 3))])));
            it("classifies a binary number as a constant", () => expect(lex("0b11")).toEqual(lexerOKResult([number(0b11, "0b11", interval(0, 3))])));
            it("classifies a number with a decimal as a constant", () =>
                expect(lex("1.3")).toEqual(lexerOKResult([number(1.3, "1.3", interval(0, 2))])));
            it("should error when given a non-binary value in a binary constant", () =>
                expect(lex("0b2")).toEqual(
                    lexerFailedResult([
                        new ZircoSyntaxError(ZircoSyntaxErrorTypes.NumberInvalidCharacter, interval(2, 2), {
                            invalidCharacter: "2",
                            typeOfLiteral: "binary"
                        })
                    ])
                ));
            it("should error given a Z in a hex", () =>
                expect(lex("0xZ")).toEqual(
                    lexerFailedResult([
                        new ZircoSyntaxError(ZircoSyntaxErrorTypes.NumberInvalidCharacter, interval(2, 2), {
                            invalidCharacter: "Z",
                            typeOfLiteral: "hexadecimal"
                        })
                    ])
                ));
        });
        it("operator", () => expect(lex("+")).toEqual(lexerOKResult([plus(interval(0, 0))])));
    });
    describe("whitespace trimming", () => {
        // In this case, it's expected that multiple spaces are merged and start/end indicate them safely.
        it("one space between NAME tokens", () => expect(lex("a b")).toEqual(lexerOKResult([name("a", interval(0, 0)), name("b", interval(2, 2))])));
        it("space between CONSTANT_NUMBERs", () =>
            expect(lex("1 2")).toEqual(lexerOKResult([number(1, "1", interval(0, 0)), number(2, "2", interval(2, 2))])));
        it("space between hexadecimal CONSTANT_NUMBERs", () =>
            expect(lex("0xF 0xF")).toEqual(lexerOKResult([number(0xf, "0xF", interval(0, 2)), number(0xf, "0xF", interval(4, 6))])));
        it("space between STRINGs", () =>
            expect(lex('"a" "b"')).toEqual(lexerOKResult([string("a", '"a"', interval(0, 2)), string("b", '"b"', interval(4, 6))])));
        it("one tab between tokens", () => expect(lex("a\tb")).toEqual(lexerOKResult([name("a", interval(0, 0)), name("b", interval(2, 2))])));
        it("one newline between tokens", () => expect(lex("a\nb")).toEqual(lexerOKResult([name("a", interval(0, 0)), name("b", interval(2, 2))])));
        it("multiple spaces between tokens", () =>
            expect(lex("a  b")).toEqual(lexerOKResult([name("a", interval(0, 0)), name("b", interval(3, 3))])));
    });
    describe("more complex cases", () => {
        it("identifier with a number", () => expect(lex("a1")).toEqual(lexerOKResult([name("a1", interval(0, 1))])));
        it("sequential non-operator symbols are separate", () =>
            expect(lex("$$")).toEqual(lexerOKResult([other("$", interval(0, 0)), other("$", interval(1, 1))])));
        it("letter in a number", () =>
            expect(lex("1a")).toEqual(
                lexerFailedResult([
                    new ZircoSyntaxError(ZircoSyntaxErrorTypes.NumberInvalidCharacter, interval(1, 1), {
                        invalidCharacter: "a",
                        typeOfLiteral: "decimal"
                    })
                ])
            ));
        it("no whitespace change in token type", () =>
            expect(lex("a+b")).toEqual(lexerOKResult([name("a", interval(0, 0)), plus(interval(1, 1)), name("b", interval(2, 2))])));
        it("whitespace change in token type", () =>
            expect(lex("a + b")).toEqual(lexerOKResult([name("a", interval(0, 0)), plus(interval(2, 2)), name("b", interval(4, 4))])));
        it("multiple sequential decimals should fail", () =>
            expect(lex("1..")).toEqual(
                lexerFailedResult([new ZircoSyntaxError(ZircoSyntaxErrorTypes.NumberMultipleDecimalPoints, interval(0, 2), { n: 2 })])
            ));
        it("multiple decimals should fail", () =>
            expect(lex("1.2.")).toEqual(
                lexerFailedResult([new ZircoSyntaxError(ZircoSyntaxErrorTypes.NumberMultipleDecimalPoints, interval(0, 3), { n: 2 })])
            ));
        it("opening but not a value for a constant number", () =>
            expect(lex("0x")).toEqual(
                lexerFailedResult([
                    new ZircoSyntaxError(ZircoSyntaxErrorTypes.NumberPrefixWithNoValue, interval(0, 1), { typeOfLiteral: "hexadecimal" })
                ])
            ));
        it("sequential strings", () =>
            expect(lex('"a""b"')).toEqual(lexerOKResult([string("a", '"a"', interval(0, 2)), string("b", '"b"', interval(3, 5))])));
        it("string then identifier", () =>
            expect(lex('"a"b')).toEqual(lexerOKResult([string("a", '"a"', interval(0, 2)), name("b", interval(3, 3))])));
        it("identifier then string", () =>
            expect(lex('a"b"')).toEqual(lexerOKResult([name("a", interval(0, 0)), string("b", '"b"', interval(1, 3))])));

        it("underscores in numbers", () => expect(lex("1_2")).toEqual(lexerOKResult([number(12, "1_2", interval(0, 2))])));
    });

    describe("comments", () => {
        describe("single-line", () => {
            it("simple single-line on its own (w/ space)", () => expect(lex("// a")).toEqual(lexerOKResult([])));
            it("simple single-line on its own (w/o space)", () => expect(lex("//a")).toEqual(lexerOKResult([])));
            it("simple single-line with trailing space", () => expect(lex("// a ")).toEqual(lexerOKResult([])));
            it("simple single line with token before", () => expect(lex("a// b")).toEqual(lexerOKResult([name("a", interval(0, 0))])));
            it("simple single line with token before (+ space)", () => expect(lex("a /// b")).toEqual(lexerOKResult([name("a", interval(0, 0))])));
        });
        describe("multi-line", () => {
            it("on its own", () => expect(lex("/*a*/")).toEqual(lexerOKResult([])));
            it("with token before", () => expect(lex("a/*a*/")).toEqual(lexerOKResult([name("a", interval(0, 0))])));
            it("with token after", () => expect(lex("/*a*/a")).toEqual(lexerOKResult([name("a", interval(5, 5))])));
            it("with token before and after", () =>
                expect(lex("a/*a*/a")).toEqual(lexerOKResult([name("a", interval(0, 0)), name("a", interval(6, 6))])));
            it("with nesting", () => expect(lex("/*a/*a*/a*/")).toEqual(lexerOKResult([])));
            it("unclosed", () =>
                expect(lex("/*a")).toEqual(
                    lexerFailedResult([new ZircoSyntaxError(ZircoSyntaxErrorTypes.UnclosedBlockComment, interval(0, 2), {})])
                ));
            it("unclosed (nested)", () =>
                expect(lex("/*a/*a")).toEqual(
                    lexerFailedResult([new ZircoSyntaxError(ZircoSyntaxErrorTypes.UnclosedBlockComment, interval(0, 5), {})])
                ));
            it("newline case", () => expect(lex("a\n//a\na")).toEqual(lexerOKResult([name("a", interval(0, 0)), name("a", interval(6, 6))])));
            it("block comment start marker within a line-comment", () => expect(lex("///*")).toEqual(lexerOKResult([])));
            it("un-started block comment end", () => expect(lex("*/")).toEqual(lexerOKResult([star(interval(0, 0)), slash(interval(1, 1))])));
        });
    });

    describe("panic", () => {
        it("separated by space", () =>
            expect(lex("0xZ 0b2")).toEqual(
                lexerFailedResult([
                    new ZircoSyntaxError(ZircoSyntaxErrorTypes.NumberInvalidCharacter, interval(0, 2), {
                        invalidCharacter: "Z",
                        typeOfLiteral: "hexadecimal"
                    }),
                    new ZircoSyntaxError(ZircoSyntaxErrorTypes.NumberInvalidCharacter, interval(3, 5), {
                        invalidCharacter: "2",
                        typeOfLiteral: "binary"
                    })
                ])
            ));
        it("string follows error", () =>
            expect(lex('0xZ"foo bar"')).toEqual(
                lexerFailedResult([
                    new ZircoSyntaxError(ZircoSyntaxErrorTypes.NumberInvalidCharacter, interval(0, 2), {
                        invalidCharacter: "Z",
                        typeOfLiteral: "hexadecimal"
                    })
                ])
            ));
        it("unclosed string follows error", () =>
            expect(lex('0xZ"foo bar')).toEqual(
                lexerFailedResult([
                    new ZircoSyntaxError(ZircoSyntaxErrorTypes.NumberInvalidCharacter, interval(0, 2), {
                        invalidCharacter: "Z",
                        typeOfLiteral: "hexadecimal"
                    }),
                    new ZircoSyntaxError(ZircoSyntaxErrorTypes.UnclosedString, interval(3, 9), {})
                ])
            ));
    });

    describe("operators and such", () => {
        const cases: [string, (position: Interval) => TokenWithoutValue<TokenTypeWithoutValue>, string][] = [
            ["+", plus, "plus"],
            ["-", minus, "minus"],
            ["*", star, "star"],
            ["/", slash, "slash"],
            ["%", percent, "percent"],
            ["=", equals, "equals"],
            ["!", exclamation, "exclamation"],
            ["<", lessThan, "lessThan"],
            [">", greaterThan, "greaterThan"],
            ["(", leftParen, "leftParen"],
            [")", rightParen, "rightParen"],
            ["{", leftBrace, "leftBrace"],
            ["}", rightBrace, "rightBrace"],
            ["[", leftBracket, "leftBracket"],
            ["]", rightBracket, "rightBracket"],
            [",", comma, "comma"],
            [";", semicolon, "semicolon"],
            [":", colon, "colon"],
            [".", dot, "dot"],
            ["==", doubleEquals, "doubleEquals"],
            ["!=", bangEquals, "bangEquals"],
            ["<=", lessEquals, "lessEquals"],
            [">=", greaterEquals, "greaterEquals"],
            ["+=", plusEquals, "plusEquals"],
            ["-=", minusEquals, "minusEquals"],
            ["*=", starEquals, "starEquals"],
            ["/=", slashEquals, "slashEquals"],
            ["++", doublePlus, "doublePlus"],
            ["--", doubleMinus, "doubleMinus"],
            ["&&", doubleAmpersand, "doubleAmpersand"],
            ["||", doublePipe, "doublePipe"],
            ["**", doubleStar, "doubleStar"],
            ["<<", doubleLessThan, "doubleLessThan"],
            [">>", doubleGreaterThan, "doubleGreaterThan"],
            ["->", minusGreaterThan, "minusGreaterThan"]
        ];

        for (const [input, builder, name] of cases)
            it(name, () => expect(lex(input)).toEqual(lexerOKResult([builder(interval(0, input.length - 1))])));
    });
});
