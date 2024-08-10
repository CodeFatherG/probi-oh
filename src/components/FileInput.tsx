import { Button, Tooltip } from '@mui/material';
import React, { useState, useRef } from 'react';

interface FileInputProps {
    onFileUpload: (file: File) => void;
    acceptedExtensions: string[];
    importPrompt: string;
}

const FileInput = ({ onFileUpload, acceptedExtensions = [".yml", ".yaml"], importPrompt = "Import YAML" }: FileInputProps) => {
    const [fileName, setFileName] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setFileName(file.name);
            onFileUpload(file);
        }
    };

    const handleButtonClick = () => {
        fileInputRef.current?.click();
    };

    const isValidFileType = (name: string): boolean => {
        return acceptedExtensions.some(ext => name.endsWith(ext));
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
                <Button onClick={handleButtonClick}>
                    {importPrompt}
                </Button>
            </Tooltip>
        </div>
    );
};

export default FileInput;