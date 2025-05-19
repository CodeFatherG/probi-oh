import React, { useState, useEffect } from 'react';
import { Box, BoxProps, CircularProgress } from '@mui/material';
import { getCardImage } from '@api/ygopro/card-api';

interface CardImageProps extends Omit<BoxProps, 'component'> {
    name: string;
    type?: 'small' | 'full' | 'cropped';
}

const FALLBACK_IMAGE_URL = '../../res/blank.png';

export default function CardImage({ name, type: type = 'full', ...props}: CardImageProps) {
    const [imageSrc, setImageSrc] = useState<string>('');
    const [loadingImage, setLoadingImage] = useState<boolean>(true);

    useEffect(() => {
        const loadImage = async () => {
            setLoadingImage(true);
            try {
                const imageBlob = await getCardImage(name, type);
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
          if (imageSrc && imageSrc !== FALLBACK_IMAGE_URL) {
            URL.revokeObjectURL(imageSrc);
          }
        };
      }, [name, type]);

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
