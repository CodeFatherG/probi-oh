import React, { useEffect, useState } from 'react';
import { CardInformation } from "@/types/card-information";
import { Box, BoxProps } from "@mui/material";
import { getLevelImage } from '@/api/probi-oh/level-img';
import { CardAttribute, getAttributeImage } from '@/api/probi-oh/attribute-img';
import { getSpellImage, SpellType } from '@/api/probi-oh/spell-img';
import { getTrapImage, TrapType } from '@/api/probi-oh/trap-img';

interface CardHeaderProps extends Omit<BoxProps, 'component'> {
    cardInformation: CardInformation;
}

function MonsterHeader({cardInformation}: CardHeaderProps) {
    const [levelImg, setLevelImage] = useState<string>('');
    const [attributeImg, setAttributeImage] = useState<string>('');

    useEffect(() => {
        const retrieveLevelImage = async () => {
            const levelImage = await getLevelImage();
            if (levelImage) {
                const url = URL.createObjectURL(levelImage);
                setLevelImage(url);
            }
        }

        retrieveLevelImage();
    }, []);

    useEffect(() => {
        if (cardInformation) {
            const retrieveAttributeImage = async (attribute: string) => {
                // check that attribute is a valid CardAttribute
                if (!Object.values(CardAttribute).includes(attribute.toLowerCase())) {
                    console.error(`Invalid attribute: ${attribute}`);
                    setAttributeImage('');
                    return;
                }

                const attributeImage = await getAttributeImage(attribute.toLowerCase() as unknown as CardAttribute);
                if (attributeImage) {
                    const url = URL.createObjectURL(attributeImage);
                    setAttributeImage(url);
                }
            }

            if (cardInformation.attribute) {
                retrieveAttributeImage(cardInformation.attribute.toLowerCase());
            }
        }
    }, [cardInformation]);

    return (
        <Box display='flex' flexDirection='row' alignContent='center' alignItems='center'>
            <Box mr={4}>
                {Array.from({ length: cardInformation.level ?? 0 }).map((_, idx) => (
                    <Box
                        key={idx}
                        component="img"
                        src={levelImg}
                        alt={`Level ${idx + 1}`}
                        loading="lazy"
                        maxWidth='24px'
                        height='auto'
                    />
                ))}
            </Box>
            <Box
                component="img"
                src={attributeImg}
                alt={`${cardInformation.attribute}`}
                loading="lazy"
                maxWidth='32px'
                height='auto'
            />
        </Box>
    );
}

function SpellHeader({cardInformation}: CardHeaderProps) {
    const [spellImg, setSpellImage] = useState<string>('');
    const spellType = cardInformation.race.split(' ')[0];

    useEffect(() => {
        const retrieveSpellImage = async () => {
            const spellImage = await getSpellImage(spellType.toLowerCase() as unknown as SpellType);
            if (spellImage) {
                const url = URL.createObjectURL(spellImage);
                setSpellImage(url);
            }
        }
        
        retrieveSpellImage();
    }, [cardInformation]);

    // Invalid spell?
    if (!Object.values(SpellType).includes(spellType.toLowerCase())) {
        console.error(`Invalid spell type: ${spellType}`);
        return <></>;
    }

    // No image for normal spell
    if (spellType.toLowerCase() === 'normal') {
        return <></>;
    }

    return (
        <Box
            component="img"
            src={spellImg}
            alt={`${spellType}`}
            loading="lazy"
            maxWidth='32px'
            height='auto'
        />
    );
}

function TrapHeader({cardInformation}: CardHeaderProps) {
    const [trapImg, setTrapImg] = useState<string>('');
    const trapType = cardInformation.race.split(' ')[0];

    useEffect(() => {
        const retrieveSpellImage = async () => {
            const spellImage = await getTrapImage(trapType.toLowerCase() as unknown as TrapType);
            if (spellImage) {
                const url = URL.createObjectURL(spellImage);
                setTrapImg(url);
            }
        }
        
        retrieveSpellImage();
    }, [cardInformation]);

    // Invalid trap?
    if (!Object.values(TrapType).includes(trapType.toLowerCase())) {
        console.error(`Invalid trap type: ${trapType}`);
        return <></>;
    }

    // No image for normal trap
    if (trapType.toLowerCase() === 'normal') {
        return <></>;
    }

    return (
        <Box
            component="img"
            src={trapImg}
            alt={`${trapType}`}
            loading="lazy"
            maxWidth='32px'
            height='auto'
        />
    );
}

export default function CardHeader({cardInformation}: CardHeaderProps) {
    

    // if the card is a monster, return the type and level
    if (cardInformation.type.includes("Monster")) {
        return <MonsterHeader cardInformation={cardInformation} />;
    }

    // if the card is a spell
    if (cardInformation.type.includes("Spell")) {
        return <SpellHeader cardInformation={cardInformation} />;
    }

    // if the card is a trap
    if (cardInformation.type.includes("Trap")) {
        return <TrapHeader cardInformation={cardInformation} />;
    }
}