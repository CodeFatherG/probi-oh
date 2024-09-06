import React from 'react';
import { Box, Link } from '@mui/material';

interface GitLinkProps {
    link: string;
    text: string;
}

export default function GitLink({link, text}: GitLinkProps) {
    return (
        <Box
            sx={{
                padding: '4px 8px',
                borderRadius: '4px',
            }}
        >
            <Link
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                color: 'primary.main',
                '&:hover': {
                    color: 'primary.dark',
                },
                textDecoration: 'none',
                fontSize: '0.875rem',
                }}
            >
                {text}
            </Link>
        </Box>
      );
}
