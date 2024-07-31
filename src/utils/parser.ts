import { AndCondition, BaseCondition, Condition, LocationConditionTarget, OrCondition } from "./condition";

/** Represents a token in the parsed input */
interface Token {
    type: string;
    value: string;
}

/**
 * Parses an array of tokens into a BaseCondition
 * @param tokens - Array of tokens to parse
 * @returns A BaseCondition representing the parsed expression
 */
function parse(tokens: Token[]): BaseCondition {
    let current = 0;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let parenCount = 0;

    /** Walks through tokens and constructs conditions */
    function walk(): BaseCondition {

        function GetLocationToken(token: {type: string, value: string} | undefined): LocationConditionTarget {
            // If this token is not location then the default location is hand
            if (!token || token?.type !== 'location') {
                return LocationConditionTarget.Hand;
            }

            current++;

            // parse the token and return the type
            switch (token.value.toLowerCase()) {
                case 'deck':
                    return LocationConditionTarget.Deck;
                case 'hand':
                    return LocationConditionTarget.Hand;
                default:
                    throw new TypeError('Invalid location: ' + token.value);
            }
        }

        const token = tokens[current];
        if (token.type === 'number') {
            current++;
            const nextToken = tokens[current];
            if (nextToken) {
                if (nextToken.type === 'name') {
                    current++;
                    const quantity = parseInt(token.value);
                    // Determine the operator based on the presence of + or -
                    const operator = token.value.includes('+') ? '>=' : token.value.includes('-') ? '<=' : '=';

                    // Check for location token
                    const location = GetLocationToken(tokens[current]);

                    return new Condition(nextToken.value, quantity, operator, location);
                } else {
                    throw new TypeError('Expected card name after number');
                }
            }
        }

        if (token.type === 'name') {
            current++;
            
            // Check for location token
            const location = GetLocationToken(tokens[current]);

            return new Condition(token.value, 1, '>=', location);
        }

        if (token.type === 'paren') {
            if (token.value === '(') {
                parenCount++;
                current++;
                const result = parseExpression();
                // Ensure matching closing parenthesis
                if (tokens[current].type !== 'paren' || tokens[current].value !== ')') {
                    throw new SyntaxError('Expected closing parenthesis');
                }
                parenCount--;
                current++;
                return result;
            } else {
                throw new SyntaxError('Unexpected closing parenthesis');
            }
        }

        throw new TypeError(`Unexpected token type: ${token.type}`);
    }

    /** Parses expressions, handling AND and OR operations */
    function parseExpression(): BaseCondition {
        let left: BaseCondition = walk();
    
        while (current < tokens.length && tokens[current].type === 'operator') {
            const operator = tokens[current].value;
            current++;
            const right: BaseCondition = walk();
            // Create AndCondition or OrCondition based on the operator
            left = operator === 'AND' ? new AndCondition([left, right]) : new OrCondition([left, right]);
        }
    
        return left;
    }

    const result = parseExpression();
    
    // Check for any unexpected tokens after parsing
    if (current < tokens.length) {
        if (tokens[current].type === 'paren' && tokens[current].value === ')') {
            throw new SyntaxError('Unexpected closing parenthesis');
        } else {
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
function tokenize(input: string): Token[] {
    const tokens: Token[] = [];
    let current = 0;

    function isLocationToken(slice: string): RegExpMatchArray | null {
        return slice.match(/^IN /);
    }

    function tokenizeQuantity(): boolean {
        // Handle numbers (including + and - for operators)
        const NUMBERS = /[0-9]/;
        const validNumber = /[0-9](\+||-)? /;
        let char = input[current];
        if (validNumber.test(input.slice(current, current + 3))) {
            let value = '';
            while (NUMBERS.test(char)) {
                value += char;
                char = input[++current];
            }
            if (char === '+' || char === '-') {
                value += char;
                char = input[++current];
            }

            tokens.push({ type: 'number', value });
            return true;
        }

        return false;
    }

    function tokenizeName(): boolean {
        const NAME_CHARS = /[a-zA-Z0-9\s\-',.&:!?"]+$/;
        let char = input[current];

        function isCharIllegal(char: string): boolean {
            const ILLEGAL_CHARS = new RegExp(`[^${NAME_CHARS.source.slice(1, -1)}]`);
            if (ILLEGAL_CHARS.test(char)) {
                return true;
            }

            return false;
        }

        if (NAME_CHARS.test(char)) {
            let value = '';
            while (current < input.length && (NAME_CHARS.test(char) || char === ' ')) {
                if (isCharIllegal(char)) {
                    throw new TypeError('Illegal character in card name: ' + char);
                }

                if (char !== ' ' || (value && NAME_CHARS.test(input[current + 1]))) {
                    value += char;
                }
                char = input[++current];

                // Break if we encounter an AND or OR operator
                if (isANDToken(input.slice(current)) || isORToken(input.slice(current)) || isLocationToken(input.slice(current))) {
                    break;
                }
            }
            tokens.push({ type: 'name', value: value.trim() });
            return true;
        }

        return false;
    }

    function tokenizeLocation(slice: string): boolean {
        // Check if this is a valid location token
        if (isLocationToken(slice)) {
            // it is so pull the location
            current += 3;
            const LOCATION_PATTERN = /(deck|hand)/i;
            const location = input.slice(current).match(LOCATION_PATTERN)![0];
            
            if (!location) {
                throw new TypeError('Expected location after "IN"');
            }

            // push the location token
            tokens.push({ type: 'location', value: location });
            current += location.length;
            return true;
        }

        // no location token found
        return false;
    }

    function isANDToken(slice: string): RegExpMatchArray | null {
        return slice.match(/^AND\b/);
    }

    function isORToken(slice: string): RegExpMatchArray | null {
        return slice.match(/^OR\b/);
    }

    while (current < input.length) {
        const char = input[current];

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
        if (isANDToken(input.slice(current))) {
            tokens.push({ type: 'operator', value: 'AND' });
            current += 3;
            continue;
        }

        // Check for OR operator
        if (isORToken(input.slice(current))) {
            tokens.push({ type: 'operator', value: 'OR' });
            current += 2;
            continue;
        }

        // if the last token was a number the next token must be a name
        const last_token = tokens[tokens.length - 1];
        if (last_token?.type === 'number') {
            if (tokenizeName()) {
                continue;
            }
        }

        if (tokenizeQuantity()) {
            continue;
        }

        if (tokenizeLocation(input.slice(current))) {
            continue;
        }

        if (tokenizeName()) {
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
export function parseCondition(conditions: string): BaseCondition {
    const tokens = tokenize(conditions);
    return parse(tokens);
}