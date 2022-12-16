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
