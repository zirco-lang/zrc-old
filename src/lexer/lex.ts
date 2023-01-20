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

import ZircoSyntaxError, { ZircoSyntaxErrorTypes } from "../lib/structures/errors/ZircoSyntaxError";

/** Represents all possible types for a Token. */
export enum TokenTypes {
    /** Any identifier or keyword. */
    Name,
    /** Any numerical constant. */
    Number,
    /** A string. */
    String,
    /** An operator or syntax component */
    Operator,
    /** Anything else */
    Other
}

export interface StringPosition {
    start: number;
    end: number;
}

/** Describes a Token's data packet. */
export interface TokenData {
    type: TokenTypes;
    position: StringPosition;
}
/** Is a token. Wow. */
export type Token = [string, TokenData];

export default function lex(input: string): Token[] {
    const output: Token[] = [];
    for (let i = 0, length = input.length; i < length; i++) {
        let char = input[i];

        // Welcome to the chaos that is Zirco's lexer.
        // The goal here is to take the input source character list
        // and output a list of tokens.
        //
        // Tokens can be started and ended in a few ways.
        // There is STRING types, which start and end with "
        // There is NAMEs, which are any sequence of letters
        // There is CONSTANT_NUMBERs, which are simply that -- numbers.
        // and finally, OTHER, which is operators etc.

        if (/\s/.test(char)) continue; // Skip whitespace

        // Let's start with the easiest and probably most important. Strings.
        // Strings are started and ended with " and can contain any character except for
        // a double quote (unless escaped with a backslash)

        // If the first character is a ", then we know it's a string.
        if (char === '"') {
            let str = "";
            const start = i;

            if (i + 1 >= length)
                throw new ZircoSyntaxError(ZircoSyntaxErrorTypes.UnclosedString, {
                    start,
                    end: i + 1
                });

            char = input[++i];

            // We need to loop through the string until we find the end.
            while (char !== '"') {
                if (char === "\\") {
                    // This will add the next character to the string, regardless of what it is, even if it's a ".
                    str += char;
                    if (i + 1 >= length) throw new ZircoSyntaxError(ZircoSyntaxErrorTypes.UnclosedString, { start: i, end: i + 1 });
                    char = input[++i];
                }

                str += char;

                if (i + 1 >= length) throw new ZircoSyntaxError(ZircoSyntaxErrorTypes.UnclosedString, { start, end: i + 1 });

                char = input[++i];
            }

            // We found the end of the string. Let's add it to the output.
            output.push([`"${str}"`, { type: TokenTypes.String, position: { start, end: i + 1 } }]);
            continue;
        }

        // Next up: Numbers.
        // Numbers are pretty simple. They're just a sequence of numbers (duh!)
        // ^^ copilot wrote this, I think it's on drugs.
        // Anyway. We can classify two main "styles" of numbers.
        // "Direct" constants e.g. 123, or
        // "Prefixed" constants like 0xFF.
        // More specific comes first, so let's start with prefixed.
        // We only support 0b and 0x prefixes, so we can first check for a 0.
        if (char === "0" && i + 1 < length && (input[i + 1] === "b" || input[i + 1] === "x")) {
            let str = "0";
            const start = i;
            char = input[++i];
            str += char;

            if (i + 1 >= length) throw new ZircoSyntaxError(ZircoSyntaxErrorTypes.NumberPrefixWithNoValue, { start: i, end: i + 1 });

            const matchReg = char === "b" ? /[01]/ : /[0-9a-fA-F]/;

            while (/[a-zA-Z0-9]/.test(input[i + 1])) {
                char = input[++i];

                if (!matchReg.test(char)) throw new ZircoSyntaxError(ZircoSyntaxErrorTypes.NumberInvalidCharacter, { start: i, end: i + 1 });

                str += char;
                if (i + 1 >= length) break;
            }

            output.push([str, { type: TokenTypes.Number, position: { start, end: i + 1 } }]);
            continue;
        }

        // Non-prefixed numbers
        if (/\d/.test(char)) {
            let str = "";
            const start = i;
            let hasHadDecimal = false;

            while (/[0-9A-Za-z._]/.test(char)) {
                if (/[^0-9._]/.test(char)) throw new ZircoSyntaxError(ZircoSyntaxErrorTypes.NumberInvalidCharacter, { start: i, end: i + 1 });

                if (char === ".") {
                    // to prevent values like 1.2.3 from passing
                    if (hasHadDecimal)
                        throw new ZircoSyntaxError(ZircoSyntaxErrorTypes.NumberMultipleDecimalPoints, {
                            start: i,
                            end: i + 1
                        });
                    hasHadDecimal = true;
                }

                str += char;
                if (i + 1 >= length) break;
                char = input[++i];
            }

            if (i + 1 < length) char = input[--i]; // We went one too far, so let's go back.

            output.push([str, { type: TokenTypes.Number, position: { start, end: i + 1 } }]);
            continue;
        }

        // Test single-line comments first
        if (char === "/" && input[i + 1] === "/") {
            do
                ++i; // Keep running forwards
            while (i < length && input[i] !== "\n"); // Until we hit a newline or EoF

            // EoF, we're done
            if (i >= length) break;
            else continue; // otherwise, just go to the next iteration
        }

        {
            // Then block comments
            const isBlockCommentOpening = () => input[i] + input[i + 1] === "/*",
                isBlockCommentClosing = () => input[i] + input[i + 1] === "*/";

            if (isBlockCommentOpening()) {
                const start = i;
                ++i; // Increment twice to prevent something like /*/ from counting (prevent the asterisk from being counted twice)

                let nest = 1;

                do {
                    // Keep running forwards
                    ++i;

                    // if we hit another block comment, increment the nest level and skip forwards
                    if (isBlockCommentOpening()) nest++;
                    // if we hit a closing group, decrement the nest level
                    else if (isBlockCommentClosing()) {
                        nest--;

                        // If we hit a */ group that closes the outermost block, exit
                        if (nest === 0) break;
                    }
                } while (i < length - 1); // Keep going until we hit EoF

                if (i >= length - 1)
                    throw new ZircoSyntaxError(ZircoSyntaxErrorTypes.UnclosedBlockComment, {
                        start,
                        end: i + 1
                    });
                // EoF
                else {
                    // next iteration, after skipping the current one (which would be the / character)
                    ++i;
                    continue;
                }
            }
        }

        // At this point, names shouldn't be too difficult.
        // Names are just a sequence of letters, numbers, and underscores.
        // They can't start with a number, though.
        if (/[a-zA-Z_]/.test(char)) {
            let str = "";
            const start = i;

            while (/[a-zA-Z0-9_]/.test(char)) {
                str += char;
                if (i + 1 >= length) break;
                char = input[++i];
            }

            if (i + 1 < length) char = input[--i]; // We went one too far, so let's go back.

            output.push([str, { type: TokenTypes.Name, position: { start, end: i + 1 } }]);
            continue;
        }

        // Multi-character operators
        // These are operators that are more than one character long.
        // They are checked first, so that they don't get confused with
        // multiple single character operators.
        // Examples of these are ++, +=, ==, !=, etc.
        const multiCharOperators = ["==", "!=", ">=", "<=", "+=", "-=", "*=", "/=", "++", "--", "||", "&&", "<<", ">>", "**", "->"];

        let didMatchAnyOperator = false;
        for (const op of multiCharOperators) {
            let didMatchCurrent = true;

            if (i + op.length - 1 >= length) continue; // We can't match this operator, it's too long.

            for (let j = 0; j < op.length; j++)
                // If the current character doesn't match the current operator, then we can skip this operator.
                if (input[i + j][0] !== op[j]) {
                    didMatchCurrent = false;
                    break;
                }

            if (didMatchCurrent) {
                // We found a match! Let's add it to the output.
                output.push([op, { type: TokenTypes.Operator, position: { start: i, end: i + op.length } }]);
                i += op.length - 1;
                didMatchAnyOperator = true;
                break;
            }
        }
        if (didMatchAnyOperator) continue;

        // Single-character operators
        // These are operators that are only one character long.
        // Examples of these are +, -, *, /, etc.
        const singleCharOperators = ["+", "-", "*", "/", "%", "=", "!", "<", ">", "(", ")", "{", "}", "[", "]", ",", ";", ":", "."];

        if (singleCharOperators.includes(char)) {
            output.push([char, { type: TokenTypes.Operator, position: { start: i, end: i + 1 } }]);
            continue;
        }

        // Anything else is an OTHER
        output.push([char, { type: TokenTypes.Other, position: { start: i, end: i + 1 } }]);
    }
    return output;
}
