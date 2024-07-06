import { getCardById } from '../src/card-api';

describe('getCardById', () => {
    it('should return Great Shogun Shien for ID 63176202', async () => {
        const mockFetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                data: [{
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
                        image_url_small: "https://images.ygoprodeck.com/images/cards_small/63176202.jpg"
                    }]
                }]
            })
        });

        const card = await getCardById(63176202, mockFetch);

        expect(mockFetch).toHaveBeenCalledWith(
            'https://db.ygoprodeck.com/api/v7/cardinfo.php?id=63176202'
        );
        expect(card).not.toBeNull();
        expect(card?.name).toBe("Great Shogun Shien");
        expect(card?.id).toBe(63176202);
        expect(card?.type).toBe("Effect Monster");
        expect(card?.atk).toBe(2500);
        expect(card?.def).toBe(2400);
        expect(card?.level).toBe(7);
        expect(card?.race).toBe("Warrior");
        expect(card?.attribute).toBe("FIRE");
    });

    it('should return null for a non-existent card ID', async () => {
        const mockFetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ data: [] })
        });

        const card = await getCardById(99999999, mockFetch);

        expect(mockFetch).toHaveBeenCalledWith(
            'https://db.ygoprodeck.com/api/v7/cardinfo.php?id=99999999'
        );
        expect(card).toBeNull();
    });

    it('should handle network errors', async () => {
        const mockFetch = jest.fn().mockRejectedValue(new Error('Network error'));

        const card = await getCardById(63176202, mockFetch);

        expect(mockFetch).toHaveBeenCalledWith(
            'https://db.ygoprodeck.com/api/v7/cardinfo.php?id=63176202'
        );
        expect(card).toBeNull();
    });
});