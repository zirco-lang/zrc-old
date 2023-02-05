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

import type Interval from "../lib/types/Interval";

/** Represents all possible types for a Token. */
export enum TokenTypes {
    /** Any identifier or keyword. */
    Name,
    /** Any numerical constant. */
    Number,
    /** A string. */
    String,
    /** The `+` token */
    Plus,
    /** The `-` token */
    Minus,
    /** The `*` token */
    Star,
    /** The `/` token */
    Slash,
    /** The `%` token */
    Percent,
    /** The `=` token */
    Equals,
    /** The `!` token */
    Exclamation,
    /** The `<` token */
    LessThan,
    /** The `>` token */
    GreaterThan,
    /** The `(` token */
    LeftParen,
    /** The `)` token */
    RightParen,
    /** The `{` token */
    LeftBrace,
    /** The `}` token */
    RightBrace,
    /** The `[` token */
    LeftBracket,
    /** The `]` token */
    RightBracket,
    /** The `,` token */
    Comma,
    /** The `;` token */
    Semicolon,
    /** The `:` token */
    Colon,
    /** The `.` token */
    Dot,
    /** The `==` token */
    EqualsEquals,
    /** The `!=` token */
    ExclamationEquals,
    /** The `>=` token */
    GreaterThanEquals,
    /** The `<=` token */
    LessThanEquals,
    /** The `+=` token */
    PlusEquals,
    /** The `-=` token */
    MinusEquals,
    /** The `*=` token */
    StarEquals,
    /** The `/=` token */
    SlashEquals,
    /** The `++` token */
    PlusPlus,
    /** The `--` token */
    MinusMinus,
    /** The `||` token */
    PipePipe,
    /** The `&&` token */
    AmpersandAmpersand,
    /** The `<<` token */
    LessThanLessThan,
    /** The `>>` token */
    GreaterThanGreaterThan,
    /** The `**` token */
    StarStar,
    /** The `->` token */
    MinusGreaterThan,
    /** Anything else */
    Other
}

/** Describes a Token's data packet. */
export interface BaseToken {
    type: TokenTypes;
    raw: string;
    position: Interval;
}

interface TokenWithoutValue<T extends TokenTypes> extends BaseToken {
    type: T;
}

interface TokenWithValue<T extends TokenTypes, V> extends TokenWithoutValue<T> {
    value: V;
}

export type NameToken = TokenWithValue<TokenTypes.Name, string>;
export type NumberToken = TokenWithValue<TokenTypes.Number, number>;
export type StringToken = TokenWithValue<TokenTypes.String, string>;
export type PlusToken = TokenWithoutValue<TokenTypes.Plus>;
export type MinusToken = TokenWithoutValue<TokenTypes.Minus>;
export type StarToken = TokenWithoutValue<TokenTypes.Star>;
export type SlashToken = TokenWithoutValue<TokenTypes.Slash>;
export type PercentToken = TokenWithoutValue<TokenTypes.Percent>;
export type EqualsToken = TokenWithoutValue<TokenTypes.Equals>;
export type ExclamationToken = TokenWithoutValue<TokenTypes.Exclamation>;
export type LessThanToken = TokenWithoutValue<TokenTypes.LessThan>;
export type GreaterThanToken = TokenWithoutValue<TokenTypes.GreaterThan>;
export type LeftParenToken = TokenWithoutValue<TokenTypes.LeftParen>;
export type RightParenToken = TokenWithoutValue<TokenTypes.RightParen>;
export type LeftBraceToken = TokenWithoutValue<TokenTypes.LeftBrace>;
export type RightBraceToken = TokenWithoutValue<TokenTypes.RightBrace>;
export type LeftBracketToken = TokenWithoutValue<TokenTypes.LeftBracket>;
export type RightBracketToken = TokenWithoutValue<TokenTypes.RightBracket>;
export type CommaToken = TokenWithoutValue<TokenTypes.Comma>;
export type SemicolonToken = TokenWithoutValue<TokenTypes.Semicolon>;
export type ColonToken = TokenWithoutValue<TokenTypes.Colon>;
export type DotToken = TokenWithoutValue<TokenTypes.Dot>;
export type EqualsEqualsToken = TokenWithoutValue<TokenTypes.EqualsEquals>;
export type ExclamationEqualsToken = TokenWithoutValue<TokenTypes.ExclamationEquals>;
export type GreaterThanEqualsToken = TokenWithoutValue<TokenTypes.GreaterThanEquals>;
export type LessThanEqualsToken = TokenWithoutValue<TokenTypes.LessThanEquals>;
export type PlusEqualsToken = TokenWithoutValue<TokenTypes.PlusEquals>;
export type MinusEqualsToken = TokenWithoutValue<TokenTypes.MinusEquals>;
export type StarEqualsToken = TokenWithoutValue<TokenTypes.StarEquals>;
export type SlashEqualsToken = TokenWithoutValue<TokenTypes.SlashEquals>;
export type PlusPlusToken = TokenWithoutValue<TokenTypes.PlusPlus>;
export type MinusMinusToken = TokenWithoutValue<TokenTypes.MinusMinus>;
export type PipePipeToken = TokenWithoutValue<TokenTypes.PipePipe>;
export type AmpersandAmpersandToken = TokenWithoutValue<TokenTypes.AmpersandAmpersand>;
export type LessThanLessThanToken = TokenWithoutValue<TokenTypes.LessThanLessThan>;
export type GreaterThanGreaterThanToken = TokenWithoutValue<TokenTypes.GreaterThanGreaterThan>;
export type StarStarToken = TokenWithoutValue<TokenTypes.StarStar>;
export type MinusGreaterThanToken = TokenWithoutValue<TokenTypes.MinusGreaterThan>;
export type OtherToken = TokenWithoutValue<TokenTypes.Other>;

export type Token =
    | NameToken
    | NumberToken
    | StringToken
    | PlusToken
    | MinusToken
    | StarToken
    | SlashToken
    | PercentToken
    | EqualsToken
    | ExclamationToken
    | LessThanToken
    | GreaterThanToken
    | LeftParenToken
    | RightParenToken
    | LeftBraceToken
    | RightBraceToken
    | LeftBracketToken
    | RightBracketToken
    | CommaToken
    | SemicolonToken
    | ColonToken
    | DotToken
    | EqualsEqualsToken
    | ExclamationEqualsToken
    | GreaterThanEqualsToken
    | LessThanEqualsToken
    | PlusEqualsToken
    | MinusEqualsToken
    | StarEqualsToken
    | SlashEqualsToken
    | PlusPlusToken
    | MinusMinusToken
    | PipePipeToken
    | AmpersandAmpersandToken
    | LessThanLessThanToken
    | GreaterThanGreaterThanToken
    | StarStarToken
    | MinusGreaterThanToken
    | OtherToken;
