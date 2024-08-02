import React, { useState, KeyboardEvent, FocusEvent } from 'react';
import '../styles/FlexibleTextBox.css';

interface FlexibleTextBoxProps {
    onChange?: (value: string) => void;
    onComplete?: (value: string) => void;
    placeholder: string;
}

const FlexibleTextBox: React.FC<FlexibleTextBoxProps> = ({ 
    onChange, 
    onComplete,
    placeholder = "Enter text here..." 
}) => {
    const [value, setValue] = useState<string>('');

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = event.target.value;
        setValue(newValue);
        if (onChange) {
            onChange(newValue);
        }
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter' && onComplete) {
            onComplete(value);
        }
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
        if (onComplete) {
            onComplete(value);
        }
    };

    return (
        <input
            type="text"
            className="text-input"
            placeholder={placeholder}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
        />
    );
};

export default FlexibleTextBox;