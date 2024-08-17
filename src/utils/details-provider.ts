import { CardDetails, FreeCardDetails, CostType, ConditionType, RestrictionType } from './card-details';
import { CardInformation } from './card-information';

const freeCardMap: Record<string, FreeCardDetails> = {
    'Pot of Desires': {
        count: 2,
        oncePerTurn: true,
        cost: {
            type: CostType.BanishFromDeck,
            value: 10
        }
    },
    'Pot of Extravagance': {
        count: 2,
        oncePerTurn: false,
        restriction: [RestrictionType.NoPreviousDraws, RestrictionType.NoMoreDraws]
    },
    'Pot of Prosperity': {
        count: 0,
        oncePerTurn: true,
        restriction: [RestrictionType.NoPreviousDraws, RestrictionType.NoMoreDraws],
        excavate: {
            count: 6,
            pick: 1
        }
    },
    'Upstart Goblin': {
        count: 1,
        oncePerTurn: false,
        cost: {
            type: CostType.PayLife,
            value: -1000
        }
    },
    'Allure of Darkness': {
        count: 2,
        oncePerTurn: false,
        condition: {
            type: ConditionType.BanishFromHand,
            value: "DARK"
        }
    },
    'Into The Void': {
        count: 1,
        oncePerTurn: false
    },
    'Pot of Duality': {
        count: 0,
        oncePerTurn: true,
        excavate: {
            count: 3,
            pick: 1
        }
    },
    'Trade-In': {
        count: 2,
        oncePerTurn: false,
        cost: {
            type: CostType.Discard,
            value: ["Level 8"]
        }
    },
    'Spellbook of Knowledge': {
        count: 2,
        oncePerTurn: true,
        cost: {
            type: CostType.Discard,
            value: ["Spellcaster", "Spellbook"]
        }
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

    return details;
}
