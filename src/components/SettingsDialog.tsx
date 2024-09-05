import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, TextField, Button, Box } from '@mui/material';

export interface Settings {
    simulationIterations: number;
    simulationHandSize: number;
    batchSize: number;
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
            <DialogTitle>Settings</DialogTitle>
            <DialogContent>
                <Box component="form" noValidate autoComplete="off" sx={{ mt: 2 }}>
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
                    <TextField
                        fullWidth
                        label="Batch Size"
                        type="number"
                        name="batchSize"
                        value={localSettings.batchSize}
                        onChange={handleChange}
                        margin="normal"
                        inputProps={{
                            min: 100
                        }}
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
        </Dialog>
    );
}