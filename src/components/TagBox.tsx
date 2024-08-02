import React, { useState } from 'react';
import FlexibleTextBox from './FlexibleTextBox';

const TagBox: React.FC = () => {
    const [tags, setTags] = useState<string[]>([]);

    const handleFlexibleInputComplete = (value: string) => {
        if (value.trim() !== '') {
            setTags([...tags, value]);
        }
    };

    const handleDeleteTag = (indexToDelete: number) => {
        setTags(tags.filter((_, index) => index !== indexToDelete));
    };

    return (
        <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            gap: '5px', 
            width: '100%'
        }}>
            {tags.map((tag, index) => (
                <div
                    key={index}
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '5px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        backgroundColor: '#f0f0f0',
                        width: '100%',
                        boxSizing: 'border-box'
                    }}
                >
                    <span style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        flex: 1
                    }}>
                        {tag}
                    </span>
                    <button
                        onClick={() => handleDeleteTag(index)}
                        style={{
                            marginLeft: '10px',
                            padding: '2px 5px',
                            background: '#ff4d4d',
                            color: 'white',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: 'pointer'
                        }}
                    >
                        X
                    </button>
                </div>
            ))}
            <FlexibleTextBox
                onComplete={(value) => handleFlexibleInputComplete(value)}
                placeholder="Add a tag"
                style={{ 
                    width: '100%',
                    boxSizing: 'border-box'
                }}
            />
        </div>
    );
};

export default TagBox;