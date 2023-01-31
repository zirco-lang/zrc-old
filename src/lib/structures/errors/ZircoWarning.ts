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

import type Interval from "../../../lib/types/Interval";

export enum ZircoWarningTypes {
    _ // placeholder
}

interface ZircoWarningStringPrototypes {
    [ZircoWarningTypes._]: string;
}

// FIXME: does this need to extend Error?
/** Represents a warning. */
export default class ZircoWarning<T extends ZircoWarningTypes> extends Error {
    public static strings: { [k in ZircoWarningTypes]: (data: ZircoWarningStringPrototypes[k]) => string } = {
        [ZircoWarningTypes._]: (_) => "placeholder"
    };

    /** The positioning information for this error. */
    public position: Interval;
    /** A ZircoWarningType that represents the type code of this error. */
    public type: ZircoWarningTypes;
    public readonly name = "ZircoSyntaxError";

    public constructor(type: T, position: Interval, args: ZircoWarningStringPrototypes[T]) {
        super(ZircoWarning.strings[type](args));
        this.type = type;
        this.position = position;
    }
}
