// card-api.test.ts

import { getCard, fuzzySearchCard, getCardImage, clearCardDatabase, getArchetypes } from '@ygo/card-api';
import { IDBPDatabase, openDB } from 'idb';
import { CardInformation } from '@ygo/card-information';

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
            image_url: "https://raw.githubusercontent.com/CodeFatherG/yugioh-db/master/cards/63176202/images/full.jpg",
            image_url_small: "https://raw.githubusercontent.com/CodeFatherG/yugioh-db/master/cards/63176202/images/small.jpg",
            image_url_cropped: "https://raw.githubusercontent.com/CodeFatherG/yugioh-db/master/cards/63176202/images/cropped.jpg"
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
            
            expect(mockDB.clear).toHaveBeenCalledTimes(1);
            expect(mockDB.clear).toHaveBeenCalledWith('images');
        });
    });

    describe('getCard', () => {
        it('should fetch card', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => ({ data: [mockCardData] })
            });
            
            const card = await getCard(63176202, mockFetch, mockDBFactory);

            expect(card).toEqual(mockCardData);
            expect(mockFetch).toHaveBeenCalledWith(expect.any(URL));
            expect(mockFetch.mock.calls[0][0].toString()).toBe(
                'https://db.ygoprodeck.com/api/v7/cardinfo.php?id=63176202'
            );
        });

        it('should return null for a non-existent card ID', async () => {
            (mockDB.get as jest.Mock).mockResolvedValue(undefined);
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => ({ data: [] })
            });

            const card = await getCard(99999999, mockFetch, mockDBFactory);

            expect(card).toBeNull();
        });

        it('should handle network errors', async () => {
            (mockDB.get as jest.Mock).mockResolvedValue(undefined);
            mockFetch.mockRejectedValue(new Error('Network error'));
    
            const card = await getCard(63176202, mockFetch, mockDBFactory);
    
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
    
            const card = await getCard(12345, mockFetch, mockDBFactory);
    
            expect(card).toBeNull();
            expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching card data:', expect.any(Error));
        });
    });

    describe('getCardByName', () => {
        it('should fetch card if not in database', async () => {
            (mockDB.get as jest.Mock).mockResolvedValue(undefined);
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => ({ data: [mockCardData] })
            });
            
            const card = await getCard('Great Shogun Shien', mockFetch, mockDBFactory);

            expect(card).toEqual(mockCardData);
            expect(mockFetch).toHaveBeenCalledWith(expect.any(URL));
            expect(mockFetch.mock.calls[0][0].toString()).toBe(
                'https://db.ygoprodeck.com/api/v7/cardinfo.php?name=Great+Shogun+Shien'
            );
        });

        it('should return null for a non-existent card name', async () => {
            (mockDB.get as jest.Mock).mockResolvedValue(undefined);
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => ({ data: [] })
            });

            const card = await getCard('Non-existent Card', mockFetch, mockDBFactory);

            expect(card).toBeNull();
        });

        it('should handle HTTP errors', async () => {
            (mockDB.get as jest.Mock).mockResolvedValue(undefined);
            mockFetch.mockResolvedValue({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error'
            });
    
            const card = await getCard('Error Card', mockFetch, mockDBFactory);
    
            expect(card).toBeNull();
            expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching card data:', expect.any(Error));
        });
    });

    describe('fuzzySearchCard', () => {
        it('should fetch cards matching the query', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => ({ data: [mockCardData] })
            });
            
            const cards = await fuzzySearchCard('Shogun', mockFetch);

            expect(cards).toEqual([mockCardData]);
            expect(mockFetch).toHaveBeenCalledWith(expect.any(URL));
            expect(mockFetch.mock.calls[0][0].toString()).toBe(
                'https://db.ygoprodeck.com/api/v7/cardinfo.php?fname=Shogun'
            );
        });

        it('should return an empty array for no matches', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => ({ data: [] })
            });

            const cards = await fuzzySearchCard('Non-existent', mockFetch);

            expect(cards).toEqual([]);
        });

        it('should handle HTTP errors', async () => {
            mockFetch.mockResolvedValue({
                ok: false,
                status: 503,
                statusText: 'Service Unavailable'
            });
    
            const cards = await fuzzySearchCard('Error', mockFetch);
    
            expect(cards).toEqual([]);
            expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching card data:', expect.any(Error));
        });
    });

    describe('getCardImage', () => {
        const mockBlob = new Blob(['mock image data'], { type: 'image/jpeg' });

        it('should return cached image if available', async () => {
            (mockDB.get as jest.Mock).mockResolvedValueOnce(mockBlob);
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => ({ data: [mockCardData] })
            });
            
            const image = await getCardImage(63176202, 'full', mockFetch, mockDBFactory);

            expect(image).toEqual(mockBlob);
            expect(mockDB.get).toHaveBeenCalledWith('images', mockCardData.card_images[0].image_url);
        });

        it('should fetch and cache image if not in database', async () => {
            (mockDB.get as jest.Mock).mockResolvedValueOnce(undefined);
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ data: [mockCardData] })
            })
            .mockResolvedValueOnce({
                ok: true,
                blob: async () => mockBlob
            });
            
            const image = await getCardImage('Great Shogun Shien', 'full', mockFetch, mockDBFactory);

            expect(image).toEqual(mockBlob);
            expect(mockFetch).toHaveBeenCalledWith(mockCardData.card_images[0].image_url);
            expect(mockDB.put).toHaveBeenCalledWith('images', mockBlob, mockCardData.card_images[0].image_url);
        });

        it('should return null if card is not found', async () => {
            (mockDB.get as jest.Mock).mockResolvedValue(null);
            
            const image = await getCardImage('Non-existent Card', 'full', mockFetch, mockDBFactory);

            expect(image).toBeNull();
        });

        it('should handle HTTP errors when fetching image', async () => {
            (mockDB.get as jest.Mock).mockResolvedValueOnce(undefined);
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ data: [mockCardData] })
            })
            .mockResolvedValueOnce({
                ok: false,
                status: 404,
                statusText: 'Not Found'
            });
    
            const image = await getCardImage('Error Image', 'full', mockFetch, mockDBFactory);
    
            expect(image).toBeNull();
            expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching image:', expect.any(Error));
        });
    });
    
    describe('getArchetypes', () => {
        const mockArchetypesResponse = [
            { archetype_name: "Abc" },
            { archetype_name: "Xyz" },
            { archetype_name: "123" }
        ];
        const mockArchetypes = ["Abc", "Xyz", "123"];
    
        it('should fetch archetypes', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => mockArchetypesResponse
            });
            
            const archetypes = await getArchetypes(mockFetch);
    
            expect(archetypes).toEqual(mockArchetypes);
            expect(mockFetch).toHaveBeenCalledWith(
                new URL('https://db.ygoprodeck.com/api/v7/archetypes.php')
            );
        }); 
    
        it('should return an empty array on fetch error', async () => {
            (mockDB.get as jest.Mock).mockResolvedValue(undefined);
            mockFetch.mockRejectedValue(new Error('Network error'));
    
            const archetypes = await getArchetypes(mockFetch);
    
            expect(archetypes).toEqual([]);
            expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching archetypes:', expect.any(Error));
        });
    
        it('should handle HTTP errors', async () => {
            (mockDB.get as jest.Mock).mockResolvedValue(undefined);
            mockFetch.mockResolvedValue({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error'
            });
    
            const archetypes = await getArchetypes(mockFetch);
    
            expect(archetypes).toEqual([]);
            expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching archetypes:', expect.any(Error));
        });
    });
});