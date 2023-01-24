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

import { base64ToBase64url, base64urlDecode, base64urlEncode, base64urlToBase64 } from "../../encoding/base64url";

const conversionTests: [string, { base64: string; base64url: string }][] = [
    ["doesn't change a string that doesn't need to be changed", { base64: "aGVsbG8gd29ybGQ=", base64url: "aGVsbG8gd29ybGQ=" }],
    ["plus vs minus", { base64: "ab+c", base64url: "ab-c" }],
    ["slash vs underscore", { base64: "ab/c", base64url: "ab_c" }],
    ["everything works in conjunction", { base64: "ab+c/d==", base64url: "ab-c_d==" }]
];

for (const [name, { base64, base64url }] of conversionTests) {
    describe("base64ToBase64url", () => {
        it(name, () => expect(base64ToBase64url(base64)).toBe(base64url));
    });
    describe("base64urlToBase64", () => {
        it(name, () => expect(base64urlToBase64(base64url)).toBe(base64));
    });
}

const encodeDecodeTests: [string, string, string][] = [
    ["hello world", "hello world", "aGVsbG8gd29ybGQ="],
    // TODO: find a test that includes a + in the output. for some reason
    // I can't find a good test for this because every time I do \xFF it becomes
    // a different set of two bytes.
    ["slash vs underscore", String.fromCharCode(0xff, 0xff), "w7_Dvw=="]
];

for (const [name, text, base64url] of encodeDecodeTests) {
    describe("base64urlEncode", () => {
        it(name, () => expect(base64urlEncode(text)).toBe(base64url));
    });
    describe("base64urlDecode", () => {
        it(name, () => expect(base64urlDecode(base64url)).toBe(text));
    });
}
