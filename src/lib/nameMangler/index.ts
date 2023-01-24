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

enum NameManglingTypes {
    Function,
    Namespace
}

enum MangledParameterAbbreviation {
    string
}

type MangledParameter = [true, string] | [MangledParameterAbbreviation];

interface NameManglingArgs {
    // return value, then parameters
    [NameManglingTypes.Function]: [string, MangledParameter[]],
    [NameManglingTypes.Namespace]: []
}

type NameManglingEntry<T extends NameManglingTypes> = [
    string, // the namespace, property, etc
    T, // what sort of value this entry is
    NameManglingArgs[T]
];

