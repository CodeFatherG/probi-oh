import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle, TextField, Button, Box, IconButton, Autocomplete, Typography, Switch, Grid } from '@mui/material';
import InfoDialog from './InfoDialog';
import { Info } from '@mui/icons-material';
import { getSettings, saveSettings, Settings } from './settings';
import { Link, useNavigate } from 'react-router-dom';
import { persistUserId } from '../../analytics/user-id';
import { getCurrencies } from '@/currency/currency';
import { acceptAllCookies, acceptNecessaryCookies, isConsentGiven } from '@/analytics/cookieConsent';

interface SettingsDialogProps {
    open: boolean;
    onClose: () => void;
}

export default function SettingsDialog({ open, onClose }: SettingsDialogProps) {
    const [infoOpen, setInfoOpen] = useState(false);
    const [settings, setSettings] = useState<Settings>(getSettings());
    const [currencies, setCurrencies] = useState<string[]>([]);
    const [isDataConsentEnabled, setDataConsentEnabled] = useState(isConsentGiven());

    useEffect(() => {
        if (isDataConsentEnabled) {
            acceptAllCookies();
        } else {
            acceptNecessaryCookies();
        }
    }, [isDataConsentEnabled]);

    useEffect(() => {
        setDataConsentEnabled(isConsentGiven());
    }, [isConsentGiven()]);

    const navigate = useNavigate();

    useEffect(() => {
        const fetchCurrencies = async () => {
            const currencies = await getCurrencies();
            setCurrencies(currencies);
        }
        fetchCurrencies();
    }, [open]);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;
        setSettings(prev => ({
            ...prev,
            [name]: parseInt(value, 10)
        }));
    };

    const handleSave = () => {
        saveSettings(settings);
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 2 }}>
                <DialogTitle sx={{ padding: 0 }}>Settings</DialogTitle>
                <IconButton
                    onClick={() => setInfoOpen(true)}
                    sx={{ padding: 0 }}
                >
                    <Info />
                </IconButton>
            </Box>
            <DialogContent sx={{pt: 0}}>
                <Box component="form" noValidate autoComplete="off">
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'flex-start',
                            gap: 2,
                        }}
                    >
                        <Box
                            sx={{
                                border: '1px solid #ccc',
                                borderRadius: 2,
                                padding: 2,
                                width: '100%',
                            }}
                        >
                            <TextField
                                fullWidth
                                label="Simulation Iterations"
                                type="number"
                                inputProps={{
                                    min: 1
                                }}
                                name="simulationIterations"
                                value={settings.simulationIterations}
                                onChange={handleChange}
                                margin="normal"
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault(); // Prevent form submission on Enter
                                        handleSave();
                                    }
                                }}
                            />
                            <TextField
                                fullWidth
                                label="Hand Size"
                                type="number"
                                inputProps={{
                                    min: 1
                                }}
                                name="simulationHandSize"
                                value={settings.simulationHandSize}
                                onChange={handleChange}
                                margin="normal"
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault(); // Prevent form submission on Enter
                                        handleSave();
                                    }
                                }}
                            />
                            <TextField
                                fullWidth
                                label="Precision (Max Decimal Places)"
                                type="number"
                                inputProps={{
                                    min: 1,
                                    max: 10
                                }}
                                name="statisticMaxPrecision"
                                value={settings.statisticMaxPrecision}
                                onChange={handleChange}
                                margin="normal"
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault(); // Prevent form submission on Enter
                                        handleSave();
                                    }
                                }}
                            />
                            <Autocomplete
                                options={currencies}
                                value={settings.selectedCurrency}
                                onChange={(event, value) => {
                                    if (value) {
                                        settings.selectedCurrency = value;
                                    }
                                }}
                                renderInput={(params) => <TextField {...params} label="Currency" />}
                            />
                        </Box>
                        <Box>
                            <Grid container>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="body2" pt='4px'>
                                        Technical Data
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Switch
                                        color="primary"
                                        checked={true}
                                        disabled
                                        
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="body2" pt='4px' noWrap>
                                        Data Consent
                                    </Typography>
                                    </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Switch
                                        color="primary"
                                        checked={isDataConsentEnabled}
                                        onClick={() => {
                                            setDataConsentEnabled(!isDataConsentEnabled);
                                        }}
                                    />
                                </Grid>
                            </Grid>
                            <Typography variant="caption" paragraph>
                                <Link to="/privacy">Privacy Policy</Link>.
                            </Typography>
                        </Box>
                    </Box>
                    <Button 
                            onClick={() => {
                                console.log('Clearing cache...');
                                localStorage.clear();
                                navigate('', { replace: true });
                                persistUserId();
                                window.location.reload();
                                return;
                            }}
                        >
                            Clear Cache
                        </Button>
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button onClick={onClose} sx={{ mr: 1 }}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave} variant="contained" color="primary">
                            Save
                        </Button>
                    </Box>
                </Box>
            </DialogContent>
            <InfoDialog
                open={infoOpen}
                onClose={() => setInfoOpen(false)}
            />
        </Dialog>
    );
}