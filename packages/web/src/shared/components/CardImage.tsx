import React, { useState, useEffect } from 'react';
import { Box, BoxProps, CircularProgress } from '@mui/material';
import { getCardImage } from '@api/probi-oh/card-image';

interface CardImageProps extends Omit<BoxProps, 'component'> {
    cardName?: string;
    cardId?: number;
    type?: 'small' | 'full' | 'cropped';
}

export default function CardImage({ cardName, cardId,  type: type = 'full', ...props}: CardImageProps) {
    const [imageSrc, setImageSrc] = useState<string>('');
    const [loadingImage, setLoadingImage] = useState<boolean>(true);

    useEffect(() => {
        const loadImage = async () => {
            setLoadingImage(true);
            try {
                const imageSearchName = cardName || cardId;
                
                if (!imageSearchName) {
                    throw new Error('No name or ID provided');
                }

                const imageBlob = await getCardImage(imageSearchName, type);
                if (imageBlob) {
                    const url = URL.createObjectURL(imageBlob);
                    setImageSrc(url);
                } else {
                    const blankBlob = await getCardImage(73915052, type);
                    if (blankBlob) {
                        const url = URL.createObjectURL(blankBlob);
                        setImageSrc(url);
                    }
                }
            } catch (err) {
                console.error('Error loading image:', err);
                const blankBlob = await getCardImage(73915052, type);
                if (blankBlob) {
                    const url = URL.createObjectURL(blankBlob);
                    setImageSrc(url);
                }
            }
            setLoadingImage(false);
        };
    
        loadImage();
    
        // Cleanup function to revoke the object URL
        return () => {
          if (imageSrc) {
            URL.revokeObjectURL(imageSrc);
          }
        };
      }, [cardName, cardId, type]);

    return (
        <>
            {loadingImage ? (
                <CircularProgress 
                    size={20} 
                />
            ) : (
                <Box
                    component="img"
                    src={imageSrc}
                    alt={`Yu-Gi-Oh card: ${name}`}
                    loading="lazy"
                    {...props}
                />
            )}
        </>
    );
}
