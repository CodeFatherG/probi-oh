import React from 'react';
import { Button, Dialog, DialogTitle, List, ListItem, ListItemButton, ListItemText, Tooltip } from '@mui/material';
import { saveAs } from 'file-saver';
import { CardDetails } from '../utils/card-details';
import { SimulationInput } from '../utils/simulation-input';
import { serialiseSimulationInputToYaml } from '../utils/yaml-manager';
import { serialiseCardsToYdk } from '../utils/ydk-manager';

interface SaveFileComponentProps {
    cardData: Map<string, CardDetails>;
    conditionData: string[];
}

interface SimpleDialogProps {
    open: boolean;
    onClose: (value?: string) => void;
}

export default function SaveFileComponent({ cardData, conditionData }: SaveFileComponentProps) {
    const [open, setOpen] = React.useState(false);

    const handleDialogClose = async (value?: string) => {
        setOpen(false);

        if (value) {
            let output = "";
            if (value === "yaml") {
                const input: SimulationInput = {
                    deck: cardData,
                    conditions: conditionData,
                };

                output = serialiseSimulationInputToYaml(input);
        
                const blob = new Blob([output], { type: 'text/yaml;charset=utf-8' });
                saveAs(blob, 'probioh_deck_config.yaml');
            } else if (value === "ydk") {
                output = await serialiseCardsToYdk(cardData);

                const blob = new Blob([output], { type: 'text;charset=utf-8' });
                saveAs(blob, 'probioh_deck_config.ydk');
            }
        }
    };

    return (
        <div>
            <Tooltip title="Export current deck and conditions">
                <Button 
                    onClick={() => setOpen(true)} 
                    variant="contained" 
                    color="primary">
                    Save Configuration
                </Button>
            </Tooltip>
            <SaveDialog
                open={open}
                onClose={handleDialogClose}
            />
        </div>
    );
}

function SaveDialog({ onClose, open }: SimpleDialogProps) {
    const handleClose = () => {
        onClose(undefined);
    };

    const handleListItemClick = (value: string) => {
        onClose(value);
    };

    return (
        <Dialog onClose={handleClose} open={open}>
            <DialogTitle>Export to:</DialogTitle>
            <List sx={{ pt: 0 }}>
                <ListItem disableGutters key="yaml">
                    <ListItemButton onClick={() => handleListItemClick("yaml")}>
                        <ListItemText primary="Export to YAML"/>
                    </ListItemButton>
                </ListItem>
                <ListItem disableGutters key="ydk">
                    <ListItemButton onClick={() => handleListItemClick("ydk")}>
                        <ListItemText primary="Export to YDK" secondary="(YDK does not export conditions)"/>
                    </ListItemButton>
                </ListItem>
            </List>
        </Dialog>
    );
}
