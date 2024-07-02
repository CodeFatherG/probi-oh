class Deck {
    constructor(cards) {
        const missingCount = 40 - cards.length;
        if (missingCount > 0) {
            cards.push(...Array(missingCount).fill(new Card("Empty Card", {tags: ["Empty", "Blank", "Non Engine"]})));
        }
        this._cards = cards;
        this._deck_list = cards.slice()
        this.shuffle();
    }

    drawCard() {
        const index = Math.floor(Math.random() * this._cards.length);
        return this._cards.splice(index, 1)[0];
    }

    draw(count) {
        console.log('Drawing hand')
        const hand = [];
        for (let i = 0; i < count; i++) {
            const card = this.drawCard();
            if (card.cardIsFree) {
                console.log(`Card ${card.name} is ${card.cardFreeCount} free cards`)
                hand.push(...this.draw(card.cardFreeCount));
            } else {
                hand.push(card);
            }

            console.log(`Card ${i} is ${card.name}`)
        }

        console.log(`Cards in hand: ${hand.map(card => card.name).join(', ')}`);

        return hand;
    }

    shuffle() {
        console.log('Shuffling the deck')
        for (let i = this._cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this._cards[i], this._cards[j]] = [this._cards[j], this._cards[i]];
        }
    }

    reset() {
        let countBefore = this.deckList.length
        this._cards = this._deck_list.slice()
        this.shuffle()
        console.log(`Resetting the deck from ${countBefore} to ${this.deckList.length}`)
    }

    get deckList() {
        return this._cards;
    }

    get deckCount() {
        return this._cards.length;
    }
}

function buildDeck(deckList) {
    const cards = [];
    for (const [card, details] of Object.entries(deckList)) {
        const qty = details.qty || 1;
        cards.push(...Array(qty).fill(new Card(card, details)));
    }
    return new Deck(cards);
}