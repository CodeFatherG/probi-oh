import React from 'react';
import { Box, Button, Paper, Typography } from '@mui/material';
import { Analytics as AnalyticsIcon, Shield as ShieldIcon } from '@mui/icons-material';

interface CookieConsentDialogProps {
    open: boolean;
    onConsent: (type: boolean) => void;
}

const CookieConsentDialog = ({ open, onConsent}: CookieConsentDialogProps) => {
    if (!open) return (<></>);

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
            <Typography variant="subtitle1" gutterBottom>
                Cookie Consent
            </Typography>
            <Typography variant="caption" paragraph>
                <strong>We NEVER collect any personal or marketing information.</strong><br />
                We collect data about your simulation for history, analytics, and sharable links. Some features may not work without cookies.
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
            <Button
                    variant="outlined"
                    color="secondary"
                    onClick={() => onConsent(false)}
                    startIcon={<ShieldIcon />}
                    sx={{ flexGrow: 1, mr: 1 }}
                >
                    Necessary Only
                </Button>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => onConsent(true)}
                    startIcon={<AnalyticsIcon />}
                    sx={{ flexGrow: 1, ml: 1 }}
                >
                    Allow All Cookies
                </Button>
            </Box>
        </Paper>
    );
};

export default CookieConsentDialog;