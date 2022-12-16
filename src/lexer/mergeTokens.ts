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

import ZircoSyntaxError, { ZircoSyntaxErrorTypes } from '../lib/structures/errors/ZircoSyntaxError';
import type { PositionedString, StringPosition } from './strSplit';

/** Represents all possible types for a Token. */
export enum TokenTypes {
    /** Any identifier or keyword. */
    NAME,
    /** Any numerical constant. */
    CONSTANT_NUMBER,
    /** A string. */
    STRING,
    /** An operator or syntax component */
    OPERATOR,
    /** Anything else */
    OTHER
}
/** Describes a Token's data packet. */
export interface TokenData {
    type: TokenTypes;
    position: StringPosition;
}
/** Is a token. Wow. */
export type Token = [string, TokenData];

export default function mergeTokens(input: PositionedString[]): Token[] {
    const output: Token[] = [];
    for (let i = 0; i < input.length; i++) {
        let value = input[i];

        // Welcome to the chaos that is Zirco's lexer.
        // The goal here is to take the input source character list
        // and output a list of tokens.
        //
        // Tokens can be started and ended in a few ways.
        // There is STRING types, which start and end with "
        // There is NAMEs, which are any sequence of letters
        // There is CONSTANT_NUMBERs, which are simply that -- numbers.
        // and finally, OTHER, which is operators etc.

        if (/\s/.test(value[0])) continue; // Skip whitespace

        // Let's start with the easiest and probably most important. Strings.
        // Strings are started and ended with " and can contain any character except for
        // a double quote (unless escaped with a backslash)

        // If the first character is a ", then we know it's a string.
        if (value[0] === '"') {
            let str = '';
            const start = value[1].start;

            if (i + 1 >= input.length)
                throw new ZircoSyntaxError(ZircoSyntaxErrorTypes.LEXER_STRING_UNCLOSED, {
                    start,
                    end: i + 1
                });
            value = input[++i];
            // We need to loop through the string until we find the end.
            while (value[0] !== '"') {
                if (value[0] === '\\') {
                    // This will add the next character to the string, regardless of what it is, even if it's a ".
                    str += value[0];
                    if (i + 1 >= input.length)
                        throw new ZircoSyntaxError(ZircoSyntaxErrorTypes.LEXER_STRING_ESCAPE_EOF, { start: value[1].start, end: value[1].end });
                    value = input[++i];
                }

                str += value[0];
                if (i + 1 >= input.length) throw new ZircoSyntaxError(ZircoSyntaxErrorTypes.LEXER_STRING_UNCLOSED, { start, end: value[1].end });
                value = input[++i];
            }
            // We found the end of the string. Let's add it to the output.
            output.push([`"${str}"`, { type: TokenTypes.STRING, position: { start, end: value[1].end } }]);
            continue;
        }

        // Next up: Numbers.
        // Numbers are pretty simple. They're just a sequence of numbers (duh!)
        // ^^ copilot wrote this, I think it's on drugs.
        // Anyway. We can classify two main "styles" of numbers.
        // "Direct" constants e.g. 123, or
        // "Prefixed" constants like 0xFF.
        // More specific comes first, so let's start with prefixed.
        // We only support 0b and 0d prefixes, so we can first check for a 0.
        if (value[0] === '0' && i + 1 < input.length && (input[i + 1][0] === 'b' || input[i + 1][0] === 'x')) {
            let str = '0';
            const start = value[1].start;
            value = input[++i];
            str += value[0];
            if (i + 1 >= input.length)
                throw new ZircoSyntaxError(ZircoSyntaxErrorTypes.LEXER_NUMBER_TYPE_PREFIX_NO_VALUE, { start: value[1].start, end: value[1].end });
            const matchReg = value[0] === 'b' ? /[01]/ : /[0-9a-fA-F]/;
            while (/[a-zA-Z0-9]/.test(input[i + 1][0])) {
                value = input[++i];
                if (!matchReg.test(value[0]))
                    throw new ZircoSyntaxError(ZircoSyntaxErrorTypes.LEXER_NUMBER_INVALID_CHARACTER, { start: value[1].start, end: value[1].end });
                str += value[0];
                if (i + 1 >= input.length) break;
            }

            output.push([str, { type: TokenTypes.CONSTANT_NUMBER, position: { start, end: value[1].end } }]);
            continue;
        }
        // Non-prefixed numbers
        if (/\d/.test(value[0])) {
            let str = '';
            const start = value[1].start;
            let hasHadDecimal = false;
            while (/[^\s]/.test(value[0])) {
                if (/[^0-9._]/.test(value[0]))
                    throw new ZircoSyntaxError(ZircoSyntaxErrorTypes.LEXER_NUMBER_INVALID_CHARACTER, { start: value[1].start, end: value[1].end });
                if (value[0] === '.') {
                    // to prevent values like 1.2.3 from passing
                    if (hasHadDecimal)
                        throw new ZircoSyntaxError(ZircoSyntaxErrorTypes.LEXER_NUMBER_MULTIPLE_DECIMALS, {
                            start: value[1].start,
                            end: value[1].end
                        });
                    hasHadDecimal = true;
                }
                str += value[0];
                if (i + 1 >= input.length) break;
                value = input[++i];
            }
            if (i + 1 < input.length) value = input[--i]; // We went one too far, so let's go back.

            output.push([str, { type: TokenTypes.CONSTANT_NUMBER, position: { start, end: value[1].end } }]);
            continue;
        }

        // At this point, names shouldn't be too difficult.
        // Names are just a sequence of letters, numbers, and underscores.
        // They can't start with a number, though.
        if (/[a-zA-Z_]/.test(value[0])) {
            let str = '';
            const start = value[1].start;
            while (/[a-zA-Z0-9_]/.test(value[0])) {
                str += value[0];
                if (i + 1 >= input.length) break;
                value = input[++i];
            }
            if (i + 1 < input.length) value = input[--i]; // We went one too far, so let's go back.

            output.push([str, { type: TokenTypes.NAME, position: { start, end: value[1].end } }]);
            continue;
        }

        // Multi-character operators
        // These are operators that are more than one character long.
        // They are checked first, so that they don't get confused with
        // multiple single character operators.
        // Examples of these are ++, +=, ==, !=, etc.
        const multiCharOperators = ['==', '!=', '>=', '<=', '+=', '-=', '*=', '/=', '++', '--', '||', '&&', '<<', '>>', '**'];

        let didMatchAnyOperator = false;
        for (const op of multiCharOperators) {
            let didMatchCurrent = true;
            if (i + op.length - 1 >= input.length) continue; // We can't match this operator, it's too long.
            for (let j = 0; j < op.length; j++)
                // If the current character doesn't match the current operator, then we can skip this operator.
                if (input[i + j][0] !== op[j]) {
                    didMatchCurrent = false;
                    break;
                }

            if (didMatchCurrent) {
                // We found a match! Let's add it to the output.
                output.push([op, { type: TokenTypes.OPERATOR, position: { start: input[i][1].start, end: input[i + op.length - 1][1].end } }]);
                i += op.length - 1;
                didMatchAnyOperator = true;
                break;
            }
        }
        if (didMatchAnyOperator) continue;

        // Single-character operators
        // These are operators that are only one character long.
        // Examples of these are +, -, *, /, etc.
        const singleCharOperators = ['+', '-', '*', '/', '%', '=', '!', '<', '>', '(', ')', '{', '}', '[', ']', ',', ';', ':', '.'];

        if (singleCharOperators.includes(value[0])) {
            output.push([value[0], { type: TokenTypes.OPERATOR, position: value[1] }]);
            continue;
        }

        // Anything else is an OTHER
        output.push([value[0], { type: TokenTypes.OTHER, position: value[1] }]);
    }
    return output;
}
