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

import type { ZircoSyntaxErrorTypes } from "../structures/errors/ZircoSyntaxError";
import type ZircoSyntaxError from "../structures/errors/ZircoSyntaxError";

type ZircoErrorTypes = ZircoSyntaxErrorTypes;
// NOTE: When more errors become a thing, you can add them as conditional types, like
// type ZircoError<T extends A | B> = T extends A ? ZircoAError<T> : ZircoBError<T>;
type ZircoError<T extends ZircoErrorTypes> = ZircoSyntaxError<T>;

export type { ZircoError, ZircoErrorTypes };
