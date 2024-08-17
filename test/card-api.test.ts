// card-api.test.ts

import { getCardById, getCardByName, fuzzySearchCard, getCardImage, clearCardDatabase } from '../src/utils/card-api';
import { IDBPDatabase, openDB } from 'idb';
import { CardInformation } from '../src/utils/card-information';

jest.mock('idb');

describe('card-api', () => {
    let mockDB: Partial<IDBPDatabase<any>>;
    let mockFetch: jest.Mock;
    let mockDBFactory: jest.Mock;
    let consoleErrorSpy: jest.SpyInstance;

    const mockCardData: CardInformation = {
        id: 63176202,
        name: "Great Shogun Shien",
        type: "Effect Monster",
        desc: "Your opponent can only activate 1 Spell/Trap Card each turn. If you control 2 or more face-up Six Samurai monsters, you can Special Summon this card (from your hand).",
        atk: 2500,
        def: 2400,
        level: 7,
        race: "Warrior",
        attribute: "FIRE",
        card_images: [{
            id: 63176202,
            image_url: "https://images.ygoprodeck.com/images/cards/63176202.jpg",
            image_url_small: "https://images.ygoprodeck.com/images/cards_small/63176202.jpg",
            image_url_cropped: "https://images.ygoprodeck.com/images/cards_cropped/63176202.jpg"
        }]
    };

    beforeEach(() => {
        mockDB = {
            get: jest.fn(),
            put: jest.fn(),
            clear: jest.fn().mockResolvedValue(undefined),
            transaction: jest.fn(),
        };

        mockDBFactory = jest.fn().mockResolvedValue(mockDB);

        mockFetch = jest.fn();
        global.fetch = mockFetch;

        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.clearAllMocks();
        consoleErrorSpy.mockRestore();
    });

    describe('clearCardDatabase', () => {
        it('should clear both cards and images stores', async () => {
            await clearCardDatabase(mockDBFactory);
            
            expect(mockDB.clear).toHaveBeenCalledTimes(2);
            expect(mockDB.clear).toHaveBeenCalledWith('cards');
            expect(mockDB.clear).toHaveBeenCalledWith('images');
        });
    });

    describe('getCardById', () => {
        it('should return cached card if available', async () => {
            (mockDB.get as jest.Mock).mockResolvedValue(mockCardData);
            const card = await getCardById(63176202, mockFetch, mockDBFactory);
            expect(card).toEqual(mockCardData);
            expect(mockDB.get).toHaveBeenCalledWith('cards', '63176202');
            expect(mockFetch).not.toHaveBeenCalled();
        });

        it('should fetch and cache card if not in database', async () => {
            (mockDB.get as jest.Mock).mockResolvedValue(undefined);
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => ({ data: [mockCardData] })
            });
            
            const card = await getCardById(63176202, mockFetch, mockDBFactory);

            expect(card).toEqual(mockCardData);
            expect(mockFetch).toHaveBeenCalledWith(
                new URL('https://db.ygoprodeck.com/api/v7/cardinfo.php?id=63176202')
            );
            expect(mockDB.put).toHaveBeenCalledWith('cards', mockCardData, '63176202');
            expect(mockDB.put).toHaveBeenCalledWith('cards', mockCardData, 'Great Shogun Shien');
        });

        it('should return null for a non-existent card ID', async () => {
            (mockDB.get as jest.Mock).mockResolvedValue(undefined);
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => ({ data: [] })
            });

            const card = await getCardById(99999999, mockFetch, mockDBFactory);

            expect(card).toBeNull();
        });

        it('should handle network errors', async () => {
            (mockDB.get as jest.Mock).mockResolvedValue(undefined);
            mockFetch.mockRejectedValue(new Error('Network error'));
    
            const card = await getCardById(63176202, mockFetch, mockDBFactory);
    
            expect(card).toBeNull();
            expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching card data:', expect.any(Error));
        });
    
        it('should handle HTTP errors', async () => {
            (mockDB.get as jest.Mock).mockResolvedValue(undefined);
            mockFetch.mockResolvedValue({
                ok: false,
                status: 404,
                statusText: 'Not Found'
            });
    
            const card = await getCardById(12345, mockFetch, mockDBFactory);
    
            expect(card).toBeNull();
            expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching card data:', expect.any(Error));
        });
    });

    describe('getCardByName', () => {
        it('should return cached card if available', async () => {
            (mockDB.get as jest.Mock).mockResolvedValue(mockCardData);
            const card = await getCardByName('Great Shogun Shien', mockFetch, mockDBFactory);
            expect(card).toEqual(mockCardData);
            expect(mockDB.get).toHaveBeenCalledWith('cards', 'Great Shogun Shien');
            expect(mockFetch).not.toHaveBeenCalled();
        });

        it('should fetch and cache card if not in database', async () => {
            (mockDB.get as jest.Mock).mockResolvedValue(undefined);
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => ({ data: [mockCardData] })
            });
            
            const card = await getCardByName('Great Shogun Shien', mockFetch, mockDBFactory);

            expect(card).toEqual(mockCardData);
            expect(mockFetch).toHaveBeenCalledWith(
                new URL('https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Great%20Shogun%20Shien')
            );
            expect(mockDB.put).toHaveBeenCalledWith('cards', mockCardData, '63176202');
            expect(mockDB.put).toHaveBeenCalledWith('cards', mockCardData, 'Great Shogun Shien');
        });

        it('should return null for a non-existent card name', async () => {
            (mockDB.get as jest.Mock).mockResolvedValue(undefined);
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => ({ data: [] })
            });

            const card = await getCardByName('Non-existent Card', mockFetch, mockDBFactory);

            expect(card).toBeNull();
        });

        it('should handle HTTP errors', async () => {
            (mockDB.get as jest.Mock).mockResolvedValue(undefined);
            mockFetch.mockResolvedValue({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error'
            });
    
            const card = await getCardByName('Error Card', mockFetch, mockDBFactory);
    
            expect(card).toBeNull();
            expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching card data:', expect.any(Error));
        });
    });

    describe('fuzzySearchCard', () => {
        it('should fetch and cache cards matching the query', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => ({ data: [mockCardData] })
            });
            
            const cards = await fuzzySearchCard('Shogun', mockFetch, mockDBFactory);

            expect(cards).toEqual([mockCardData]);
            expect(mockFetch).toHaveBeenCalledWith(
                new URL('https://db.ygoprodeck.com/api/v7/cardinfo.php?fname=Shogun')
            );
            expect(mockDB.put).toHaveBeenCalledWith('cards', mockCardData, '63176202');
            expect(mockDB.put).toHaveBeenCalledWith('cards', mockCardData, 'Great Shogun Shien');
        });

        it('should return an empty array for no matches', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => ({ data: [] })
            });

            const cards = await fuzzySearchCard('Non-existent', mockFetch, mockDBFactory);

            expect(cards).toEqual([]);
        });

        it('should handle HTTP errors', async () => {
            mockFetch.mockResolvedValue({
                ok: false,
                status: 503,
                statusText: 'Service Unavailable'
            });
    
            const cards = await fuzzySearchCard('Error', mockFetch, mockDBFactory);
    
            expect(cards).toEqual([]);
            expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching card data:', expect.any(Error));
        });
    });

    describe('getCardImage', () => {
        const mockBlob = new Blob(['mock image data'], { type: 'image/jpeg' });

        it('should return cached image if available', async () => {
            (mockDB.get as jest.Mock).mockResolvedValueOnce(mockCardData)
                                     .mockResolvedValueOnce(mockBlob);
            
            const image = await getCardImage(63176202, mockFetch, mockDBFactory);

            expect(image).toEqual(mockBlob);
            expect(mockDB.get).toHaveBeenCalledWith('images', mockCardData.card_images[0].image_url);
        });

        it('should fetch and cache image if not in database', async () => {
            (mockDB.get as jest.Mock).mockResolvedValueOnce(mockCardData)
                                     .mockResolvedValueOnce(undefined);
            mockFetch.mockResolvedValue({
                ok: true,
                blob: async () => mockBlob
            });
            
            const image = await getCardImage('Great Shogun Shien', mockFetch, mockDBFactory);

            expect(image).toEqual(mockBlob);
            expect(mockFetch).toHaveBeenCalledWith(mockCardData.card_images[0].image_url);
            expect(mockDB.put).toHaveBeenCalledWith('images', mockBlob, mockCardData.card_images[0].image_url);
        });

        it('should return null if card is not found', async () => {
            (mockDB.get as jest.Mock).mockResolvedValue(null);
            
            const image = await getCardImage('Non-existent Card', mockFetch, mockDBFactory);

            expect(image).toBeNull();
        });

        it('should handle HTTP errors when fetching image', async () => {
            (mockDB.get as jest.Mock).mockResolvedValueOnce(mockCardData)
                                     .mockResolvedValueOnce(undefined);
            mockFetch.mockResolvedValue({
                ok: false,
                status: 404,
                statusText: 'Not Found'
            });
    
            const image = await getCardImage('Error Image', mockFetch, mockDBFactory);
    
            expect(image).toBeNull();
            expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching image:', expect.any(Error));
        });
    });
});