import { AndCondition, BaseCondition, Condition, OrCondition } from "./condition.js";

interface Token {
    type: string;
    value: string;
}

function parse(tokens: Token[]): BaseCondition {
    let current = 0;

    function walk(): BaseCondition {
        let token = tokens[current];
        if (token.type === 'number') {
            current++;
            let nextToken = tokens[current];
            if (nextToken && nextToken.type === 'name') {
                current++;
                let quantity = parseInt(token.value);
                let operator = token.value.includes('+') ? '>=' : '=';
                return new Condition(nextToken.value, quantity, operator);
            } else {
                throw new TypeError('Expected card name after number');
            }
        }

        if (token.type === 'name') {
            current++;
            return new Condition(token.value);
        }

        if (token.type === 'paren' && token.value === '(') {
            current++;
            let result = parseExpression();
            current++; // skip closing parenthesis
            return result;
        }

        throw new TypeError(`Unexpected token type: ${token.type}`);
    }

    function parseExpression(): BaseCondition {
        let left: BaseCondition = walk();
    
        while (current < tokens.length && tokens[current].type === 'operator') {
            let operator = tokens[current].value;
            current++;
            let right: BaseCondition = walk();
            left = operator === 'AND' ? new AndCondition([left, right]) : new OrCondition([left, right]);
        }
    
        return left;
    }

    let result = parseExpression();
    return result;
}

function tokenize(input: string): Token[] {
    const tokens: Token[] = [];
    let current = 0;

    while (current < input.length) {
        let char = input[current];

        if (char === '(' || char === ')') {
            tokens.push({ type: 'paren', value: char });
            current++;
            continue;
        }

        const WHITESPACE = /\s/;
        if (WHITESPACE.test(char)) {
            current++;
            continue;
        }

        function isANDToken(slice: string): RegExpMatchArray | null {
            return slice.match(/^AND\b/);
        }

        if (isANDToken(input.slice(current))) {
            tokens.push({ type: 'operator', value: 'AND' });
            current += 3;
            continue;
        }

        function isORToken(slice: string): RegExpMatchArray | null {
            return slice.match(/^OR\b/);
        }

        if (isORToken(input.slice(current))) {
            tokens.push({ type: 'operator', value: 'OR' });
            current += 2;
            continue;
        }

        const NUMBERS = /[0-9]/;
        if (NUMBERS.test(char)) {
            let value = '';
            while (NUMBERS.test(char)) {
                value += char;
                char = input[++current];
            }
            if (char === '+') {
                value += char;
                current++;
            }
            tokens.push({ type: 'number', value });
            continue;
        }

        const NAME_CHARS = /[A-Za-z0-9\-]/;
        if (NAME_CHARS.test(char)) {
            let value = '';
            while (current < input.length && (NAME_CHARS.test(char) || char === ' ')) {
                if (char !== ' ' || (value && NAME_CHARS.test(input[current + 1]))) {
                    value += char;
                }
                char = input[++current];

                if (isANDToken(input.slice(current)) || isORToken(input.slice(current))) {
                    break;
                }
            }
            tokens.push({ type: 'name', value: value.trim() });
            continue;
        }

        throw new TypeError('Unknown character: ' + char);
    }

    return tokens;
}

export function parseCondition(conditions: string): BaseCondition {
    const tokens = tokenize(conditions);
    return parse(tokens);
}