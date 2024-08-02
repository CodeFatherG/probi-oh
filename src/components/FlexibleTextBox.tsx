import React, { useState, KeyboardEvent } from 'react';
import '../styles/FlexibleTextBox.css';

interface FlexibleTextBoxProps {
    onChange?: (value: string) => void;
    onComplete?: (value: string) => void;
    placeholder?: string;
    style?: React.CSSProperties;
}

const FlexibleTextBox: React.FC<FlexibleTextBoxProps> = ({ 
    onChange, 
    onComplete,
    placeholder = "Enter text here...",
    style = {}
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
        if (event.key === 'Enter') {
            if (onComplete) {
                onComplete(value);
            }
            setValue('');
        }
    };

    const handleBlur = () => {
        if (onComplete) {
            onComplete(value);
        }
        setValue('');
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
            style={{ ...style, boxSizing: 'border-box' }}
        />
    );
};

export default FlexibleTextBox;