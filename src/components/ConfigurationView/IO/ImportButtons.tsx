import React, { useRef, useState } from 'react';
import { Check, ContentPasteGo, FileUpload } from '@mui/icons-material';
import { IconButton, Tooltip } from '@mui/material';

interface FileInputProps {
    onClick: (content: string, extension: string) => void;
    acceptedExtensions: string[];    
}

export const FileInput = ({ onClick, acceptedExtensions = [".yml", ".yaml"] }: FileInputProps) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const readFileContent = async (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event: ProgressEvent<FileReader>) => resolve(event.target?.result as string);
            reader.onerror = (error: ProgressEvent<FileReader>) => reject(error);
            reader.readAsText(file);
        });
    }

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            onClick(await readFileContent(file), file.name.substring(file.name.lastIndexOf('.')));

            console.log('File loaded successfully:', file.name);
        }
    };

    const handleButtonClick = () => {
        fileInputRef.current?.click();
    };

    const tooltipTipPrompt = `Import ${acceptedExtensions.slice(0, -1).join(", ")}, or ${acceptedExtensions.at(-1)} config`;

    return (
        <div>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept={acceptedExtensions.join(",")}
                style={{ display: 'none' }}
            />
            <Tooltip disableFocusListener title={tooltipTipPrompt}>
                <IconButton 
                    onClick={handleButtonClick}
                    color="primary"
                    size='large'
                >
                    <FileUpload />
                </IconButton>
            </Tooltip>
        </div>
    );
}

interface ClipboardInputProps {
    onClick: (content: string) => void;
}

export const ClipboardInput = ({ onClick }: ClipboardInputProps) => {
    const [imported, setImported] = useState(false);

    const handlePaste = async (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault(); // Prevent default action
        
        try {
            const clipboardContent = await navigator.clipboard.readText();
            onClick(clipboardContent);
            console.log('Content pasted successfully');

            setImported(true);
            setTimeout(() => setImported(false), 2000);
        } catch (error) {
            console.error('Failed to read clipboard contents:', error);
            // Fallback method if clipboard API fails
            document.execCommand('paste');
        }
    };

    return (
        <Tooltip title="Paste from clipboard">
            <IconButton
                onClick={handlePaste}
                color="primary"
                size='large'
            >
                {imported ? <Check/> : <ContentPasteGo />}
            </IconButton>
        </Tooltip>
    );
}
