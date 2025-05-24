import { getCardImage } from "@api/probi-oh/card-image";
import { CardInformation } from "@/types/card-information";
import { IDBPDatabase } from "idb";
import { clearCardDatabase } from "@api/probi-oh/image-idb";

jest.mock('idb');

describe('card-image', () => {
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
});