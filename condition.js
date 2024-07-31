/** Specific condition for card evaluation */
export class Condition {
    /**
     * Creates a new Condition
     * @param cardName - Name of the card to evaluate
     * @param quantity - Quantity to compare against
     * @param operator - Comparison operator
     */
    constructor(cardName, quantity = 1, operator = '>=') {
        this.cardName = cardName;
        this.quantity = quantity;
        this.operator = operator;
        this._successes = 0;
    }
    /** Number of successful evaluations */
    get successes() {
        return this._successes;
    }
    /** Evaluates the condition against a hand of cards */
    evaluate(hand) {
        const count = hand.filter(card => card.name === this.cardName || (card.tags && card.tags.includes(this.cardName))).length;
        let result = false;
        switch (this.operator) {
            case '>=':
                result = count >= this.quantity;
                break;
            case '=':
                result = count === this.quantity;
                break;
            case '<=':
                result = count <= this.quantity;
                break;
            default: throw new Error(`Unknown operator: ${this.operator}`);
        }
        this._successes += result ? 1 : 0;
        return result;
    }
    requiredCards(hand) {
        let _hand = hand.slice();
        let _requiredCards = [];
        // Remove cards used for this condition
        for (let i = 0; i < this.quantity; i++) {
            const index = _hand.findIndex(card => card.name === this.cardName || (card.tags && card.tags.includes(this.cardName)));
            if (index === -1) {
                console.error(`Failed to find card: ${this.cardName}`);
                return [];
            }
            _requiredCards.push(_hand[index]);
            _hand.splice(index, 1);
        }
        return _requiredCards;
    }
}
/** Logical AND condition composed of multiple base conditions */
export class AndCondition {
    /**
     * Creates a new AndCondition
     * @param conditions - Array of BaseCondition objects
     */
    constructor(conditions) {
        this.conditions = conditions;
        this._successes = 0;
        if (conditions.some(condition => condition == undefined)) {
            console.error(`Found a dead condition`);
        }
    }
    /** Number of successful evaluations */
    get successes() {
        return this._successes;
    }
    /** Evaluates the AND condition against a hand of cards */
    evaluate(hand) {
        let result = this.conditions.every(condition => condition.evaluate(hand));
        this._successes += result ? 1 : 0;
        return result;
    }
    requiredCards(hand) {
        let _hand = hand.slice();
        return this.conditions.flatMap(condition => {
            let cardsUsed = condition.requiredCards(_hand);
            _hand = _hand.filter(card => !cardsUsed.includes(card));
            return cardsUsed;
        });
    }
}
/** Logical OR condition composed of multiple base conditions */
export class OrCondition {
    /**
     * Creates a new OrCondition
     * @param conditions - Array of BaseCondition objects
     */
    constructor(conditions) {
        this.conditions = conditions;
        this._successes = 0;
        if (conditions.some(condition => condition == undefined)) {
            console.error(`Found a dead condition`);
        }
    }
    /** Number of successful evaluations */
    get successes() {
        return this._successes;
    }
    /** Evaluates the OR condition against a hand of cards */
    evaluate(hand) {
        let result = this.conditions.some(condition => condition.evaluate(hand));
        this._successes += result ? 1 : 0;
        return result;
    }
    requiredCards(hand) {
        let _hand = hand.slice();
        return this.conditions.flatMap(condition => {
            let cardsUsed = condition.requiredCards(_hand);
            _hand = _hand.filter(card => !cardsUsed.includes(card));
            return cardsUsed;
        });
    }
}
