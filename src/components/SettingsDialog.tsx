import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, TextField, Button, Box } from '@mui/material';

export interface Settings {
    simulationIterations: number;
}

interface SettingsDialogProps {
    open: boolean;
    settings: Settings;
    onClose: (settings: Settings) => void;
}

export default function SettingsDialog({ open, settings, onClose }: SettingsDialogProps) {
    const [localSettings, setLocalSettings] = useState<Settings>(settings);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;
        setLocalSettings(prev => ({
            ...prev,
            [name]: parseInt(value, 10)
        }));
    };

    const handleSave = () => {
        onClose(localSettings);
    };

    return (
        <Dialog open={open} onClose={() => onClose(localSettings)} maxWidth="sm" fullWidth>
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
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button onClick={() => onClose(localSettings)} sx={{ mr: 1 }}>
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