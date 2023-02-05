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
import type { ZircoIssue, ZircoIssueTypes } from "../lib/types/ZircoIssue";
import type { Token } from "./tokens";
import { TokenTypes } from "./tokens";

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

const panicTokenBoundaries = '"+-*/%=!<>(){}[],;:.'.split("");

export default function lex(input: string): LexerOutput {
    const output: Token[] = [];
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

    // After multiple debates around whether to use getters or a function for current(), the only method
    // of preventing type narrowing in if statements appears to be a function.
    // Please read the TypeScript parser itself for more information:
    // https://github.com/microsoft/TypeScript/blob/1ed0a5ac4b49971e4698d5388f7760cbaa0615ac/src/compiler/parser.ts#L2102-L2107
    const tokens = {
        current: () => input[i],
        currentTwo: () => tokens.current() + tokens.next(),
        consume: () => input[i++],
        consumeTwo: () => tokens.consume() + tokens.consume(),
        next: () => input[i + 1],
        atEOF: () => i >= length
    };

    lexerLoop: for (; i < length; ) {
        /* istanbul ignore next */
        if (previousI >= i)
            throw new Error(
                "Potential infinite loop detected in the lexer. This should never happen. Please create an issue on GitHub and include source code that replicates this issue."
            );
        previousI = i;

        // Skip whitespace
        if (/\s/.test(tokens.current())) {
            tokens.consume();
            continue;
        }

        // Let's start with the easiest and probably most important. Strings.
        // Strings are started and ended with " and can contain any character except for
        // a double quote (unless escaped with a backslash)

        // If the first character is a ", then we know it's a string.
        if (tokens.current() === '"') {
            const start = i;
            let raw = tokens.consume();
            let contents = "";

            if (tokens.atEOF()) {
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
            while (tokens.current() !== '"') {
                if (tokens.current() === "\\") {
                    // This will add the next character to the string, regardless of what it is, even if it's a ".
                    raw += tokens.consume();
                    if (tokens.atEOF()) {
                        addIssue(new ZircoSyntaxError(ZircoSyntaxErrorTypes.UnclosedString, { start: i, end: i }, {}));
                        break lexerLoop;
                    }
                }

                contents += tokens.current();
                raw += tokens.consume();

                if (tokens.atEOF()) {
                    addIssue(new ZircoSyntaxError(ZircoSyntaxErrorTypes.UnclosedString, { start, end: i }, {}));
                    break lexerLoop;
                }
            }

            // Consume the final closing quote
            raw += tokens.consume();

            output.push({ type: TokenTypes.String, raw: raw, value: contents, position: { start, end: i - 1 } });
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
        if (tokens.current() === "0" && ["x", "b"].includes(tokens.next())) {
            const start = i;
            let str = tokens.consume();
            const typeOfLiteral = tokens.current() === "x" ? "hexadecimal" : "binary";
            str += tokens.consume();

            if (tokens.atEOF()) {
                addIssue(new ZircoSyntaxError(ZircoSyntaxErrorTypes.NumberPrefixWithNoValue, { start: i, end: i }, { typeOfLiteral }));
                break lexerLoop;
            }

            const matchReg = typeOfLiteral === "binary" ? /[01]/ : /[0-9a-fA-F]/;

            while (/[a-zA-Z0-9]/.test(tokens.current())) {
                if (!matchReg.test(tokens.current())) {
                    addIssue(
                        new ZircoSyntaxError(
                            ZircoSyntaxErrorTypes.NumberInvalidCharacter,
                            { start: i, end: i },
                            { typeOfLiteral, invalidCharacter: tokens.current() }
                        )
                    );
                    i++;
                    panic();
                    continue lexerLoop;
                }

                str += tokens.consume();
                if (tokens.atEOF()) break;
            }

            output.push({
                type: TokenTypes.Number,
                raw: str,
                value: parseInt(str.substring(2), typeOfLiteral === "binary" ? 2 : 16),
                position: { start, end: i - 1 }
            });
            continue;
        }

        // Non-prefixed numbers
        if (/\d/.test(tokens.current())) {
            let str = "";
            const start = i;
            let numberOfDecimalPointsEncountered = 0;

            while (/[0-9A-Za-z._]/.test(tokens.current())) {
                if (/[^0-9._]/.test(tokens.current())) {
                    addIssue(
                        new ZircoSyntaxError(
                            ZircoSyntaxErrorTypes.NumberInvalidCharacter,
                            { start: i, end: i },
                            { typeOfLiteral: "decimal", invalidCharacter: tokens.current() }
                        )
                    );
                    i++;
                    panic();
                    continue lexerLoop;
                }

                if (tokens.current() === ".") numberOfDecimalPointsEncountered++;

                str += tokens.consume();
                if (tokens.atEOF()) break;
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

            output.push({ type: TokenTypes.Number, raw: str, value: parseFloat(str.replace(/_/g, "")), position: { start, end: i - 1 } });
            continue;
        }

        // Test single-line comments first
        if (tokens.current() + tokens.next() === "//") {
            do
                tokens.consume(); // Keep running forwards
            while (!tokens.atEOF() && tokens.current() !== "\n");

            continue;
        }

        {
            // Then block comments
            const isBlockCommentOpening = () => tokens.current() + tokens.next() === "/*",
                isBlockCommentClosing = () => tokens.current() + tokens.next() === "*/";

            if (isBlockCommentOpening()) {
                const start = i;
                tokens.consume(); // Increment once to prevent something like /*/ from counting (prevent the asterisk from being counted twice)

                let nest = 1;

                do {
                    tokens.consume();

                    // if we hit another block comment, increment the nest level and skip forwards
                    if (isBlockCommentOpening()) nest++;
                    // if we hit a closing group, decrement the nest level
                    else if (isBlockCommentClosing()) {
                        nest--;

                        // If we hit a */ group that closes the outermost block, exit
                        if (nest === 0) break;
                    }
                } while (!tokens.atEOF());

                if (tokens.atEOF()) {
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
                    tokens.consume(); // skip the *
                    tokens.consume(); // then skip the /
                    continue;
                }
            }
        }

        // At this point, names shouldn't be too difficult.
        // Names are just a sequence of letters, numbers, and underscores.
        // They can't start with a number, though.
        if (/[a-zA-Z_]/.test(tokens.current())) {
            let str = "";
            const start = i;

            while (/[a-zA-Z0-9_]/.test(tokens.current())) {
                str += tokens.consume();
                if (tokens.atEOF()) break;
            }

            output.push({ type: TokenTypes.Name, raw: str, value: str, position: { start, end: i - 1 } });
            continue;
        }

        // Two-character operators
        // By putting the position before the consumeTwo(), i remains unchanged until afterwards.
        switch (tokens.currentTwo()) {
            case "==":
                output.push({ type: TokenTypes.EqualsEquals, position: { start: i, end: i + 1 }, raw: tokens.consumeTwo() });
                continue;
            case "!=":
                output.push({ type: TokenTypes.ExclamationEquals, position: { start: i, end: i + 1 }, raw: tokens.consumeTwo() });
                continue;
            case ">=":
                output.push({ type: TokenTypes.GreaterThanEquals, position: { start: i, end: i + 1 }, raw: tokens.consumeTwo() });
                continue;
            case "<=":
                output.push({ type: TokenTypes.LessThanEquals, position: { start: i, end: i + 1 }, raw: tokens.consumeTwo() });
                continue;
            case "+=":
                output.push({ type: TokenTypes.PlusEquals, position: { start: i, end: i + 1 }, raw: tokens.consumeTwo() });
                continue;
            case "-=":
                output.push({ type: TokenTypes.MinusEquals, position: { start: i, end: i + 1 }, raw: tokens.consumeTwo() });
                continue;
            case "*=":
                output.push({ type: TokenTypes.StarEquals, position: { start: i, end: i + 1 }, raw: tokens.consumeTwo() });
                continue;
            case "/=":
                output.push({ type: TokenTypes.SlashEquals, position: { start: i, end: i + 1 }, raw: tokens.consumeTwo() });
                continue;
            case "++":
                output.push({ type: TokenTypes.PlusPlus, position: { start: i, end: i + 1 }, raw: tokens.consumeTwo() });
                continue;
            case "--":
                output.push({ type: TokenTypes.MinusMinus, position: { start: i, end: i + 1 }, raw: tokens.consumeTwo() });
                continue;
            case "||":
                output.push({ type: TokenTypes.PipePipe, position: { start: i, end: i + 1 }, raw: tokens.consumeTwo() });
                continue;
            case "&&":
                output.push({ type: TokenTypes.AmpersandAmpersand, position: { start: i, end: i + 1 }, raw: tokens.consumeTwo() });
                continue;
            case "<<":
                output.push({ type: TokenTypes.LessThanLessThan, position: { start: i, end: i + 1 }, raw: tokens.consumeTwo() });
                continue;
            case ">>":
                output.push({ type: TokenTypes.GreaterThanGreaterThan, position: { start: i, end: i + 1 }, raw: tokens.consumeTwo() });
                continue;
            case "**":
                output.push({ type: TokenTypes.StarStar, position: { start: i, end: i + 1 }, raw: tokens.consumeTwo() });
                continue;
            case "->":
                output.push({ type: TokenTypes.MinusGreaterThan, position: { start: i, end: i + 1 }, raw: tokens.consumeTwo() });
                continue;
            default: // do nothing
        }

        // Single-character operators
        switch (tokens.current()) {
            case "+":
                output.push({ type: TokenTypes.Plus, position: { start: i, end: i }, raw: tokens.consume() });
                continue;
            case "-":
                output.push({ type: TokenTypes.Minus, position: { start: i, end: i }, raw: tokens.consume() });
                continue;
            case "*":
                output.push({ type: TokenTypes.Star, position: { start: i, end: i }, raw: tokens.consume() });
                continue;
            case "/":
                output.push({ type: TokenTypes.Slash, position: { start: i, end: i }, raw: tokens.consume() });
                continue;
            case "%":
                output.push({ type: TokenTypes.Percent, position: { start: i, end: i }, raw: tokens.consume() });
                continue;
            case "=":
                output.push({ type: TokenTypes.Equals, position: { start: i, end: i }, raw: tokens.consume() });
                continue;
            case "!":
                output.push({ type: TokenTypes.Exclamation, position: { start: i, end: i }, raw: tokens.consume() });
                continue;
            case "<":
                output.push({ type: TokenTypes.LessThan, position: { start: i, end: i }, raw: tokens.consume() });
                continue;
            case ">":
                output.push({ type: TokenTypes.GreaterThan, position: { start: i, end: i }, raw: tokens.consume() });
                continue;
            case "(":
                output.push({ type: TokenTypes.LeftParen, position: { start: i, end: i }, raw: tokens.consume() });
                continue;
            case ")":
                output.push({ type: TokenTypes.RightParen, position: { start: i, end: i }, raw: tokens.consume() });
                continue;
            case "{":
                output.push({ type: TokenTypes.LeftBrace, position: { start: i, end: i }, raw: tokens.consume() });
                continue;
            case "}":
                output.push({ type: TokenTypes.RightBrace, position: { start: i, end: i }, raw: tokens.consume() });
                continue;
            case "[":
                output.push({ type: TokenTypes.LeftBracket, position: { start: i, end: i }, raw: tokens.consume() });
                continue;
            case "]":
                output.push({ type: TokenTypes.RightBracket, position: { start: i, end: i }, raw: tokens.consume() });
                continue;
            case ",":
                output.push({ type: TokenTypes.Comma, position: { start: i, end: i }, raw: tokens.consume() });
                continue;
            case ";":
                output.push({ type: TokenTypes.Semicolon, position: { start: i, end: i }, raw: tokens.consume() });
                continue;
            case ":":
                output.push({ type: TokenTypes.Colon, position: { start: i, end: i }, raw: tokens.consume() });
                continue;
            case ".":
                output.push({ type: TokenTypes.Dot, position: { start: i, end: i }, raw: tokens.consume() });
                continue;
            default: // do nothing
        }

        // Anything else is an OTHER
        output.push({ type: TokenTypes.Other, position: { start: i, end: i }, raw: tokens.consume() });
    }
    if (issues.length) return { ok: false, issues, tokens: null };
    else return { ok: true, issues: [], tokens: output };
}
