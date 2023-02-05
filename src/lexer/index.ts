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

// Define a bunch of lists used later on now, for performance.
const singleCharOperators = "+-*/%=!<>(){}[],;:.".split("");
const multiCharOperators = ["==", "!=", ">=", "<=", "+=", "-=", "*=", "/=", "++", "--", "||", "&&", "<<", ">>", "**", "->"];
const panicTokenBoundaries = ['"', ...singleCharOperators];

export default function lex(input: string): LexerOutput {
    const tokens: Token[] = [];
    const issues: ZircoIssue<ZircoIssueTypes>[] = [];
    let i = 0;
    // Used to detect infinite loops.
    let previousI = -1;
    const length = input.length;

    /**
     * Puts the lexer into "panic mode." Call this function when encountering an error
     * to allow a best-effort mechanism at reaching the next token and proceeding.
     */
    function panic() {
        // Consume tokens until we find a token boundary.
        while (!panicTokenBoundaries.includes(input[i]) && !/[\s]/.test(input[i]) && i < length) i++;
    }

    function addIssue(issue: ZircoIssue<ZircoIssueTypes>) {
        issues.push(issue);
    }

    // this explains why we have a separate function for this:
    // https://github.com/microsoft/TypeScript/blob/1ed0a5ac4b49971e4698d5388f7760cbaa0615ac/src/compiler/parser.ts#L2102-L2107
    const current = () => input[i];
    const consume = () => input[i++];
    const peek = () => input[i + 1];
    const atEOF = () => i >= length;

    lexerLoop: for (; i < length; ) {
        /* istanbul ignore next */
        if (previousI >= i)
            throw new Error(
                "Potential infinite loop detected in the lexer. This should never happen. Please create an issue on GitHub and include source code that replicates this issue."
            );
        previousI = i;

        // Skip whitespace
        if (/\s/.test(current())) {
            consume();
            continue;
        }

        // Let's start with the easiest and probably most important. Strings.
        // Strings are started and ended with " and can contain any character except for
        // a double quote (unless escaped with a backslash)

        // If the first character is a ", then we know it's a string.
        if (current() === '"') {
            const start = i;
            let str = consume();

            if (atEOF()) {
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

            // We need to loop through the string until we find the end.
            while (current() !== '"') {
                if (current() === "\\") {
                    // This will add the next character to the string, regardless of what it is, even if it's a ".
                    str += consume();
                    if (atEOF()) {
                        addIssue(new ZircoSyntaxError(ZircoSyntaxErrorTypes.UnclosedString, { start: i, end: i }, {}));
                        break lexerLoop;
                    }
                }

                str += consume();

                if (atEOF()) {
                    addIssue(new ZircoSyntaxError(ZircoSyntaxErrorTypes.UnclosedString, { start, end: i }, {}));
                    break lexerLoop;
                }
            }

            // Consume the final closing quote
            str += consume();

            // We found the end of the string. Let's add it to the output.
            tokens.push([`${str}`, { type: TokenTypes.String, position: { start, end: i - 1 } }]);
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
        if (current() === "0" && ["x", "b"].includes(peek())) {
            const start = i;
            let str = consume();
            const typeOfLiteral = current() === "x" ? "hexadecimal" : "binary";
            str += consume();

            if (atEOF()) {
                addIssue(new ZircoSyntaxError(ZircoSyntaxErrorTypes.NumberPrefixWithNoValue, { start: i, end: i }, { typeOfLiteral }));
                break lexerLoop;
            }

            const matchReg = typeOfLiteral === "binary" ? /[01]/ : /[0-9a-fA-F]/;

            while (/[a-zA-Z0-9]/.test(current())) {
                if (!matchReg.test(current())) {
                    addIssue(
                        new ZircoSyntaxError(
                            ZircoSyntaxErrorTypes.NumberInvalidCharacter,
                            { start: i, end: i },
                            { typeOfLiteral, invalidCharacter: current() }
                        )
                    );
                    i++;
                    panic();
                    continue lexerLoop;
                }

                str += consume();
                if (atEOF()) break;
            }

            tokens.push([str, { type: TokenTypes.Number, position: { start, end: i - 1 } }]);
            continue;
        }

        // Non-prefixed numbers
        if (/\d/.test(current())) {
            let str = "";
            const start = i;
            let numberOfDecimalPointsEncountered = 0;

            while (/[0-9A-Za-z._]/.test(current())) {
                if (/[^0-9._]/.test(current())) {
                    addIssue(
                        new ZircoSyntaxError(
                            ZircoSyntaxErrorTypes.NumberInvalidCharacter,
                            { start: i, end: i },
                            { typeOfLiteral: "decimal", invalidCharacter: current() }
                        )
                    );
                    i++;
                    panic();
                    continue lexerLoop;
                }

                if (current() === ".") numberOfDecimalPointsEncountered++;

                str += consume();
                if (atEOF()) break;
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
                i++;
                panic();
                continue;
            }

            tokens.push([str, { type: TokenTypes.Number, position: { start, end: i - 1 } }]);
            continue;
        }

        // Test single-line comments first
        if (current() + peek() === "//") {
            do
                consume(); // Keep running forwards
            while (!atEOF() && current() !== "\n");

            continue;
        }

        {
            // Then block comments
            const isBlockCommentOpening = () => current() + peek() === "/*",
                isBlockCommentClosing = () => current() + peek() === "*/";

            if (isBlockCommentOpening()) {
                const start = i;
                consume(); // Increment once to prevent something like /*/ from counting (prevent the asterisk from being counted twice)

                let nest = 1;

                do {
                    consume();

                    // if we hit another block comment, increment the nest level and skip forwards
                    if (isBlockCommentOpening()) nest++;
                    // if we hit a closing group, decrement the nest level
                    else if (isBlockCommentClosing()) {
                        nest--;

                        // If we hit a */ group that closes the outermost block, exit
                        if (nest === 0) break;
                    }
                } while (!atEOF());

                if (atEOF()) {
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
                } else {
                    consume(); // skip the *
                    consume(); // then skip the /
                    continue;
                }
            }
        }

        // At this point, names shouldn't be too difficult.
        // Names are just a sequence of letters, numbers, and underscores.
        // They can't start with a number, though.
        if (/[a-zA-Z_]/.test(current())) {
            let str = "";
            const start = i;

            while (/[a-zA-Z0-9_]/.test(current())) {
                str += consume();
                if (atEOF()) break;
            }

            tokens.push([str, { type: TokenTypes.Name, position: { start, end: i - 1 } }]);
            continue;
        }

        // Multi-character operators
        // These are operators that are more than one character long.
        // They are checked first, so that they don't get confused with
        // multiple single character operators.
        // Examples of these are ++, +=, ==, !=, etc.
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
                i += op.length;
                continue lexerLoop;
            }
        }

        // Single-character operators
        // These are operators that are only one character long.
        // Examples of these are +, -, *, /, etc.
        if (singleCharOperators.includes(current())) {
            tokens.push([consume(), { type: TokenTypes.Operator, position: { start: i - 1, end: i - 1 } }]);
            continue;
        }

        // Anything else is an OTHER
        tokens.push([consume(), { type: TokenTypes.Other, position: { start: i - 1, end: i - 1 } }]);
    }
    if (issues.length) return { ok: false, issues, tokens: null };
    else return { ok: true, issues: [], tokens };
}
