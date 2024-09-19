import { CreateCard, FreeCard } from "../src/core/data/card";
import { Condition } from "../src/core/sim/condition";
import { MockSimulationBranch } from "./mock/simulation-branch.mock";
import { freeCardMap } from "../src/core/ygo/free-card-map";
import { MockGameState } from "./mock/game-state.mock";
import { MockDeck } from "./mock/deck.mock";
import { processFreeCard } from "../src/core/sim/free-card-processor";

describe('FreeCardMap', () => {
    let mockGameState: MockGameState;

    beforeEach(() => {
        mockGameState = new MockGameState(new MockDeck([]));
    });
    
    it('should process Pot of Desires correctly', () => {
        const potOfDesires = CreateCard('Pot of Desires', { free: freeCardMap['Pot of Desires'] }) as FreeCard;
        mockGameState.addCardToHand(potOfDesires);
        mockGameState.mockDeck.setDeckList([...Array(20)].map((_, i) => CreateCard(`Deck Card ${i}`, {})));
        const condition = new Condition('Test Card', 1);
        const simulationBranch = new MockSimulationBranch(mockGameState, condition);

        processFreeCard(simulationBranch, potOfDesires);

        expect(simulationBranch.gameState.banishPile.length).toBe(10);
        expect(simulationBranch.gameState.hand.length).toBe(2);
        expect(simulationBranch.gameState.cardsPlayedThisTurn.length).toBe(1);
    });

    it('should process Pot of Extravagance correctly', () => {
        const potOfExtravagance = CreateCard('Pot of Extravagance', { free: freeCardMap['Pot of Extravagance'] }) as FreeCard;
        mockGameState.addCardToHand(potOfExtravagance);
        mockGameState.mockDeck.setDeckList([...Array(5)].map((_, i) => CreateCard(`Deck Card ${i}`, {})));
        const condition = new Condition('Test Card', 1);
        const simulationBranch = new MockSimulationBranch(mockGameState, condition);

        processFreeCard(simulationBranch, potOfExtravagance);

        expect(simulationBranch.gameState.hand.length).toBe(2);
        expect(simulationBranch.gameState.cardsPlayedThisTurn.length).toBe(1);
    });

    describe('Pot of Prosperity', () => {
        it('should select 1 card from 6', () => {
            const potOfProsperity = CreateCard('Pot of Prosperity', { free: freeCardMap['Pot of Prosperity'] }) as FreeCard;
            mockGameState.addCardToHand(potOfProsperity);
            mockGameState.mockDeck.setDeckList([...Array(10)].map((_, i) => CreateCard(`Deck Card ${i}`, {})));
            const condition = new Condition('Test Card', 1);
            const simulationBranch = new MockSimulationBranch(mockGameState, condition);
    
            processFreeCard(simulationBranch, potOfProsperity);
    
            expect(simulationBranch.gameState.hand.length).toBe(1);
            expect(simulationBranch.gameState.deck.deckCount).toBe(9);
            expect(simulationBranch.gameState.cardsPlayedThisTurn.length).toBe(1);
        });

        it('should select the right 1 card from 6', () => {
            const potOfProsperity = CreateCard('Pot of Prosperity', { free: freeCardMap['Pot of Prosperity'] }) as FreeCard;
            mockGameState.addCardToHand(potOfProsperity);
            mockGameState.mockDeck.setDeckList([CreateCard('Test Card', {}), ...[...Array(5)].map((_, i) => CreateCard(`Deck Card ${i}`, {}))]);
            const condition = new Condition('Test Card', 1);
            const simulationBranch = new MockSimulationBranch(mockGameState, condition);
    
            processFreeCard(simulationBranch, potOfProsperity);
    
            expect(simulationBranch.gameState.hand.length).toBe(1);
            expect(simulationBranch.gameState.hand[0].name).toBe('Test Card');
            expect(simulationBranch.gameState.deck.deckCount).toBe(5);
            expect(simulationBranch.gameState.cardsPlayedThisTurn.length).toBe(1);
        });
    });

    it('should process Upstart Goblin correctly', () => {
        const upstartGoblin = CreateCard('Upstart Goblin', { free: freeCardMap['Upstart Goblin'] }) as FreeCard;
        mockGameState.addCardToHand(upstartGoblin);
        mockGameState.mockDeck.setDeckList([CreateCard('Deck Card', {})]);
        const condition = new Condition('Test Card', 1);
        const simulationBranch = new MockSimulationBranch(mockGameState, condition);

        processFreeCard(simulationBranch, upstartGoblin);

        expect(simulationBranch.gameState.hand.length).toBe(1);
        expect(simulationBranch.gameState.cardsPlayedThisTurn.length).toBe(1);
    });

    describe('Allure of Darkness', () => {
        it('should process Allure of Darkness with a dark in hand', () => {
            const allureOfDarkness = CreateCard('Allure of Darkness', { free: freeCardMap['Allure of Darkness'] }) as FreeCard;
            const darkMonster = CreateCard('Dark Monster', { tags: ['DARK'] });
            mockGameState.setHand([allureOfDarkness, darkMonster]);
            mockGameState.mockDeck.setDeckList([CreateCard('Deck Card 1', {}), CreateCard('Deck Card 2', {})]);
            const condition = new Condition('Test Card', 1);
            const simulationBranch = new MockSimulationBranch(mockGameState, condition);
    
            processFreeCard(simulationBranch, allureOfDarkness);
    
            expect(simulationBranch.gameState.hand.length).toBe(2);
            expect(simulationBranch.gameState.banishPile.length).toBe(1);
            expect(simulationBranch.gameState.cardsPlayedThisTurn.length).toBe(1);
        });

        it('should process Allure of Darkness drawing a dark', () => {
            const allureOfDarkness = CreateCard('Allure of Darkness', { free: freeCardMap['Allure of Darkness'] }) as FreeCard;
            const darkMonster = CreateCard('Dark Monster', { tags: ['DARK'] });
            mockGameState.setHand([allureOfDarkness]);
            mockGameState.mockDeck.setDeckList([CreateCard('Deck Card 1', {}), darkMonster]);
            const condition = new Condition('Test Card', 1);
            const simulationBranch = new MockSimulationBranch(mockGameState, condition);
    
            processFreeCard(simulationBranch, allureOfDarkness);
    
            expect(simulationBranch.gameState.hand.length).toBe(1);
            expect(simulationBranch.gameState.banishPile.length).toBe(1);
            expect(simulationBranch.gameState.cardsPlayedThisTurn.length).toBe(1);
        });

        it('should discard all if no dark is drawn', () => {
            const allureOfDarkness = CreateCard('Allure of Darkness', { free: freeCardMap['Allure of Darkness'] }) as FreeCard;
            mockGameState.setHand([allureOfDarkness]);
            mockGameState.mockDeck.setDeckList([...Array(2)].map((_, i) => CreateCard(`Deck Card ${i}`, {})));
            const condition = new Condition('Test Card', 1);
            const simulationBranch = new MockSimulationBranch(mockGameState, condition);
    
            processFreeCard(simulationBranch, allureOfDarkness);
    
            expect(simulationBranch.gameState.hand.length).toBe(0);
            expect(simulationBranch.gameState.banishPile.length).toBe(0);
            expect(simulationBranch.gameState.graveyard.length).toBe(2);
            expect(simulationBranch.gameState.cardsPlayedThisTurn.length).toBe(1);
        });

        it('should pay card not satisfactory', () => {
            const allureOfDarkness = CreateCard('Allure of Darkness', { free: freeCardMap['Allure of Darkness'] }) as FreeCard;
            const wrongDarkMonster = CreateCard('Wrong Dark Monster', { tags: ['DARK'] });
            const rightDarkMonster = CreateCard('Right Dark Monster', { tags: ['DARK'] });
            mockGameState.setHand([allureOfDarkness, wrongDarkMonster]);
            mockGameState.mockDeck.setDeckList([CreateCard('Deck Card 1', {}), rightDarkMonster]);
            const condition = new Condition('Right Dark Monster', 1);
            const simulationBranch = new MockSimulationBranch(mockGameState, condition);
    
            processFreeCard(simulationBranch, allureOfDarkness);
    
            expect(simulationBranch.gameState.hand.length).toBe(2);
            expect(simulationBranch.gameState.hand.some(c => c.name === 'Right Dark Monster')).toBe(true);
            expect(simulationBranch.gameState.banishPile.length).toBe(1);
            expect(simulationBranch.gameState.banishPile.some(c => c.name === 'Wrong Dark Monster')).toBe(true);
            expect(simulationBranch.gameState.cardsPlayedThisTurn.length).toBe(1);
        });
    });

    it('should process Into The Void correctly', () => {
        const intoTheVoid = CreateCard('Into The Void', { free: freeCardMap['Into The Void'] }) as FreeCard;
        mockGameState.addCardToHand(intoTheVoid);
        mockGameState.mockDeck.setDeckList([CreateCard('Deck Card', {})]);
        const condition = new Condition('Test Card', 1);
        const simulationBranch = new MockSimulationBranch(mockGameState, condition);

        processFreeCard(simulationBranch, intoTheVoid);

        expect(simulationBranch.gameState.hand.length).toBe(1);
        expect(simulationBranch.gameState.cardsPlayedThisTurn.length).toBe(1);
    });

    describe ('Pot of Duality', () => {
        it('should process pull 1 card of 3', () => {
            const potOfDuality = CreateCard('Pot of Duality', { free: freeCardMap['Pot of Duality'] }) as FreeCard;
            mockGameState.addCardToHand(potOfDuality);
            mockGameState.mockDeck.setDeckList([...Array(3)].map((_, i) => CreateCard(`Deck Card ${i}`, {})));
            const condition = new Condition('Test Card', 1);
            const simulationBranch = new MockSimulationBranch(mockGameState, condition);
    
            processFreeCard(simulationBranch, potOfDuality);
    
            expect(simulationBranch.gameState.hand.length).toBe(1);
            expect(simulationBranch.gameState.deck.deckCount).toBe(2);
            expect(simulationBranch.gameState.cardsPlayedThisTurn.length).toBe(1);
        });

        it('should pull the right card of 3', () => {
            const potOfDuality = CreateCard('Pot of Duality', { free: freeCardMap['Pot of Duality'] }) as FreeCard;
            mockGameState.addCardToHand(potOfDuality);
            mockGameState.mockDeck.setDeckList([CreateCard('Test Card', {}), ...[...Array(2)].map((_, i) => CreateCard(`Deck Card ${i}`, {}))]);
            const condition = new Condition('Test Card', 1);
            const simulationBranch = new MockSimulationBranch(mockGameState, condition);
    
            processFreeCard(simulationBranch, potOfDuality);
    
            expect(simulationBranch.gameState.hand.length).toBe(1);
            expect(simulationBranch.gameState.hand[0].name).toBe('Test Card');
            expect(simulationBranch.gameState.deck.deckCount).toBe(2);
            expect(simulationBranch.gameState.cardsPlayedThisTurn.length).toBe(1);
        });
    });

    it('should process Trade-In correctly', () => {
        const tradeIn = CreateCard('Trade-In', { free: freeCardMap['Trade-In'] }) as FreeCard;
        const level8Monster = CreateCard('Level 8 Monster', { tags: ['Level 8'] });
        mockGameState.setHand([tradeIn, level8Monster]);
        mockGameState.mockDeck.setDeckList([CreateCard('Deck Card 1', {}), CreateCard('Deck Card 2', {})]);
        const condition = new Condition('Test Card', 1);
        const simulationBranch = new MockSimulationBranch(mockGameState, condition);

        processFreeCard(simulationBranch, tradeIn);

        expect(simulationBranch.gameState.hand.length).toBe(2);
        expect(simulationBranch.gameState.graveyard.length).toBe(1);
        expect(simulationBranch.gameState.cardsPlayedThisTurn.length).toBe(1);
    });

    it('should process Spellbook of Knowledge correctly', () => {
        const spellbookOfKnowledge = CreateCard('Spellbook of Knowledge', { free: freeCardMap['Spellbook of Knowledge'] }) as FreeCard;
        const spellcaster = CreateCard('Spellcaster', { tags: ['Spellcaster'] });
        mockGameState.setHand([spellbookOfKnowledge, spellcaster]);
        mockGameState.mockDeck.setDeckList([CreateCard('Deck Card 1', {}), CreateCard('Deck Card 2', {})]);
        const condition = new Condition('Test Card', 1);
        const simulationBranch = new MockSimulationBranch(mockGameState, condition);

        processFreeCard(simulationBranch, spellbookOfKnowledge);

        expect(simulationBranch.gameState.hand.length).toBe(2);
        expect(simulationBranch.gameState.graveyard.length).toBe(1);
        expect(simulationBranch.gameState.cardsPlayedThisTurn.length).toBe(1);
    });
});