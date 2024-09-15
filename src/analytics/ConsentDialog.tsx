import React, { useState, useEffect } from 'react';
import { Box, Button, Paper, Typography, IconButton } from '@mui/material';
import { Analytics as AnalyticsIcon, Shield as ShieldIcon, Close as CloseIcon } from '@mui/icons-material';

const CookieConsent = () => {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const consentGiven = localStorage.getItem('cookieConsent');
        if (!consentGiven) {
            setOpen(true);
        }
    }, []);

    const handleConsent = (type) => {
        localStorage.setItem('cookieConsent', type);
        setOpen(false);
    };

    const handleClose = () => {
        setOpen(false);
    };

    if (!open) return null;

    return (
        <Paper
            elevation={3}
            sx={{
                position: 'fixed',
                bottom: 16,
                left: 16,
                maxWidth: 400,
                margin: 'auto',
                p: 2,
                zIndex: 1000,
            }}
        >
            <IconButton
                onClick={handleClose}
                sx={{ position: 'absolute', right: 8, top: 8 }}
            >
                <CloseIcon />
            </IconButton>
            <Typography variant="subtitle1" gutterBottom>
                Cookie Consent
            </Typography>
            <Typography variant="caption" paragraph>
                <Typography variant='caption' display={'inline'} fontWeight={'bold'}>We NEVER collect marketing information. </Typography>
                Collected data is to enhance user experience and improve our website.
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
            <Button
                    variant="outlined"
                    color="secondary"
                    onClick={() => handleConsent('necessary')}
                    startIcon={<ShieldIcon />}
                    sx={{ flexGrow: 1, mr: 1 }}
                >
                    Necessary Only
                </Button>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => handleConsent('all')}
                    startIcon={<AnalyticsIcon />}
                    sx={{ flexGrow: 1, ml: 1 }}
                >
                    Allow All Cookies
                </Button>
            </Box>
        </Paper>
    );
};

export default CookieConsent;