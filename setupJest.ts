/* istanbul ignore file: nobody gives a shit about non-source coverage */

import type { MatcherFunction } from "expect";

const toThrowZircoError: MatcherFunction<[error: unknown, type: unknown, position: unknown]> = function (fn, error, type, position) {
    let didThrow = false;
    try {
        (fn as () => void)();
    } catch (e: any) {
        // TODO: remove any from above line
        didThrow = true;
        expect(e).toBeInstanceOf(error);
        expect(e.type).toBe(type);
        expect(e.position).toEqual(position);
    }
    expect(didThrow).toBe(true);
    return { pass: true, message: () => "ok" };
};

expect.extend({
    toThrowZircoError
});

declare global {
    namespace jest {
        interface Matchers<R> {
            toThrowZircoError(error: unknown, type: unknown, position: unknown): R;
        }
    }
}
