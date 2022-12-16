import mergeTokens from './mergeTokens';
import strSplit from './strSplit';
import { Token } from './mergeTokens';

export default function lex(input: string): Token[] {
    return mergeTokens(strSplit(input));
}
