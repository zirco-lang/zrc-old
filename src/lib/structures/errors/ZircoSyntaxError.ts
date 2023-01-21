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

import type { StringPosition } from "../../../lexer/lex";

export enum ZircoSyntaxErrorTypes {
    /**
     * An "unclosed" string occurs when there is an opening quote that is not
     * matched with a corresponding closing quote. This can also occur when
     * the closing quote is escaped.
     *
     * Caught by: Lexer
     */
    UnclosedString,

    /**
     * When a number token is discovered with multiple decimals, like "1.2.3"
     *
     * Caught by: Lexer
     */
    NumberMultipleDecimalPoints,

    /**
     * When a number token prefix like "0b" is discovered with no value after it.
     *
     * Caught by: Lexer
     */
    NumberPrefixWithNoValue,

    /**
     * An invalid character was discovered within a number (like 0xZ)
     *
     * Caught by: Lexer
     */
    NumberInvalidCharacter,

    /**
     * A block comment is left unclosed.
     *
     * Caught by: Lexer
     */
    UnclosedBlockComment
}

interface ZircoSyntaxErrorStringPrototypes {
    // @typescript-eslint/ban-types encourages us using Record<string, never> instead of {}
    [ZircoSyntaxErrorTypes.UnclosedString]: Record<string, never>;
    [ZircoSyntaxErrorTypes.NumberMultipleDecimalPoints]: { n: number };
    [ZircoSyntaxErrorTypes.NumberPrefixWithNoValue]: Record<string, never>;
    [ZircoSyntaxErrorTypes.NumberInvalidCharacter]: Record<string, never>;
    [ZircoSyntaxErrorTypes.UnclosedBlockComment]: Record<string, never>;
}

/** Represents a syntax error. */
export default class ZircoSyntaxError<T extends ZircoSyntaxErrorTypes> extends Error {
    public static strings: { [k in ZircoSyntaxErrorTypes]: (data: ZircoSyntaxErrorStringPrototypes[k]) => string } = {
        [ZircoSyntaxErrorTypes.UnclosedString]: () => "Unclosed string",
        [ZircoSyntaxErrorTypes.NumberMultipleDecimalPoints]: ({ n }) => `Number literal has multiple (${n}) decimal points`,
        [ZircoSyntaxErrorTypes.NumberPrefixWithNoValue]: () => `Number literal has a floating base prefix with no value after it`,
        // TODO: Show which character triggered the error?
        [ZircoSyntaxErrorTypes.NumberInvalidCharacter]: ({}) => `Invalid character in number literal`,
        [ZircoSyntaxErrorTypes.UnclosedBlockComment]: () => "Unclosed block comment"
    };

    /** The positioning information for this error. */
    public position: StringPosition;
    /** A ZircoSyntaxErrorType that represents the type code of this error. */
    public type: ZircoSyntaxErrorTypes;

    public constructor(type: ZircoSyntaxErrorTypes, position: StringPosition, args: ZircoSyntaxErrorStringPrototypes[T]) {
        super(ZircoSyntaxError.strings[type](args));
        this.type = type;
        this.name = "ZircoSyntaxError";
        this.position = position;
    }
}
