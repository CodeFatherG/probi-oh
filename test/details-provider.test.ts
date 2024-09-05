import { CardDetails, CostType, ConditionType, RestrictionType } from '../src/utils/card-details';
import {CardInformation} from '../src/utils/card-information';
import { getCardDetails } from '../src/utils/details-provider';

describe('getCardDetails', () => {
    // Test for a card with free details
    test('should return correct details for Pot of Desires', async () => {
        const cardInfo: CardInformation = {
            id: 1,
            name: 'Pot of Desires',
            type: 'Spell Card',
            desc: 'Banish 10 cards from the top of your Deck, face-down; draw 2 cards. You can only activate 1 "Pot of Desires" per turn.',
            race: 'Normal',
            card_images: [{ id: 1, image_url: '...', image_url_small: '...', image_url_cropped: '...' }]
        };

        const expectedDetails: CardDetails = {
            tags: ['Normal', 'Spell Card'],
            free: {
                count: 2,
                oncePerTurn: true,
                cost: {
                    type: CostType.BanishFromDeck,
                    value: 10
                }
            }
        };

        const result = await getCardDetails(cardInfo);
        expect(result).toEqual(expectedDetails);
    });

    // Test for a card without free details
    test('should return correct details for a card without free details', async () => {
        const cardInfo: CardInformation = {
            id: 2,
            name: 'Blue-Eyes White Dragon',
            type: 'Monster',
            desc: 'This legendary dragon is a powerful engine of destruction.',
            atk: 3000,
            def: 2500,
            level: 8,
            race: 'Dragon',
            attribute: 'LIGHT',
            card_images: [{ id: 2, image_url: '...', image_url_small: '...', image_url_cropped: '...' }]
        };

        const expectedDetails: CardDetails = {
            tags: ['Dragon', 'Monster', 'LIGHT', 'Level 8']
        };

        const result = await getCardDetails(cardInfo);
        expect(result).toEqual(expectedDetails);
    });

    // Test for Allure of Darkness (to cover ConditionType)
    test('should return correct details for Allure of Darkness', async () => {
        const cardInfo: CardInformation = {
            id: 3,
            name: 'Allure of Darkness',
            type: 'Spell Card',
            desc: 'Draw 2 cards, then banish 1 DARK monster from your hand, or, if you do not have any in your hand, send your entire hand to the GY.',
            race: 'Normal',
            card_images: [{ id: 3, image_url: '...', image_url_small: '...', image_url_cropped: '...' }]
        };

        const expectedDetails: CardDetails = {
            tags: ['Normal', 'Spell Card'],
            free: {
                count: 2,
                oncePerTurn: false,
                condition: {
                    type: ConditionType.BanishFromHand,
                    value: "DARK"
                }
            }
        };

        const result = await getCardDetails(cardInfo);
        expect(result).toEqual(expectedDetails);
    });

    // Test for Pot of Extravagance (to cover RestrictionType)
    test('should return correct details for Pot of Extravagance', async () => {
        const cardInfo: CardInformation = {
            id: 4,
            name: 'Pot of Extravagance',
            type: 'Spell Card',
            desc: 'At the start of your Main Phase 1: Banish 3 or 6 random face-down cards from your Extra Deck, face-down; draw 1 card for every 3 cards banished. For the rest of this turn after this card resolves, you cannot draw any cards by card effects.',
            race: 'Normal',
            card_images: [{ id: 4, image_url: '...', image_url_small: '...', image_url_cropped: '...' }]
        };

        const expectedDetails: CardDetails = {
            tags: ['Normal', 'Spell Card'],
            free: {
                count: 2,
                oncePerTurn: false,
                restriction: [RestrictionType.NoPreviousDraws, RestrictionType.NoMoreDraws]
            }
        };

        const result = await getCardDetails(cardInfo);
        expect(result).toEqual(expectedDetails);
    });

    // Test for a card with all possible attributes
    test('should return correct details for a card with all attributes', async () => {
        const cardInfo: CardInformation = {
            id: 5,
            name: 'Stardust Dragon',
            type: 'Monster',
            desc: 'When a card or effect is activated that would destroy a card(s) on the field...',
            atk: 2500,
            def: 2000,
            level: 8,
            race: 'Dragon',
            attribute: 'WIND',
            card_images: [{ id: 5, image_url: '...', image_url_small: '...', image_url_cropped: '...' }]
        };

        const expectedDetails: CardDetails = {
            tags: ['Dragon', 'Monster', 'WIND', 'Level 8']
        };

        const result = await getCardDetails(cardInfo);
        expect(result).toEqual(expectedDetails);
    });

    // Test for a card with minimal attributes
    test('should return correct details for a card with minimal attributes', async () => {
        const cardInfo: CardInformation = {
            id: 6,
            name: 'Mysterious Spell',
            type: 'Spell Card',
            desc: 'This spell card does something mysterious.',
            race: 'Normal',
            card_images: [{ id: 6, image_url: '...', image_url_small: '...', image_url_cropped: '...' }]
        };

        const expectedDetails: CardDetails = {
            tags: ['Normal', 'Spell Card']
        };

        const result = await getCardDetails(cardInfo);
        expect(result).toEqual(expectedDetails);
    });

    // Test for each card with free details
    const freeCards = [
        'Pot of Desires',
        'Pot of Extravagance',
        'Pot of Prosperity',
        'Upstart Goblin',
        'Allure of Darkness',
        'Into The Void',
        'Pot of Duality',
        'Trade-In',
        'Spellbook of Knowledge'
    ];

    test.each(freeCards)('should return correct free details for %s', async (cardName) => {
        const cardInfo: CardInformation = {
            id: 7,
            name: cardName,
            type: 'Spell Card',
            desc: 'Test description',
            race: 'Normal',
            card_images: [{ id: 7, image_url: '...', image_url_small: '...', image_url_cropped: '...' }]
        };

        const result = await getCardDetails(cardInfo);
        expect(result.free).toBeDefined();
        expect(result.tags).toEqual(['Normal', 'Spell Card']);
    });
});