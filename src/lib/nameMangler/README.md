# zrc name-mangling logic

Zirco's name mangler works by prefixing a base64url-encoded stringified JSON array with `_ZR_` (a reserved name in Zirco)

Note: Zirco's base64url implementation uses `~` instead of `-` and `$` instead of `=` to avoid issues with being used as assembly symbol names. This implementation is known as "zirco64."

TODO: specify this in the spec as a reserved name

The array contains values of the following form:

```ts
type NameManglingEntry<T extends NameManglingTypes> = [
    string, // the namespace, property, etc
    T, // what sort of value this entry is
    NameManglingArgs[T]
];
```

The `NameManglingArgs` type contains whatever the additional info might be. For functions, it is an array containing the return value and its arguments. Look at the source code for more information.
