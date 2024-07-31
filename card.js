/**
 * Represents a card in the game.
 * @class
 */
class Card {
    /**
     * Creates an instance of Card.
     * @param {string} cardName - The name of the card.
     * @param {CardDetails} cardDetails - The details of the card.
     */
    constructor(cardName, cardDetails) {
        this._name = cardName;
        this._details = cardDetails;
        this._tags = cardDetails.tags || null;
    }
    /**
     * Gets the name of the card.
     * @returns {string} The card's name.
     */
    get name() {
        return this._name;
    }
    /**
     * Gets the lowercase name of the card.
     * @returns {string} The card's name in lowercase.
     */
    get nameLower() {
        return this.name.toLowerCase();
    }
    /**
     * Gets the tags associated with the card.
     * @returns {readonly string[] | null} An array of tags or null if no tags are present.
     */
    get tags() {
        return this._tags;
    }
    /**
     * Gets the details of the card.
     * @returns {Readonly<CardDetails>} The card's details.
     */
    get details() {
        return this._details;
    }
    /**
     * Checks if the card is free.
     * @returns {boolean} True if the card is free, false otherwise.
     */
    get isFree() {
        return false;
    }
}
class FreeCard extends Card {
    constructor(cardName, cardDetails) {
        super(cardName, cardDetails);
    }
    get isFree() {
        return true;
    }
    get count() {
        return this.details.free.count ? this.details.free.count : 0;
    }
    get oncePerTurn() {
        return this.details.free.oncePerTurn;
    }
    get restrictions() {
        var _a;
        return ((_a = this.details.free) === null || _a === void 0 ? void 0 : _a.restriction) || [];
    }
    get cost() {
        var _a, _b;
        return (_b = (_a = this.details.free) === null || _a === void 0 ? void 0 : _a.cost) !== null && _b !== void 0 ? _b : null;
    }
    get condition() {
        var _a, _b;
        return (_b = (_a = this.details.free) === null || _a === void 0 ? void 0 : _a.condition) !== null && _b !== void 0 ? _b : null;
    }
    get excavate() {
        var _a, _b;
        return (_b = (_a = this.details.free) === null || _a === void 0 ? void 0 : _a.excavate) !== null && _b !== void 0 ? _b : null;
    }
}
export function CreateCard(cardName, cardDetails) {
    if (cardDetails.free) {
        return new FreeCard(cardName, cardDetails);
    }
    return new Card(cardName, cardDetails);
}
