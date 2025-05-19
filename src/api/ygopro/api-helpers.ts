import { CardInformation } from "@/types/card-information";

export function isCardExtraDeck(card: CardInformation): boolean {
    const typeLower = card.type.toLowerCase();
    return typeLower.includes('fusion') 
            || typeLower.includes('synchro') 
            || typeLower.includes('xyz') 
            || typeLower.includes('link');
}