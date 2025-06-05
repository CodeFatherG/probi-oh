import React from "react";
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material";

interface DeleteDialogProps {
    prompt: string;
    open: boolean;
    onClose: (result: boolean) => void;
}

export default function DeleteDialog({ prompt, open, onClose }: DeleteDialogProps) {
    return (
        <Dialog open={open} onClose={() => onClose(false)}>
            <DialogTitle>Delete Cards</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    {prompt}
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => onClose(true)}>Delete</Button>
                <Button onClick={() => onClose(false)}>Cancel</Button>
            </DialogActions>
        </Dialog>
    );

}