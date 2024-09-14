import { CardDetails, FreeCardDetails, CostType, ConditionType, RestrictionType, HandTrapDetails } from './card-details';
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
        restriction: [RestrictionType.NoMoreDraws]
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
    'Sacred Sword of Seven Stars': {
        count: 2,
        oncePerTurn: true,
        condition: {
            type: ConditionType.BanishFromHand,
            value: "Level 7"
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

const handTrapMap: Record<string, HandTrapDetails> = {
    'Ash Blossom & Joyous Spring': {
        count: 1,
        goingSecond: false,

    },
    'Ghost Belle & Haunted Mansion': {
        count: 1,
        goingSecond: false,

    },
    'Ghost Ogre & Snow Rabbit': {
        count: 1,
        goingSecond: false,

    },
    'Ghost Mourner & Moonlit Chill': {
        count: 1,
        goingSecond: false,

    },
    'Ghost Reaper & Winter Cherries': {
        count: 1,
        goingSecond: false,

    },
    'Ghost Sister & Spooky Dogwood': {
        count: 1,
        goingSecond: false,

    },
    'Maxx "C"': {
        count: 1,
        goingSecond: false,
    },
    'Retaliating "C"': {
        count: 3,
        goingSecond: false,
    },
    'Contact "C"': {
        count: 3,
        goingSecond: false,
    },
    'Flying "C"': {
        count: 3,
        goingSecond: false,
    },
    'Dimension Shifter': {
        count: 1, 
        goingSecond: false,
    },
    'Effect Veiler': {
        count: 3,
        goingSecond: false,
    },
    'Droll & Lock Bird': {
        count: 3,
        goingSecond: false,
    },
    'Nibiru, the Primal Being': {
        count: 1,
        goingSecond: false,
    },
    'Fantastical Dragon Phantazmay': {
        count: 1,
        goingSecond: false,
    },
    'Gnomaterial': {
        count: 1,
        goingSecond: true,
    },
    'Mulcharmy Fuwaross': {
        count: 2,
        goingSecond: true,
    },
    'Mulcharmy Purulia': {
        count: 2,
        goingSecond: true,
    },
    'D.D. Crow': {
        count: 3,
        goingSecond: false,
    },
    'Bystial Baldrake': {
        count: 1,
        goingSecond: false,
    },
    'Bystial Druiswurm': {
        count: 1,
        goingSecond: false,
    },
    'Bystial Magnamhut': {
        count: 1,
        goingSecond: false,
    },
    'Bystial Saronir': {
        count: 1,
        goingSecond: false,
    },
    'Skull Meister': {
        count: 3,
        goingSecond: false,
    },
    /**
     * Technically, you can only use one of the PYS-Framegears per turn - same issue as with the Mulcharmy monsters.
     */
    'PSY-Framegear Alpha': {
        count: 1,
        goingSecond: true,
    },
    'PSY-Framegear Beta': {
        count: 1,
        goingSecond: true,
    },
    'PSY-Framegear Gamma': {
        count: 1,
        goingSecond: true,
    },
    'PSY-Framegear Delta': {
        count: 1,
        goingSecond: true,
    },
    'PSY-Framegear Epsilon': {
        count: 1,
        goingSecond: true,
    },
    'Infinite Impermanence': {
        count: 3,
        goingSecond: false,
    },
    'Typhoon': {
        count: 3,
        goingSecond: false,
    },
    'Red Reboot': {
        count: 3,
        goingSecond: false,
    },
    'Dominus Purge': {
        count: 1,
        goingSecond: false,
    },
    'Dominus Impulse': {
        count: 1,
        goingSecond: false,
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
