import { CardDetails } from '@server/card-details';
import { CardInformation } from './card-information';
import { freeCardMap } from './free-card-map';
import { handTrapMap } from './handtrap-map';
const normaliseType = (details: CardDetails, type: string) => {
    if (type.includes('Monster') && !details.tags?.includes('Monster')) {
        details.tags?.push('Monster');
    }

    if (type.includes('Spell Card') && !details.tags?.includes('Spell')) {
        details.tags?.push('Spell');
    }

    if (type.includes('Trap Card') && !details.tags?.includes('Trap')) {
        details.tags?.push('Trap');
    }
};

const assignHandTraps = (details: CardDetails, name: string) => {
    if (handTrapMap.includes(name)) {
        details.tags?.push('Hand Trap');
    }
};

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
    normaliseType(details, info.type);

    // Assign hand traps
    assignHandTraps(details, info.name);

    return details;
}
