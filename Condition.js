class Condition {
    constructor(cardName, quantity = 1, operator = '>=') {
        this.cardName = cardName;
        this.quantity = quantity;
        this.operator = operator;
        this.successes = 0;
    }

    evaluate(hand) {
        const count = hand.filter(card => card.name === this.cardName || (card.tags && card.tags.includes(this.cardName))).length;

        console.log(`Found ${count} of ${this.cardName}. Looking for ${this.operator}${this.quantity}`)

        let result = false;
        switch(this.operator) {
            case '>=': result = count >= this.quantity; break;
            case '=': result = count === this.quantity; break;
            case '<=': result = count <= this.quantity; break;
            default: throw new Error(`Unknown operator: ${this.operator}`);
        }

        this.successes += result ? 1 : 0;
        return result;
    }
}

class AndCondition {
    constructor(conditions) {
        if (conditions.some(condition => condition == undefined))
        {
            console.error(`Found a dead condition`);
        }
        this.conditions = conditions;
        this.successes = 0;
    }

    evaluate(hand) {
        let result = this.conditions.every(condition => condition.evaluate(hand))
        this.successes += result ? 1 : 0;
        return result;
    }
}

class OrCondition {
    constructor(conditions) {
        this.conditions = conditions;
        this.successes = 0;
    }

    evaluate(hand) {
        let result = this.conditions.some(condition => condition.evaluate(hand));
        this.successes += result ? 1 : 0;
        return result;
    }
}