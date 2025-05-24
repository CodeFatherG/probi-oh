import React from "react";
import { Box, BoxProps } from "@mui/material";
import logo from "@/assets/dtlogo.png";

interface LogoProps extends Omit<BoxProps, 'component'> {
}

export default function Logo({...props}: LogoProps) {
    return (
        <Box
            component="img"
            src={logo}
            alt="Logo"
            {...props}
        />
    )
}
