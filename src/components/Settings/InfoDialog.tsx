import React from 'react';
import { Box, Dialog, DialogContent, DialogTitle, IconButton, Link, Typography } from '@mui/material';
import { Close } from '@mui/icons-material';

interface InfoDialogProps {
    open: boolean;
    onClose: () => void;
}

export default function InfoDialog({open, onClose}: InfoDialogProps) {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 2 }}>
                <DialogTitle sx={{padding: 0}}>Info</DialogTitle>
                <IconButton 
                    onClick={onClose}
                    sx={{padding: 0}}
                >
                    <Close />
                </IconButton>
            </Box>
            <DialogContent sx={{pt: 0}}>
                <Typography variant="body1">
                        This is a Yu-Gi-Oh! probability simulator aimed at breaking down the complexity that is probability and presenting it to you in
                        a simple and understandable way. Unlike competitors this simulator supports complex condition building allowing you to simulate
                        complex chains of logical and/or conditions. Additionally, it lets you generalise what a card is. With tags you can specify that
                        a card is a "Combo Piece" and without caring what the card is, your condition can just find you a combo piece. IE, "I need to see 
                        a starter and a combo piece in my opening hand, or I could see a combo piece and a searcher. That would be fine too".
                        <br/><br/>
                        I am a Mechatronic engineer and have always had a passion for yugioh. I found that a lot of simulators in the yugioh community
                        just did not support the complexity that is yugioh. I wanted to make a simulator that could support the complexity of yugioh and
                        present it in a simple way. This project was a learning experience for me in developing a client side web application using React and
                        Typescript. If you have any suggestions or encounter any bugs, please feel free to reach out to me on {' '}
                        <Link href="https://github.com/CodeFatherG/probi-oh" target="_blank" rel="noopener">
                            Github
                        </Link>.
                </Typography>
            </DialogContent>
        </Dialog>
    );
}