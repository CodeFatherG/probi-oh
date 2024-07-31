import React, { useState, useRef } from 'react';

interface FileInputProps {
    onFileUpload: (file: File) => void;
    acceptedExtensions: string[];
    importPrompt: string;
}

const FileInput: React.FC<FileInputProps> = ({ onFileUpload, acceptedExtensions = [".yml", ".yaml"], importPrompt = "Import YAML" }) => {
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
        <div className="file-input">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept={acceptedExtensions.join(",")}
                style={{ display: 'none' }}
            />
            <button onClick={handleButtonClick}>
                {fileName ? 'Change File' : importPrompt}
            </button>
            {fileName && (
                <span className={`file-name ${isValidFileType(fileName) ? 'valid' : 'invalid'}`}>
                    {fileName}
                </span>
            )}
            {fileName && !isValidFileType(fileName) && (
                <p className="error-message">Invalid file type. Please select a {acceptedExtensions.join(', or ')} file type.</p>
            )}
        </div>
    );
};

export default FileInput;