import React, { useState, useRef } from 'react';

interface FileInputProps {
    onFileUpload: (file: File) => void;
}

const FileInput: React.FC<FileInputProps> = ({ onFileUpload }) => {
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
        return name.endsWith('.ydk') || name.endsWith('.yaml') || name.endsWith('.yml');
    };

    return (
        <div className="file-input">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".ydk,.yaml,.yml"
                style={{ display: 'none' }}
            />
            <button onClick={handleButtonClick}>
                {fileName ? 'Change File' : 'Import YDK/YAML'}
            </button>
            {fileName && (
                <span className={`file-name ${isValidFileType(fileName) ? 'valid' : 'invalid'}`}>
                    {fileName}
                </span>
            )}
            {fileName && !isValidFileType(fileName) && (
                <p className="error-message">Invalid file type. Please select a .ydk, .yaml, or .yml file.</p>
            )}
        </div>
    );
};

export default FileInput;