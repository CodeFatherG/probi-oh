import React, { useState } from 'react';
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField } from "@mui/material";
import { CardDetails } from "../utils/card-details";
import TagBox from './TagBox';

function CardRow({ name, details, onUpdateTags }: { name: string, details: CardDetails, onUpdateTags: (name: string, tags: string[]) => void }) {
    return (
        <TableRow>
            <TableCell>{name}</TableCell>
            <TableCell align="right">{details.qty}</TableCell>
            <TableCell>
                <TagBox 
                    initialTags={details.tags || []}
                    onTagsChange={(newTags) => onUpdateTags(name, newTags)}
                />
            </TableCell>
        </TableRow>
    );
}

interface DeckTableProps {
    map: Map<string, CardDetails>;
    onAddCard: (cardName: string) => void;
    onUpdateCard: (cardName: string, details: CardDetails) => void;
}

export default function DeckTable({ map, onAddCard, onUpdateCard }: DeckTableProps) {
    const [newCardName, setNewCardName] = useState('');

    const handleAddCard = () => {
        if (newCardName.trim()) {
            onAddCard(newCardName.trim());
            setNewCardName('');
        }
    };

    const handleKeyPress = (event: React.KeyboardEvent) => {
        if (event.key === 'Enter') {
            handleAddCard();
        }
    };

    const handleUpdateTags = (cardName: string, newTags: string[]) => {
        const cardDetails = map.get(cardName);
        if (cardDetails) {
            onUpdateCard(cardName, { ...cardDetails, tags: newTags });
        }
    };

    return (
        <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }} aria-label="deck table">
                <TableHead>
                    <TableRow>
                        <TableCell>Card</TableCell>
                        <TableCell align="right">Qty</TableCell>
                        <TableCell>Tags</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {Array.from(map).map(([name, details]) => (
                        <CardRow 
                            key={name} 
                            name={name} 
                            details={details} 
                            onUpdateTags={handleUpdateTags}
                        />
                    ))}
                    <TableRow>
                        <TableCell>
                            <TextField
                                value={newCardName}
                                onChange={(e) => setNewCardName(e.target.value)}
                                onBlur={handleAddCard}
                                onKeyPress={handleKeyPress}
                                placeholder="Enter new card name"
                                fullWidth
                            />
                        </TableCell>
                        <TableCell align="right"></TableCell>
                        <TableCell></TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </TableContainer>
    );
}