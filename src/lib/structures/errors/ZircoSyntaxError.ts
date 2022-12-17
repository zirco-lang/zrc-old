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

import type { StringPosition } from "src/lexer/strSplit";

export enum ZircoSyntaxErrorTypes {
    /** Lexer error (STRING token): Caused when string is missing a closing quote */
    LEXER_STRING_UNCLOSED,

    /** Lexer error (STRING token): Caused when string has an escape before EOF */
    LEXER_STRING_ESCAPE_EOF,

    /** Lexer error (CONSTANT_NUMBER token): More than one decimal point */
    LEXER_NUMBER_MULTIPLE_DECIMALS,

    /** Lexer error (CONSTANT_NUMBER token): Type prefix without a value */
    LEXER_NUMBER_TYPE_PREFIX_NO_VALUE,

    /** Lexer error (CONSTANT_NUMBER token): Things like 0b1F or 0xZ */
    LEXER_NUMBER_INVALID_CHARACTER
}

/** Represents a syntax error. */
export default class ZircoSyntaxError extends Error {
    /** The positioning information for this error. */
    public position: StringPosition;
    /** A ZircoSyntaxErrorType that represents the type code of this error. */
    public type: ZircoSyntaxErrorTypes;
    // assigned by super()
    public message!: keyof typeof ZircoSyntaxErrorTypes;

    public constructor(type: ZircoSyntaxErrorTypes, position: StringPosition) {
        super(ZircoSyntaxErrorTypes[type]);
        this.type = type;
        this.name = "ZircoSyntaxError";
        this.position = position;
    }
}
