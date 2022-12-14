import { PositionedString, StringPosition } from './strSplit';

/** Represents all possible types for a Token. */
export enum TokenTypes {
    /** Any identifier or keyword. */
    IDENTIFIER,
    /** Any numerical constant. */
    CONSTANT_NUMBER,
    /** A string. */
    STRING,
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

        if (/\s/.test(value[0])) continue;

        // This bit is going to look really ugly.
        // Our goal is to look for anything that would start a context,
        // and if we find one, walk until we reach the end of it.
        // The contexts available are listed in the enum TokenTypes,
        // and some examples can be found in the test cases in tests/mergeStrings.test.ts.

        // First, we can look for a string. Only double-quoted strings are supported at the moment.
        // If we find an opening quote, we can begin a string and walk until we find the closing quote.
        if (value[0] === '"') {
            let start = value[1].start;
            // value will now point to the NEXT character.
            value = input[++i];
            let string = '';
            while (value[0] !== '"') {
                // If we reach the end of the file, we have an error.
                if (i >= input.length) throw new Error('Unexpected end of file');

                if (value[0] === '\\') {
                    // As this is an escape character, it could be followed
                    // by a double-quote. For this reason, we first add
                    // the escape:
                    string += value[0];
                    // and if it's a double-quote following, we add that too.
                    value = input[++i];
                    if (value[0] === '"') string += value[0];
                } else {
                    // Otherwise, we can add the character to the string.
                    string += value[0];
                }
                // value will now point to the NEXT character.
                value = input[++i];
            }
            // The ending character we sit on is the end of the string.
            // We can now add the string to the output. The parser
            // expects the quotes around it.
            output.push([`"${string}"`, { type: TokenTypes.STRING, position: { start, end: value[1].end } }]);
            continue;
        }

        // Next, we can classify numerical constants. They are either a simple number,
        // or a number followed by 'x' or 'b'.
        if (/[0-9]/.test(value[0])) {
            let start = value[1].start;
            let constant = value[0];
            if (input[i + 1]) {
                value = input[++i];
                if (value[0] === 'x' || value[0] === 'b') {
                    constant += value[0];
                    value = input[++i];
                    while (/[0-9a-fA-F]/.test(value[0])) {
                        constant += value[0];
                        value = input[++i];
                    }
                } else {
                    while (/[0-9]/.test(value[0])) {
                        constant += value[0];
                        value = input[++i];
                    }
                }
            }
            // The ending character we sit on is the end of the constant.
            // We can now add the constant to the output.
            output.push([constant, { type: TokenTypes.CONSTANT_NUMBER, position: { start, end: value[1].end } }]);
            continue;
        }

        // The following letters can start a name/token/identifier.
        if (/[a-zA-Z_]/.test(value[0])) {
            let start = value[1].start;
            let identifier = value[0];
            value = input[++i];
            while (/[a-zA-Z0-9_]/.test(value[0])) {
                identifier += value[0];
                value = input[++i];
            }
            // The ending character we sit on is the end of the identifier.
            // We can now add the identifier to the output.
            output.push([identifier, { type: TokenTypes.IDENTIFIER, position: { start, end: value[1].end } }]);
            continue;
        }

        // If we reach this point, we have an unknown token or it is an operator.
        // We can add it to the output.
        output.push([value[0], { type: TokenTypes.OTHER, position: value[1] }]);
    }
    return output;
}
