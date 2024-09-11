import React from 'react';
import { Done } from '@mui/icons-material';
import { Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Typography, useMediaQuery, useTheme } from '@mui/material';
import useSessionStorage from './Storage/SessionStorage';

export default function MobileDialog() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [dismissed, setDismissed] = useSessionStorage<boolean>('mobileDialogDismissed', isMobile);

    return (
        <Dialog open={dismissed}>
            <DialogTitle>
                Mobile browser detected
            </DialogTitle>
            <DialogContent>
                <Typography variant='caption'>
                    Probi-oh is not optimized for mobile devices. For the best experience, please use a desktop browser.
                </Typography>
            </DialogContent>
            <DialogActions>
                <IconButton onClick={() => setDismissed(false)}>
                    <Done/>
                </IconButton>
            </DialogActions>
        </Dialog>
    );
}