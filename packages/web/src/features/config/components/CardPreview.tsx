import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { CardInformation } from '@/types/card-information';
import InsightsButton from './InsightsButton';

interface CardPreviewProps {
    cardInformation: CardInformation | null;
}

const CardDescription = ({ description }: { description: string }) => {
    return (
        <>
            {description.split('\n').map((line, index) => (
                <React.Fragment key={index}>
                    {line}
                    {index < description.split('\n').length - 1 && <br />}
                </React.Fragment>
            ))}
        </>
    );
};

const SpellSummary = ({ cardInformation }: {cardInformation: CardInformation}) => (
    <Card 
        sx={{ 
            backgroundColor: '#1d9e74', 
            border: '2px solid #8B4513', 
            borderRadius: '10px', 
            width: '100%', 
            boxShadow: '0 0 10px rgba(0,0,0,0.1)', 
            position: 'relative' 
        }}
    >
        <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
            <InsightsButton 
                cardName={cardInformation.name} 
                size="small" 
                color="secondary"
            />
            <Box sx={{ position: 'absolute', top: 4, right: 4 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#000' }}>
                    [ Spell Card ]
                </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: '#000', mt: 3 }}>
                <CardDescription description={cardInformation.desc}/>
            </Typography>
        </CardContent>
    </Card>
);

const TrapSummary = ({ cardInformation }: {cardInformation: CardInformation}) => (
    <Card 
        sx={{ 
            backgroundColor: '#bc5a84', 
            border: '2px solid #8B4513', 
            borderRadius: '10px', 
            maxWidth: '100%', 
            boxShadow: '0 0 10px rgba(0,0,0,0.1)', 
            position: 'relative' 
        }}
    >
        <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
            <InsightsButton 
                cardName={cardInformation.name} 
                size="small" 
                color="primary"
            />
            <Box sx={{ position: 'absolute', top: 4, right: 4 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#000' }}>
                    [ Trap Card ]
                </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: '#000', mt: 3 }}>
                <CardDescription description={cardInformation.desc}/>
            </Typography>
        </CardContent>
    </Card>
);

const MonsterSummary = ({ cardInformation }: { cardInformation: CardInformation }) => {
    const isEffect = cardInformation.typeline?.includes('Effect');
    
    return (
        <Card 
            sx={{ 
                backgroundColor: isEffect ? '#ff8b53' : '#fde68a', 
                border: '2px solid #8B4513', 
                borderRadius: '10px', 
                width: '100%', 
                boxShadow: '0 0 10px rgba(0,0,0,0.1)', 
                position: 'relative' 
            }}
        >
            <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                <InsightsButton 
                    cardName={cardInformation.name} 
                    size="small" 
                    color="primary"
                />
                <Box sx={{ position: 'absolute', top: 4, right: 4 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#000' }}>
                        [{cardInformation.attribute} / Level {cardInformation.level}]
                    </Typography>
                </Box>
                <Typography 
                    variant="subtitle2" 
                    sx={{ 
                        fontWeight: 'bold', 
                        color: '#000', 
                        mt: 3 
                    }}
                >
                    [{cardInformation.race} / {cardInformation.type.replace('Monster', '').trim().split(' ').join(' / ')}]
                </Typography>
                <Typography 
                    variant="body2" 
                    sx={{ 
                        fontStyle: isEffect ? 'normal' : 'italic', 
                        color: '#000', 
                        mt: 1 
                    }}
                >
                    <CardDescription description={cardInformation.desc}/>
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#000' }}>
                        ATK/{cardInformation.atk} DEF/{cardInformation.def}
                    </Typography>
                </Box>
            </CardContent>
        </Card>
    );
}

export default function CardPreview({ cardInformation }: CardPreviewProps) {
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