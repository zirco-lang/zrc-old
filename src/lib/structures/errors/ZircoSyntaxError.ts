import { StringPosition } from 'src/lexer/strSplit';

export enum ZircoSyntaxErrorTypes {
    /** Lexer error (STRING token): Caused when string is missing a closing quote */
    LEXER_STRING_UNCLOSED,

    /** Lexer error (STRING token): Caused when string has an escape before EOF */
    LEXER_STRING_ESCAPE_EOF,

    /** Lexer error (CONSTANT_NUMBER token): More than one decimal point */
    LEXER_NUMBER_MULTIPLE_DECIMALS,

    /** Lexer error (CONSTANT_NUMBER token): Type prefix without a value */
    LEXER_NUMBER_TYPE_PREFIX_NO_VALUE
}

/** Represents a syntax error. */
export default class ZircoSyntaxError extends Error {
    /** The positioning information for this error. */
    public position: StringPosition;
    /** A ZircoSyntaxErrorType that represents the type code of this error. */
    public type: ZircoSyntaxErrorTypes;
    // assigned by super()
    public message!: keyof typeof ZircoSyntaxErrorTypes;

    constructor(type: ZircoSyntaxErrorTypes, position: StringPosition) {
        super(ZircoSyntaxErrorTypes[type]);
        this.type = type;
        this.name = 'ZircoSyntaxError';
        this.position = position;
    }
}
