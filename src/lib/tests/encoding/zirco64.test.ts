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

import "../../../../setupJest";

import { base64urlToZirco64, zirco64Decode, zirco64Encode, zirco64ToBase64url } from "../../encoding/zirco64";

const conversionTests: [string, { base64url: string; zirco64: string }][] = [
    ["doesn't change a string that doesn't need to be changed", { base64url: "aGVsbG8gd29ybGQa", zirco64: "aGVsbG8gd29ybGQa" }],
    ["replaces padding", { base64url: "aGVsbG8gd29ybGQ=", zirco64: "aGVsbG8gd29ybGQ$" }],
    ["minus vs tilde", { base64url: "aGVsbG8gd29ybGQ-", zirco64: "aGVsbG8gd29ybGQ~" }],
    ["everything works in conjunction", { base64url: "ab-cde==", zirco64: "ab~cde$$" }]
];

for (const [name, { base64url, zirco64 }] of conversionTests) {
    describe("base64urlToZirco64", () => {
        it(name, () => expect(base64urlToZirco64(base64url)).toBe(zirco64));
    });
    describe("zirco64ToBase64url", () => {
        it(name, () => expect(zirco64ToBase64url(zirco64)).toBe(base64url));
    });
}

const encodeDecodeTests: [string, string, string][] = [
    ["hello world", "hello world", "aGVsbG8gd29ybGQ$"]
    // TODO: fix the thing in base64url on not finding a test that can use '-' first.
    // if I can find one, we can add a tilde test here.
];

for (const [name, text, zirco64] of encodeDecodeTests) {
    describe("zirco64Encode", () => {
        it(name, () => expect(zirco64Encode(text)).toBe(zirco64));
    });
    describe("zirco64Decode", () => {
        it(name, () => expect(zirco64Decode(zirco64)).toBe(text));
    });
}
