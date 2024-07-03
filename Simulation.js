class Simulation
{
    constructor(deck, hand, condition)
    {
        this._deck = deck.deepCopy();
        this._hand = hand.map(card => new Card(card.name, { ...card.details }));
        this._condition = condition;
        this._result = false;
    }

    run() {
        this._result = this.condition.evaluate(this._hand);
    }

    get result() {
        return this._result; 
    }

    get condition() {
        return this._condition;
    }

    get deck() {
        return this._deck;
    }
}