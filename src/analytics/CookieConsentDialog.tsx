import React from 'react';
import { Box, Button, Paper, Typography } from '@mui/material';
import { Analytics as AnalyticsIcon, Shield as ShieldIcon } from '@mui/icons-material';
import { Link } from 'react-router-dom';

interface CookieConsentDialogProps {
    open: boolean;
    onConsent: (type: boolean) => void;
}

const DataConsentDialog = ({ open, onConsent}: CookieConsentDialogProps) => {
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
            <Box display="flex" justifyContent="center" alignItems="center">
                <Typography variant="h6" gutterBottom>
                    Data Consent
                </Typography>
            </Box>
            <Typography variant="body2" paragraph>
                <strong>We NEVER collect any personal or marketing information.</strong><br />
            </Typography>
            <Typography variant="caption" paragraph>
                We collect data about your simulation for history, analytics, and sharable links. Some features may not work without data permissions.
                <br />
                Read our <Link to="/privacy">Privacy Policy</Link> for more details.
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                <Button
                    variant="outlined"
                    color="secondary"
                    onClick={() => onConsent(false)}
                    startIcon={<ShieldIcon />}
                    sx={{ flexGrow: 1, mr: 1 }}
                >
                    Necessary
                </Button>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => onConsent(true)}
                    startIcon={<AnalyticsIcon />}
                    sx={{ flexGrow: 1, ml: 1 }}
                >
                    Allow All
                </Button>
            </Box>
        </Paper>
    );
};

export default DataConsentDialog;