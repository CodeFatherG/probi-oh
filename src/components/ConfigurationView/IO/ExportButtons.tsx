import React, { useState } from 'react';
import { Dialog, DialogTitle, IconButton, List, ListItem, ListItemButton, ListItemText, Tooltip } from '@mui/material';
import { Check, FileCopy, FileUpload } from '@mui/icons-material';

interface FileOutputProps {
    onClick: (extension: string) => void;
    acceptedExtensions: string[];
}

interface ExportTypeDialogProps {
    open: boolean;
    extensions: string[];
    onClose: (value?: string) => void;
}

export function FileOutput({ onClick, acceptedExtensions }: FileOutputProps) {
    const [open, setOpen] = React.useState(false);

    const handleDialogClose = async (value?: string) => {
        setOpen(false);

        if (value && value in acceptedExtensions) {
            onClick(value);
        }
    };

    return (
        <>
            <Tooltip title="Export current deck and conditions">
                <IconButton 
                    onClick={() => setOpen(true)}
                    color="primary"
                >
                    <FileUpload/>
                </IconButton>
            </Tooltip>
            <ExportTypeDialog
                open={open}
                onClose={handleDialogClose}
                extensions={acceptedExtensions}
            />
        </>
    );
}

function ExportTypeDialog({ onClose, open, extensions }: ExportTypeDialogProps) {
    const handleClose = () => {
        onClose(undefined);
    };

    const handleListItemClick = (value: string) => {
        onClose(value);
    };

    const ExtensionOption = ({ extension }: { extension: string }) => {
        return (
            <ListItem disableGutters key={extension}>
                <ListItemButton onClick={() => handleListItemClick(extension)}>
                    {extension.includes("yaml") || extension.includes("yml") ?
                        <ListItemText primary={`Export to ${extension.toUpperCase()}`}/>
                    :
                        <ListItemText primary={`Export to ${extension.toUpperCase()}`} secondary={`(${extension.toUpperCase()} does not export conditions)`}/>
                    }
                </ListItemButton>
            </ListItem>
        );
    }

    return (
        <Dialog onClose={handleClose} open={open}>
            <DialogTitle>Export to:</DialogTitle>
            <List sx={{ pt: 0 }}>
                {extensions.map((extension) => (
                    <ExtensionOption extension={extension} key={extension}/>
                ))}
            </List>
        </Dialog>
    );
}

interface CopyButtonProps {
    onClick: (extension: string) => void;
    acceptedExtensions: string[];
}

export function ClipboardOutput({ onClick, acceptedExtensions }: CopyButtonProps) {
    const [copied, setCopied] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);

    const handleDialogClose = async (value?: string) => {
        setDialogOpen(false);

        if (value && value in acceptedExtensions) {
            onClick(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <>
            <Tooltip title="Export current deck and conditions">
                <IconButton 
                    onClick={() => setDialogOpen(true)} 
                    color="primary"
                >
                    {copied ? <Check/> : <FileCopy/>}
                </IconButton>
            </Tooltip>
            <ExportTypeDialog
                open={dialogOpen}
                onClose={handleDialogClose}
                extensions={acceptedExtensions}
            />
        </>
    );
}
