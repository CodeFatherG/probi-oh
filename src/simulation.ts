class Simulation {
    private _deck: Deck;
    private _hand: Card[];
    private _condition: BaseCondition;
    private _result: boolean;

    constructor(deck: Deck, hand: Card[], condition: BaseCondition) {
        this._deck = deck.deepCopy();
        this._hand = hand.map(card => new Card(card.name, { ...card.details }));
        this._condition = condition;
        this._result = false;
    }

    run(): void {
        this._result = this._condition.evaluate(this._hand);
    }

    get result(): boolean {
        return this._result; 
    }

    get condition(): BaseCondition {
        return this._condition;
    }

    get deck(): Deck {
        return this._deck;
    }
}