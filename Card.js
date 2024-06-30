class Card {
    constructor(cardName, cardDetails) {
        this._name = cardName;
        this._details = cardDetails;
        this._tags = cardDetails.tags || null;
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

    get cardFreeCount() {
        switch (this.nameLower) {
            case "upstart goblin": return 1;
            case "pot of prosperity":
            case "pot of extravagance": return 6;
            case "pot of duality": return 3;
            case "pot of desires": return 2;
            default: return 0;
        }
    }

    get cardIsFree() {
        return this.cardFreeCount > 0;
    }
}