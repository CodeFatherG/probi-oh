import React from 'react';
import { Typography, Box, TypographyProps } from '@mui/material';
import { CardInformation } from '@/types/card-information';

interface CardSummaryProps {
    cardInformation: CardInformation | null;
}

interface CardDescriptionProps extends TypographyProps {
    description: string;
}

const CardDescription = ({ description, ...props }: CardDescriptionProps) => {
    return (
        <Typography 
            variant="body2" 
            sx={{ 
                whiteSpace: 'normal',
                wordBreak: 'break-word',
                width: '100%',
            }}
            {...props}
        >
            {description.split('\n').map((line, index) => (
                <React.Fragment key={index}>
                    {line}
                    {index < description.split('\n').length - 1 && <br />}
                </React.Fragment>
            ))}
        </Typography>
    );
};

const SpellSummary = ({ cardInformation }: {cardInformation: CardInformation}) => {
    return (
        <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                [ Spell Card ]
            </Typography>
            <CardDescription description={cardInformation.desc}/>
        </Box>
    );
};

const TrapSummary = ({ cardInformation }: {cardInformation: CardInformation}) => (
    <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
            [ Trap Card ]
        </Typography>
        <CardDescription description={cardInformation.desc}/>
    </Box>
);

const MonsterSummary = ({ cardInformation }: { cardInformation: CardInformation }) => {
    if (!cardInformation || !cardInformation.typeline) return null;

    const isEffect = cardInformation.typeline.includes('Effect');

    return (
        <Box>
            <Typography 
                variant="subtitle2" 
                sx={{ 
                    fontWeight: 'bold',
                    mt: 3 
                }}
            >
                [{cardInformation.typeline.join(' / ')}]
            </Typography>
            <CardDescription description={cardInformation.desc} sx={{fontStyle: isEffect ? 'normal' : 'italic' }}/>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mr: 2}}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                    ATK/ {cardInformation.atk} DEF/ {cardInformation.def}
                </Typography>
            </Box>
        </Box>
    );
}

export default function CardSummary({ cardInformation }: CardSummaryProps) {
    if (!cardInformation) return null;

    const isSpell = cardInformation.type.includes('Spell Card');
    const isTrap = cardInformation.type.includes('Trap Card');
    const isMonster = cardInformation.type.includes('Monster');

    return (
        <>
            {isSpell && <SpellSummary cardInformation={cardInformation} />}
            {isTrap && <TrapSummary cardInformation={cardInformation} />}
            {isMonster && <MonsterSummary cardInformation={cardInformation} />}
        </>
    );
}