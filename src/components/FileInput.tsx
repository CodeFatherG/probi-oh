import { Button, Tooltip } from '@mui/material';
import React, { useState, useRef } from 'react';

interface FileInputProps {
    onFileUpload: (file: File) => void;
    acceptedExtensions: string[];
    importPrompt: string;
}

const FileInput = ({ onFileUpload, acceptedExtensions = [".yml", ".yaml"], importPrompt = "Import YAML" }: FileInputProps) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            onFileUpload(file);
        }
    };

    const handleButtonClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept={acceptedExtensions.join(",")}
                style={{ display: 'none' }}
            />
            <Tooltip disableFocusListener title="Import YAML or YDK config">
                <Button 
                    onClick={handleButtonClick}
                    variant="contained" 
                    color="primary"
                >
                    {importPrompt}
                </Button>
            </Tooltip>
        </div>
    );
};

export default FileInput;