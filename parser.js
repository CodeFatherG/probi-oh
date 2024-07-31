import { AndCondition, Condition, OrCondition } from "./condition.js";
/**
 * Parses an array of tokens into a BaseCondition
 * @param tokens - Array of tokens to parse
 * @returns A BaseCondition representing the parsed expression
 */
function parse(tokens) {
    let current = 0;
    let parenCount = 0;
    /** Walks through tokens and constructs conditions */
    function walk() {
        let token = tokens[current];
        if (token.type === 'number') {
            current++;
            let nextToken = tokens[current];
            if (nextToken && nextToken.type === 'name') {
                current++;
                let quantity = parseInt(token.value);
                // Determine the operator based on the presence of + or -
                let operator = token.value.includes('+') ? '>=' : token.value.includes('-') ? '<=' : '=';
                return new Condition(nextToken.value, quantity, operator);
            }
            else {
                throw new TypeError('Expected card name after number');
            }
        }
        if (token.type === 'name') {
            current++;
            return new Condition(token.value);
        }
        if (token.type === 'paren') {
            if (token.value === '(') {
                parenCount++;
                current++;
                let result = parseExpression();
                // Ensure matching closing parenthesis
                if (tokens[current].type !== 'paren' || tokens[current].value !== ')') {
                    throw new SyntaxError('Expected closing parenthesis');
                }
                parenCount--;
                current++;
                return result;
            }
            else {
                throw new SyntaxError('Unexpected closing parenthesis');
            }
        }
        throw new TypeError(`Unexpected token type: ${token.type}`);
    }
    /** Parses expressions, handling AND and OR operations */
    function parseExpression() {
        let left = walk();
        while (current < tokens.length && tokens[current].type === 'operator') {
            let operator = tokens[current].value;
            current++;
            let right = walk();
            // Create AndCondition or OrCondition based on the operator
            left = operator === 'AND' ? new AndCondition([left, right]) : new OrCondition([left, right]);
        }
        return left;
    }
    let result = parseExpression();
    // Check for any unexpected tokens after parsing
    if (current < tokens.length) {
        if (tokens[current].type === 'paren' && tokens[current].value === ')') {
            throw new SyntaxError('Unexpected closing parenthesis');
        }
        else {
            throw new SyntaxError('Unexpected token after valid expression');
        }
    }
    return result;
}
/**
 * Tokenizes an input string into an array of tokens
 * @param input - The string to tokenize
 * @returns An array of Token objects
 */
function tokenize(input) {
    const tokens = [];
    let current = 0;
    while (current < input.length) {
        let char = input[current];
        // Handle parentheses
        if (char === '(' || char === ')') {
            tokens.push({ type: 'paren', value: char });
            current++;
            continue;
        }
        // Skip whitespace
        const WHITESPACE = /\s/;
        if (WHITESPACE.test(char)) {
            current++;
            continue;
        }
        // Check for AND operator
        function isANDToken(slice) {
            return slice.match(/^AND\b/);
        }
        if (isANDToken(input.slice(current))) {
            tokens.push({ type: 'operator', value: 'AND' });
            current += 3;
            continue;
        }
        // Check for OR operator
        function isORToken(slice) {
            return slice.match(/^OR\b/);
        }
        if (isORToken(input.slice(current))) {
            tokens.push({ type: 'operator', value: 'OR' });
            current += 2;
            continue;
        }
        // Handle numbers (including + and - for operators)
        const NUMBERS = /[0-9]/;
        if (NUMBERS.test(char)) {
            let value = '';
            while (NUMBERS.test(char)) {
                value += char;
                char = input[++current];
            }
            if (char === '+' || char === '-') {
                value += char;
                current++;
            }
            tokens.push({ type: 'number', value });
            continue;
        }
        // Handle card names (including spaces and hyphens)
        const NAME_CHARS = /[A-Za-z0-9\-]/;
        if (NAME_CHARS.test(char)) {
            let value = '';
            while (current < input.length && (NAME_CHARS.test(char) || char === ' ')) {
                if (char !== ' ' || (value && NAME_CHARS.test(input[current + 1]))) {
                    value += char;
                }
                char = input[++current];
                // Break if we encounter an AND or OR operator
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
/**
 * Parses a condition string into a BaseCondition
 * @param conditions - The condition string to parse
 * @returns A BaseCondition representing the parsed condition
 */
export function parseCondition(conditions) {
    const tokens = tokenize(conditions);
    return parse(tokens);
}
