import { CreateCard } from "@server/card";
import { MockDeck } from "../mock/deck.mock";
import { MockGameState } from "../mock/game-state.mock";

describe("Game State Tests", () => {
    let mockDeck: MockDeck;
    let mockGameState: MockGameState;

    beforeEach(() => {
        mockDeck = new MockDeck();
        mockGameState = new MockGameState(mockDeck);
    });

    test("should allow modification of deck and hand", () => {
        const testCard1 = CreateCard("Test Card 1", { /* card details */ });
        const testCard2 = CreateCard("Test Card 2", { /* card details */ });

        mockDeck.setDeckList([testCard1, testCard2]);
        expect(mockDeck.deckCount).toBe(2);

        mockGameState.setHand([testCard1]);
        expect(mockGameState.hand.length).toBe(1);
        expect(mockGameState.hand[0].name).toBe("Test Card 1");

        mockGameState.addCardToHand(testCard2);
        expect(mockGameState.hand.length).toBe(2);

        const removedCard = mockGameState.removeCardFromHand("Test Card 1");
        expect(removedCard?.name).toBe("Test Card 1");
        expect(mockGameState.hand.length).toBe(1);
    });
});