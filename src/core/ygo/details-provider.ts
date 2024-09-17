import { CardDetails } from '../data/card-details';
import { CardInformation } from './card-information';
import { freeCardMap } from './free-card-map';

export async function getCardDetails(info: CardInformation): Promise<CardDetails> {
    const details: CardDetails = {
        tags: [
            info.race,
            info.type,
            ...(info.archetype ? [info.archetype] : []),
            ...(info.attribute ? [info.attribute] : []),
            ...(info.level !== undefined ? [`Level ${info.level}`] : []),
        ].filter(Boolean)
    };

    const freeDetails = freeCardMap[info.name];
    if (freeDetails) {
        details.free = freeDetails;
    }

    // Normalise types
    if (info.type?.includes('Monster') 
        && !details.tags?.includes('Monster')) {
        details.tags?.push('Monster');
    }

    if (info.type?.includes('Spell') 
        && !details.tags?.includes('Spell')) {
        details.tags?.push('Spell');
    }

    if (info.type?.includes('Trap') 
        && !details.tags?.includes('Trap')) {
        details.tags?.push('Trap');
    }

    return details;
}
