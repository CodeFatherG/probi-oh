import { Paper, Table, TableBody, TableCell, TableContainer, TableContainerProps, TableHead, TableRow } from "@mui/material";
import React, { useEffect, useState } from "react";

interface UsageTableProps extends TableContainerProps {
    usage: Record<string, number>;
}

export default function UsageTable({ usage, ...props }: UsageTableProps) {
    const [sortedUsage, setSortedUsage] = useState<[string, number][]>([]);

    useEffect(() => {
        const sorted = Object.entries(usage).sort((a, b) => b[1] - a[1]);
        setSortedUsage(sorted);
    }, [usage]);

    return (
        <TableContainer component={Paper} {...props}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Copies</TableCell>
                        <TableCell>Used</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {sortedUsage.map((row) => (
                        <TableRow
                            key={row[0]}
                            sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                        >
                            <TableCell component="th" scope="row">
                                {row[0]}
                            </TableCell>
                            <TableCell>{row[1]}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            </TableContainer>
    )
}