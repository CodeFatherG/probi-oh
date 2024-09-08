import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, TextField, Button, Box, IconButton } from '@mui/material';
import InfoDialog from './InfoDialog';
import { Info } from '@mui/icons-material';

export interface Settings {
    simulationIterations: number;
    simulationHandSize: number;
    clearCache: boolean;
}

interface SettingsDialogProps {
    open: boolean;
    settings: Settings;
    onClose: () => void;
    onSave: (settings: Settings) => void;
}

export default function SettingsDialog({ open, settings, onClose, onSave }: SettingsDialogProps) {
    const [localSettings, setLocalSettings] = useState<Settings>(settings);
    const [infoOpen, setInfoOpen] = useState(false);

    useEffect(() => {
        if (open) {
            setLocalSettings(settings);
        }
    }, [open, settings]);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;
        setLocalSettings(prev => ({
            ...prev,
            [name]: parseInt(value, 10)
        }));
    };

    const handleSave = () => {
        onSave(localSettings);
        onClose();
    };

    const handleClose = () => {
        setLocalSettings(settings); // Reset to original settings
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
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
                        value={localSettings.simulationIterations}
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
                        value={localSettings.simulationHandSize}
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
                            localSettings.clearCache = true; 
                            handleSave();
                        }}
                    >
                        Clear Cache
                    </Button>
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button onClick={handleClose} sx={{ mr: 1 }}>
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