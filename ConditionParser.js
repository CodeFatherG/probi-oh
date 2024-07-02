function parse(tokens) {
    let current = 0;

    function walk() {
        let token = tokens[current];
        console.log(`Processing token:`, token);

        if (token.type === 'number') {
            current++;
            let nextToken = tokens[current];
            if (nextToken && nextToken.type === 'name') {
                current++;
                let quantity = parseInt(token.value);
                let operator = token.value.includes('+') ? '>=' : '=';
                console.log(`Creating Condition: ${nextToken.value}, ${quantity}, ${operator}`);
                return new Condition(nextToken.value, quantity, operator);
            } else {
                throw new TypeError('Expected card name after number');
            }
        }

        if (token.type === 'name') {
            current++;
            console.log(`Creating Condition: ${token.value}`);
            return new Condition(token.value);
        }

        if (token.type === 'paren' && token.value === '(') {
            console.log(`Entering parenthesis`);
            current++;
            let result = parseExpression();
            current++; // skip closing parenthesis
            console.log(`Exiting parenthesis`);
            return result;
        }

        throw new TypeError(`Unexpected token type: ${token.type}`);
    }

    function parseExpression() {
        let left = walk();

        while (current < tokens.length && tokens[current].type === 'operator') {
            let operator = tokens[current].value;
            console.log(`Processing ${operator} operator`);
            current++;
            let right = walk();

            console.log(`Creating ${operator}Condition`);
            left = operator === 'AND' ? new AndCondition([left, right]) : new OrCondition([left, right]);
        }

        return left;
    }

    console.log(`Starting parsing`);
    let result = parseExpression();
    console.log(`Parsing complete. Result:`, result);
    return result;
}

function tokenize(input) {
    const tokens = [];
    let current = 0;

    while (current < input.length) {
        let char = input[current];
        console.log(`Current char: '${char}', Current index: ${current}`);

        if (char === '(' || char === ')') {
            tokens.push({ type: 'paren', value: char });
            current++;
            continue;
        }

        const WHITESPACE = /\s/;
        if (WHITESPACE.test(char)) {
            console.log('Skipping whitespace');
            current++;
            continue;
        }

        function isANDToken(slice) {
            return slice.match(/^AND\b/);
        }

        if (isANDToken(input.slice(current))) {
            console.log('Found AND operator');
            tokens.push({ type: 'operator', value: 'AND' });
            current += 3;
            continue;
        }

        function isORToken(slice) {
            return slice.match(/^OR\b/);
        }

        if (isORToken(input.slice(current))) {
            console.log('Found OR operator');
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
            console.log(`Found number: ${value}`);
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
            console.log(`Found name: ${value.trim()}`);
            tokens.push({ type: 'name', value: value.trim() });
            continue;
        }

        throw new TypeError('Unknown character: ' + char);
    }

    return tokens;
}

function parseCondition(conditions) {
    const tokens = tokenize(conditions);
    console.log(tokens)
    return parse(tokens);
}
