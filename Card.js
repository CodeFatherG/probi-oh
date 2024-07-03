class Card {
    constructor(cardName, cardDetails) {
        this._name = cardName;
        this._details = cardDetails;
        this._tags = cardDetails.tags || null;
        this._free = cardDetails.free || null;
    }

    get name() {
        return this._name;
    }

    get nameLower() {
        return this.name.toLowerCase();
    }

    get tags() {
        return this._tags;
    }

    get details() {
        return this._details;
    }

    get cardIsFree() {
        return this._free != null;
    }

    processFreeCard(deck) {
        if (!this.cardIsFree) return [];
        
        const cost = this._free.cost || 0;
        const count = this._free.cards || 0;
        const destination = this._free.destination || 0;

        console.log(`Sending ${cost} cards to ${count} for ${count} cards`);

        if (cost + count > deck.deckCount) {
            return [];
        }

        if (destination == 'grave') {
            deck.mill(cost);
        } else {
            deck.banish(cost);
        }

        return deck.draw(count);
    }
}