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

module.exports = {
    env: {
        node: true
    },
    overrides: [
        {
            files: ["**/*.test.ts"],
            env: {
                jest: true
            }
        }
    ],
    root: true,
    parser: "@typescript-eslint/parser",
    parserOptions: {
        project: ["tsconfig.json", "tsconfig.eslint.json"],
        warnOnUnsupportedTypeScriptVersion: false
    },
    plugins: ["@typescript-eslint", "deprecation", "unused-imports", "license-header", "simple-import-sort"],
    extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended", "prettier"],
    rules: {
        "@typescript-eslint/consistent-type-assertions": ["error", { assertionStyle: "as" }],
        "@typescript-eslint/consistent-type-imports": ["error"],
        "@typescript-eslint/explicit-member-accessibility": ["error"],
        "@typescript-eslint/no-non-null-assertion": ["off"],
        "@typescript-eslint/no-unnecessary-type-assertion": ["error"],
        "@typescript-eslint/no-unused-vars": ["error", { varsIgnorePattern: "^_", argsIgnorePattern: "^_" }],
        "accessor-pairs": ["error"],
        "array-callback-return": ["error"],
        "block-scoped-var": ["error"],
        "consistent-return": ["error"],
        "curly": ["error", "multi"],
        "default-case-last": ["error"],
        "default-case": ["error"],
        "default-param-last": ["error"],
        "deprecation/deprecation": ["warn"],
        "dot-location": ["error", "property"],
        "dot-notation": ["error"],
        "eqeqeq": ["error"],
        "for-direction": ["error"],
        "getter-return": ["error"],
        "grouped-accessor-pairs": ["error", "getBeforeSet"],
        "license-header/header": ["error", "gpl-header.txt"],
        "no-async-promise-executor": ["error"],
        "no-await-in-loop": ["error"],
        "no-case-declarations": ["off"],
        "no-compare-neg-zero": ["error"],
        "no-cond-assign": ["error", "except-parens"],
        "no-constant-condition": ["error", { checkLoops: true }],
        "no-constructor-return": ["error"],
        "no-control-regex": ["error"],
        "no-debugger": ["error"],
        "no-div-regex": ["error"],
        "no-dupe-args": ["error"],
        "no-dupe-else-if": ["error"],
        "no-dupe-keys": ["error"],
        "no-duplicate-case": ["error"],
        "no-else-return": ["off"],
        "no-empty-character-class": ["error"],
        "no-empty-function": ["error"],
        "no-empty-pattern": ["off"],
        "no-empty": ["error", { allowEmptyCatch: true }],
        "no-eq-null": ["error"],
        "no-eval": ["error"],
        "no-ex-assign": ["error"],
        "no-extend-native": ["off"],
        "no-extra-boolean-cast": ["error", { enforceForLogicalOperands: true }],
        "no-extra-parens": ["off"],
        "no-extra-semi": ["error"],
        "no-fallthrough": ["off"],
        "no-floating-decimal": ["error"],
        "no-func-assign": ["error"],
        "no-global-assign": ["error"],
        "no-import-assign": ["error"],
        "no-inner-declarations": ["off"],
        "no-invalid-regexp": ["error", { allowConstructorFlags: ["u", "y"] }],
        "no-invalid-this": ["error"],
        "no-irregular-whitespace": ["error", { skipStrings: true, skipComments: true, skipRegExps: true, skipTemplates: true }],
        "no-loss-of-precision": ["error"],
        "no-misleading-character-class": ["error"],
        "no-obj-calls": ["error"],
        "no-promise-executor-return": ["error"],
        "no-prototype-builtins": ["error"],
        "no-regex-spaces": ["error"],
        "no-setter-return": ["error"],
        "no-sparse-arrays": ["error"],
        "no-template-curly-in-string": ["error"],
        "no-undef": ["error"],
        "no-unexpected-multiline": ["error"],
        "no-unreachable-loop": ["error"],
        "no-unreachable": ["error"],
        "no-unsafe-finally": ["error"],
        "no-unsafe-negation": ["error"],
        "no-use-before-define": ["error"],
        "prefer-template": ["error"],
        "simple-import-sort/exports": ["error"],
        "simple-import-sort/imports": ["error"],
        "template-curly-spacing": ["error", "never"],
        "unused-imports/no-unused-imports": ["error"],
        "use-isnan": ["error"],
        "valid-typeof": ["error"]
    }
};
