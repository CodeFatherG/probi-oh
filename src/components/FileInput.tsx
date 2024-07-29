import React from 'react';

interface FileInputProps {
    onFileUpload: (content: string) => void;
    accept: string;
}

const FileInput: React.FC<FileInputProps> = ({ onFileUpload, accept }) => {
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target?.result as string;
                onFileUpload(content);
            };
            reader.readAsText(file);
        }
    };

    return (
        <div>
            <input 
                type="file" 
                onChange={handleFileChange} 
                accept={accept}
                id="fileInput"
            />
            <label htmlFor="fileInput">Import YDK/YAML</label>
        </div>
    );
};

export default FileInput;