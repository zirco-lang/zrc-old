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
import type { Token, Tokens, TokenTypeWithoutValue, TokenWithoutValue } from "../../lexer/tokens";
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
const name = (name: string, position: Interval): Tokens[TokenTypes.Name] => ({ type: TokenTypes.Name, raw: name, value: name, position });
const number = (raw: string, position: Interval): Tokens[TokenTypes.Number] => ({ type: TokenTypes.Number, raw, position });
const string = (value: string, raw: string, position: Interval): Tokens[TokenTypes.String] => ({ type: TokenTypes.String, raw, value, position });

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

const other = (raw: string, position: Interval): Tokens[TokenTypes.Other] => ({ type: TokenTypes.Other, raw, position });

// FIXME: Jest does not check deeper into errors other than the 'message' property.
// Can we add a custom matcher to also check error positioning?

describe("lex", () => {
    it("returns none on an empty input", () => expect(lex("")).toEqual(lexerOKResult([])));

    describe("strings", () => {
        it("properly handles a single-letter string", () => expect(lex('"a"')).toEqual(lexerOKResult([string("a", '"a"', interval(0, 2))])));
        it("properly handles escapes", () => expect(lex('"h\\"ello"')).toEqual(lexerOKResult([string('h"ello', '"h\\"ello"', interval(0, 8))])));

        it("fails when passed just an opening quote", () =>
            expect(lex('"')).toEqual(lexerFailedResult([new ZircoSyntaxError(ZircoSyntaxErrorTypes.UnclosedString, interval(0, 0), {})])));
        it("fails when escaped just before EOF", () =>
            expect(lex('"\\')).toEqual(lexerFailedResult([new ZircoSyntaxError(ZircoSyntaxErrorTypes.UnclosedString, interval(0, 1), {})])));
        it("fails when unclosed", () =>
            expect(lex('"hello world')).toEqual(
                lexerFailedResult([new ZircoSyntaxError(ZircoSyntaxErrorTypes.UnclosedString, interval(0, 11), {})])
            ));
        it("works with sequential strings", () =>
            expect(lex('"a""b"')).toEqual(lexerOKResult([string("a", '"a"', interval(0, 2)), string("b", '"b"', interval(3, 5))])));

        it("identifier then string", () =>
            expect(lex('a"b"')).toEqual(lexerOKResult([name("a", interval(0, 0)), string("b", '"b"', interval(1, 3))])));
        it("string then identifier", () =>
            expect(lex('"a"b')).toEqual(lexerOKResult([string("a", '"a"', interval(0, 2)), name("b", interval(3, 3))])));
    });

    describe("numbers", () => {
        describe("hexadecimal literals", () => {
            it("properly handles a single-digit hex literal", () => expect(lex("0x1")).toEqual(lexerOKResult([number("0x1", interval(0, 2))])));
            it("properly handles a multi-digit hex literal", () => expect(lex("0x123")).toEqual(lexerOKResult([number("0x123", interval(0, 4))])));
            it("accepts underscores within hex literals", () => expect(lex("0x1_2_3")).toEqual(lexerOKResult([number("0x1_2_3", interval(0, 6))])));

            it("fails when passed just an opening 0x", () =>
                expect(lex("0x")).toEqual(
                    lexerFailedResult([
                        new ZircoSyntaxError(ZircoSyntaxErrorTypes.NumberPrefixWithNoValue, interval(0, 1), { typeOfLiteral: "hexadecimal" })
                    ])
                ));
            it("fails when passed a Z within a hexadecimal literal", () =>
                expect(lex("0xZ")).toEqual(
                    lexerFailedResult([
                        new ZircoSyntaxError(ZircoSyntaxErrorTypes.NumberInvalidCharacter, interval(2, 2), {
                            typeOfLiteral: "hexadecimal",
                            invalidCharacter: "Z"
                        })
                    ])
                ));
        });

        describe("binary literals", () => {
            it("properly handles a single-digit binary literal", () => expect(lex("0b1")).toEqual(lexerOKResult([number("0b1", interval(0, 2))])));
            it("properly handles a multi-digit binary literal", () => expect(lex("0b101")).toEqual(lexerOKResult([number("0b101", interval(0, 4))])));
            it("accepts underscores within binary literals", () =>
                expect(lex("0b1_0_1")).toEqual(lexerOKResult([number("0b1_0_1", interval(0, 6))])));

            it("fails when passed just an opening 0b", () =>
                expect(lex("0b")).toEqual(
                    lexerFailedResult([
                        new ZircoSyntaxError(ZircoSyntaxErrorTypes.NumberPrefixWithNoValue, interval(0, 1), { typeOfLiteral: "binary" })
                    ])
                ));
            it("fails when passed a 2 within a binary literal", () =>
                expect(lex("0b2")).toEqual(
                    lexerFailedResult([
                        new ZircoSyntaxError(ZircoSyntaxErrorTypes.NumberInvalidCharacter, interval(2, 2), {
                            typeOfLiteral: "binary",
                            invalidCharacter: "2"
                        })
                    ])
                ));
        });

        describe("decimal literals", () => {
            it("properly handles a single-digit decimal literal", () => expect(lex("1")).toEqual(lexerOKResult([number("1", interval(0, 0))])));
            it("properly handles a multi-digit decimal literal", () => expect(lex("123")).toEqual(lexerOKResult([number("123", interval(0, 2))])));
            it("accepts underscores within decimal literals", () => expect(lex("1_2_3")).toEqual(lexerOKResult([number("1_2_3", interval(0, 4))])));
            it("properly handles a decimal literal with a decimal point", () =>
                expect(lex("1.23")).toEqual(lexerOKResult([number("1.23", interval(0, 3))])));

            it("fails when passed a Z within a decimal literal", () =>
                expect(lex("1Z")).toEqual(
                    lexerFailedResult([
                        new ZircoSyntaxError(ZircoSyntaxErrorTypes.NumberInvalidCharacter, interval(1, 1), {
                            typeOfLiteral: "decimal",
                            invalidCharacter: "Z"
                        })
                    ])
                ));
            it("fails when a number has multiple decimal points", () =>
                expect(lex("1.2.3")).toEqual(
                    lexerFailedResult([new ZircoSyntaxError(ZircoSyntaxErrorTypes.NumberMultipleDecimalPoints, interval(1, 3), { n: 2 })])
                ));
        });
    });

    describe("whitespace trimming", () => {
        it("nothing but spaces", () => expect(lex("      ")).toEqual(lexerOKResult([])));

        it("one space", () => expect(lex("a b")).toEqual(lexerOKResult([name("a", interval(0, 0)), name("b", interval(2, 2))])));
        it("many spaces", () => expect(lex("a  b")).toEqual(lexerOKResult([name("a", interval(0, 0)), name("b", interval(3, 3))])));
        it("tabs", () => expect(lex("a\tb")).toEqual(lexerOKResult([name("a", interval(0, 0)), name("b", interval(2, 2))])));
        it("newline", () => expect(lex("a\nb")).toEqual(lexerOKResult([name("a", interval(0, 0)), name("b", interval(2, 2))])));

        it("newline within string", () => expect(lex('"a\nb"')).toEqual(lexerOKResult([string("a\nb", '"a\nb"', interval(0, 4))])));
    });

    describe("identifiers", () => {
        it("single letter", () => expect(lex("a")).toEqual(lexerOKResult([name("a", interval(0, 0))])));
        it("multiple letters", () => expect(lex("abc")).toEqual(lexerOKResult([name("abc", interval(0, 2))])));
        it("contains numbers", () => expect(lex("a1b2c3")).toEqual(lexerOKResult([name("a1b2c3", interval(0, 5))])));
        it("contains underscores", () => expect(lex("a_b_c")).toEqual(lexerOKResult([name("a_b_c", interval(0, 4))])));
    });

    describe("comments", () => {
        describe("single-line", () => {
            it("on its own (w/ space)", () => expect(lex("// a")).toEqual(lexerOKResult([])));
            it("on its own (w/o space)", () => expect(lex("//a")).toEqual(lexerOKResult([])));
            it("with trailing space", () => expect(lex("// a ")).toEqual(lexerOKResult([])));
            it("with token before", () => expect(lex("a// b")).toEqual(lexerOKResult([name("a", interval(0, 0))])));
            it("with token before (+ space)", () => expect(lex("a // b")).toEqual(lexerOKResult([name("a", interval(0, 0))])));
        });

        describe("multi-line", () => {
            it("no newline", () => expect(lex("/* a */")).toEqual(lexerOKResult([])));
            it("newline", () => expect(lex("/* a\nb*/")).toEqual(lexerOKResult([])));
            it("within string", () => expect(lex('"/* a */"')).toEqual(lexerOKResult([string("/* a */", '"/* a */"', interval(0, 8))])));

            it("nested", () => expect(lex("/* a /* b */ c */")).toEqual(lexerOKResult([])));
            it("unclosed", () =>
                expect(lex("/* a")).toEqual(
                    lexerFailedResult([new ZircoSyntaxError(ZircoSyntaxErrorTypes.UnclosedBlockComment, interval(0, 3), {})])
                ));
            it("unclosed + nesting", () =>
                expect(lex("/* a /* b */")).toEqual(
                    lexerFailedResult([new ZircoSyntaxError(ZircoSyntaxErrorTypes.UnclosedBlockComment, interval(0, 3), {})])
                ));
        });
    });

    describe("panic", () => {
        it("separated by space", () =>
            expect(lex("0xZZ 0b2")).toEqual(
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

    it("Dollar signs are other", () => expect(lex("$")).toEqual(lexerOKResult([other("$", interval(0, 0))])));
});
