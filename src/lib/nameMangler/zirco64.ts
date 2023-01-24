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

import { base64urlEncode, base64urlDecode } from "./base64url";

export function zirco64Encode(input: string): string {
    return base64urlEncode(input).replace(/-/g, "~").replace(/=/g, "$");
}

export function zirco64Decode(input: string): string {
    return base64urlDecode(input.replace(/~/g, "-").replace(/\$/g, "="));
}