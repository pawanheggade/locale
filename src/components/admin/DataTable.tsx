
import React, { useState, useEffect } from 'react';
import { SortConfig } from '../../hooks/useSort';
import { SortableHeader } from './SortableHeader';
import { Button } from '../ui/Button';
import { ChevronLeftIcon, ChevronRightIcon } from '../Icons';

interface Column<T> {
    header: React.ReactNode;
    sortKey?: keyof T;
    className?: string;
}

interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    renderRow: (item: T, index: number) => React.ReactNode;
    sortConfig: SortConfig<T> | null;
    requestSort: (key: keyof T) => void;
    rowsPerPage?: number;
}

export function DataTable<T extends { id: string | number }>({
    columns,
    data,
    renderRow,
    sortConfig,
    requestSort,
    rowsPerPage = 10,
}: DataTableProps<T>) {
    const [currentPage, setCurrentPage] = useState(1);

    // Reset to page 1 if data source changes (e.g. filter or sort)
    useEffect(() => {
        setCurrentPage(1);
    }, [data.length, sort