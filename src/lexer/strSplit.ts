export interface StringPosition {
    start: number;
    end: number;
}
export type PositionedString = [string, StringPosition];

/**
 * Splits an input string into an array of single characters.
 * @param input The input string
 * @returns The input string, split into characters
 */
export default function strSplit(input: string): PositionedString[] {
    return input.split('').map((value, index) => [value, { start: index, end: index + 1 }]);
}
