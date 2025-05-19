export interface CardInformation {
    id: number;
    name: string;
    type: string;
    desc: string;
    atk?: number;
    def?: number;
    level?: number;
    race: string;
    attribute?: string;
    archetype?: string;
    card_prices?: Record<string, string>[];
    card_images: {
        id: number;
        image_url: string;
        image_url_small: string;
        image_url_cropped: string;
    }[];
}