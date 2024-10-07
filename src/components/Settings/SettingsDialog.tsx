import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogTitle, TextField, Button, Box, IconButton } from '@mui/material';
import InfoDialog from './InfoDialog';
import { Info } from '@mui/icons-material';
import { getSettings, saveSettings, Settings } from './settings';
import { useNavigate } from 'react-router-dom';
import { persistUserId } from '../../analytics/user-id';

interface SettingsDialogProps {
    open: boolean;
    onClose: () => void;
}

export default function SettingsDialog({ open, onClose }: SettingsDialogProps) {
    const [infoOpen, setInfoOpen] = useState(false);
    const [settings, setSettings] = useState<Settings>(getSettings());
    const navigate = useNavigate();

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
                    <TextField
                        fullWidth
                        label="Simulation Iterations"
                        type="number"
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