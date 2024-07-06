// Define the structure of a card
interface CardInformation {
    id: number;
    name: string;
    type: string;
    desc: string;
    atk?: number;
    def?: number;
    level?: number;
    race: string;
    attribute?: string;
    card_images: {
        id: number;
        image_url: string;
        image_url_small: string;
    }[];
}

// Define the structure of the API response
interface ApiResponse {
    data: CardInformation[];
}

export async function getCardById(id: number, fetcher = fetch): Promise<CardInformation | null> {
    const url = `https://db.ygoprodeck.com/api/v7/cardinfo.php?id=${id}`;

    try {
        const response = await fetcher(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: ApiResponse = await response.json();

        if (data.data && data.data.length > 0) {
            return data.data[0];
        } else {
            console.log(`No card found with ID ${id}`);
            return null;
        }
    } catch (error) {
        console.error('Error fetching card data:', error);
        return null;
    }
}

// Optional: Function to get image URL
export function getCardImageUrl(card: CardInformation): string | null {
    if (card.card_images && card.card_images.length > 0) {
        return card.card_images[0].image_url;
    }
    return null;
}