import React, { useState } from 'react';
import TagBox from './TagBox';

const CardComponent: React.FC = () => {
    const [name] = useState<string>('Test aedggrfgdrfgdrtfgdtrh');
    const [quantity, setQuantity] = useState<number>(1);

    const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let qty = parseInt(e.target.value, 10)
        if (isNaN(qty) || qty <= 0) {
            qty = 1;
        }
        setQuantity(qty);
    };

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px',
            border: '1px solid #ccc',
            borderRadius: '5px',
            maxWidth: '100%',
        }}>
            <div
                style={{
                    padding: '5px',
                    minWidth: '100px',
                    maxWidth: '400px',
                    flex: '1 1 auto',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    backgroundColor: '#f0f0f0',
                    overflowX: 'auto',
                    whiteSpace: 'nowrap',
                }}
            >
                {name}
            </div>

            <input
                type="number"
                value={quantity}
                onChange={handleQuantityChange}
                min="0"
                style={{ padding: '5px', width: '40px', flexShrink: 0 }}
            />

            <TagBox />
        </div>
    );
};

export default CardComponent;