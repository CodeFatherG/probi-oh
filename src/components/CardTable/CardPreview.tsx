import React from 'react';
import { Card, CardContent, Typography, Box, Stack } from '@mui/material';
import { CardInformation } from '@ygo/card-information';

interface CardPreviewProps {
    cardInformation: CardInformation | null;
}

const SpellSummary = ({ cardInformation }: {cardInformation: CardInformation}) => {
    return (
        <Card
            sx={{
                backgroundColor: '#1d9e74',
                border: '2px solid #8B4513',
                borderRadius: '10px',
                maxWidth: 300,
                boxShadow: '0 0 10px rgba(0,0,0,0.1)',
            }}
        >
            <CardContent>
                <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#8B4513' }}>
                        [ Spell Card ]
                    </Typography>
                </Box>
                <Typography variant="body2" sx={{ fontStyle: 'italic', color: '#000' }}>
                    {cardInformation.desc}
                </Typography>
            </CardContent>
        </Card>
    );
}

const TrapSummary = ({ cardInformation }: {cardInformation: CardInformation}) => {
    return (
        <Card
            sx={{
                backgroundColor: '#bc5a84',
                border: '2px solid #8B4513',
                borderRadius: '10px',
                maxWidth: 300,
                boxShadow: '0 0 10px rgba(0,0,0,0.1)',
            }}
        >
            <CardContent>
                <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#8B4513' }}>
                        [ Trap Card ]
                    </Typography>
                </Box>
                <Typography variant="body2" sx={{ fontStyle: 'italic', color: '#000' }}>
                    {cardInformation.desc}
                </Typography>
            </CardContent>
        </Card>
    );
}

const MonsterSummary = ({ cardInformation }: { cardInformation: CardInformation }) => {
    const isEffect = cardInformation.type.includes('Effect');
    
    return (
        <Card
            sx={{
                backgroundColor: isEffect ? '#ff8b53' : '#fde68a',
                border: '2px solid #8B4513',
                borderRadius: '10px',
                width: '100%',
                boxShadow: '0 0 10px rgba(0,0,0,0.1)',
                position: 'relative',
            }}
        >
            <CardContent>
                <Box
                    sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                    }}
                >
                    <Typography
                        variant="subtitle2"
                        sx={{
                            fontWeight: 'bold',
                            color: '#8B4513',
                        }}
                    >
                        [{cardInformation.attribute} / Level {cardInformation.level}]
                    </Typography>
                </Box>
                <Stack spacing={2} sx={{ pt: 4 }}>
                    <Typography
                        variant="subtitle2"
                        sx={{
                            mb: 0,
                            fontWeight: 'bold',
                            color: '#8B4513',
                        }}
                    >
                        [{cardInformation.race} / {cardInformation.type.replace('Monster', '').trim().split(' ').join(' / ')}]
                    </Typography>
                    <Typography 
                        variant="body2" 
                        mt='0' 
                        sx={{ 
                            fontStyle: isEffect ? 'normal' : 'italic', 
                            color: '#000'
                        }}
                    >
                        {cardInformation.desc.split('\n').map((line, index) => (
                            <React.Fragment key={index}>
                                {line}
                                {index < cardInformation.desc.split('\n').length - 1 && <br />}
                            </React.Fragment>
                        ))}
                    </Typography>
                </Stack>
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
