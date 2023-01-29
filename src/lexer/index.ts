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
import type Interval from "../lib/types/Interval";
import type { ZircoIssue, ZircoIssueTypes } from "../lib/types/ZircoIssue";

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

/** Describes a Token's data packet. */
export interface TokenData {
    type: TokenTypes;
    position: Interval;
}
/** Is a token. Wow. */
export type Token = [string, TokenData];

export interface FailedLexerOutput {
    ok: false;
    issues: ZircoIssue<ZircoIssueTypes>[];
    tokens: null;
}

export interface OKLexerOutput {
    ok: true;
    issues: [];
    tokens: Token[];
}

export type LexerOutput = FailedLexerOutput | OKLexerOutput;

export default function lex(input: string): LexerOutput {
    const tokens: Token[] = [];
    const issues: ZircoIssue<ZircoIssueTypes>[] = [];
    let i = 0;
    let previousI = -1;
    const length = input.length;

    /**
     * Puts the lexer into "panic mode." Call this function when encountering an error
     * to allow a best-effort mechanism at reaching the next token and proceeding.
     */
    function panic() {
        // Our goal is to synchronize to the next token.
        // This isn't always going to work 100% perfectly,
        // but we try our best.
        // TODO: Detect more types of token boundaries other than whitespace
        // To simplify, we'll call whitespace our one type of token boundary this
        // lexer can handle.
        while (/[^\s]/.test(input[i]) && i < length) i++;
    }

    function addIssue(issue: ZircoIssue<ZircoIssueTypes>) {
        issues.push(issue);
    }

    lexerLoop: for (; i < length; i++) {
        /* istanbul ignore next */
        if (previousI >= i)
            throw new Error(
                "Potential infinite loop detected in the lexer. This should never happen. Please create an issue on GitHub and include source code that replicates this issue."
            );
        previousI = i;

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

            if (i + 1 >= length) {
                addIssue(
                    new ZircoSyntaxError(
                        ZircoSyntaxErrorTypes.UnclosedString,
                        {
                            start,
                            end: i
                        },
                        {}
                    )
                );
                break;
            }

            char = input[++i];

            // We need to loop through the string until we find the end.
            while (char !== '"') {
                if (char === "\\") {
                    // This will add the next character to the string, regardless of what it is, even if it's a ".
                    str += char;
                    if (i + 1 >= length) {
                        addIssue(new ZircoSyntaxError(ZircoSyntaxErrorTypes.UnclosedString, { start: i, end: i }, {}));
                        break lexerLoop;
                    }
                    char = input[++i];
                }

                str += char;

                if (i + 1 >= length) {
                    addIssue(new ZircoSyntaxError(ZircoSyntaxErrorTypes.UnclosedString, { start, end: i }, {}));
                    break lexerLoop;
                }

                char = input[++i];
            }

            // We found the end of the string. Let's add it to the output.
            tokens.push([`"${str}"`, { type: TokenTypes.String, position: { start, end: i } }]);
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
            const typeOfLiteral = char === "x" ? "hexadecimal" : "binary";
            str += char;

            if (i + 1 >= length) {
                addIssue(new ZircoSyntaxError(ZircoSyntaxErrorTypes.NumberPrefixWithNoValue, { start: i, end: i }, { typeOfLiteral }));
                break lexerLoop;
            }

            const matchReg = char === "b" ? /[01]/ : /[0-9a-fA-F]/;

            while (/[a-zA-Z0-9]/.test(input[i + 1])) {
                char = input[++i];

                if (!matchReg.test(char)) {
                    addIssue(
                        new ZircoSyntaxError(
                            ZircoSyntaxErrorTypes.NumberInvalidCharacter,
                            { start: i, end: i },
                            { typeOfLiteral, invalidCharacter: char }
                        )
                    );
                    panic();
                    continue lexerLoop;
                }

                str += char;
                if (i + 1 >= length) break;
            }

            tokens.push([str, { type: TokenTypes.Number, position: { start, end: i } }]);
            continue;
        }

        // Non-prefixed numbers
        if (/\d/.test(char)) {
            let str = "";
            const start = i;
            let numberOfDecimalPointsEncountered = 0;

            while (/[0-9A-Za-z._]/.test(char)) {
                if (/[^0-9._]/.test(char)) {
                    addIssue(
                        new ZircoSyntaxError(
                            ZircoSyntaxErrorTypes.NumberInvalidCharacter,
                            { start: i, end: i },
                            { typeOfLiteral: "decimal", invalidCharacter: char }
                        )
                    );
                    panic();
                    continue lexerLoop;
                }

                if (char === ".") numberOfDecimalPointsEncountered++;

                str += char;
                if (i + 1 >= length) break;
                char = input[++i];
            }

            if (numberOfDecimalPointsEncountered > 1) {
                addIssue(
                    new ZircoSyntaxError(
                        ZircoSyntaxErrorTypes.NumberMultipleDecimalPoints,
                        {
                            start,
                            end: i
                        },
                        { n: numberOfDecimalPointsEncountered }
                    )
                );
                panic();
                continue;
            }

            if (i + 1 < length) char = input[--i]; // We went one too far, so let's go back.

            tokens.push([str, { type: TokenTypes.Number, position: { start, end: i } }]);
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

                if (i >= length - 1) {
                    addIssue(
                        new ZircoSyntaxError(
                            ZircoSyntaxErrorTypes.UnclosedBlockComment,
                            {
                                start,
                                end: i
                            },
                            {}
                        )
                    );
                    break;
                    // EoF
                } else {
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

            tokens.push([str, { type: TokenTypes.Name, position: { start, end: i } }]);
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
                tokens.push([op, { type: TokenTypes.Operator, position: { start: i, end: i + op.length - 1 } }]);
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
            tokens.push([char, { type: TokenTypes.Operator, position: { start: i, end: i } }]);
            continue;
        }

        // Anything else is an OTHER
        tokens.push([char, { type: TokenTypes.Other, position: { start: i, end: i } }]);
    }
    if (issues.length) return { ok: false, issues, tokens: null };
    else return { ok: true, issues: [], tokens };
}
