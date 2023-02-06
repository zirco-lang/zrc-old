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

// Originally numbers also held values, but this was removed because the lexer should not need to be responsible
// about determining the value of a number literal, alongside the issues of large numbers not being passed to the
// parser correctly (& bigints are slow)
export type TokenTypeWithValue = TokenTypes.Name | TokenTypes.String;
export type TokenTypeWithoutValue = Exclude<TokenTypes, TokenTypeWithValue>;

export interface TokenWithoutValue<T extends TokenTypeWithoutValue> extends BaseToken {
    type: T;
}

export interface TokenWithValue<T extends TokenTypeWithValue, V> extends BaseToken {
    type: T;
    value: V;
}

export interface TokenTypeValues {
    [TokenTypes.Name]: string;
    [TokenTypes.String]: string;
}

export type ValueLessToken = TokenWithoutValue<TokenTypeWithoutValue>;
export type ValueToken = TokenWithValue<TokenTypeWithValue, TokenTypeValues[TokenTypeWithValue]>;
export type Token = ValueLessToken | ValueToken;

export type Tokens = {
    [k in TokenTypeWithoutValue]: TokenWithoutValue<k>;
} & {
    [k in TokenTypeWithValue]: TokenWithValue<k, TokenTypeValues[k]>;
};
