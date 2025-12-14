
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
    }, [data.length, sortConfig]); // Simple dependency check

    const totalPages = Math.ceil(data.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const paginatedData = data.slice(startIndex, startIndex + rowsPerPage);

    const handleNext = () => {
        if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
    };

    const handlePrev = () => {
        if (currentPage > 1) setCurrentPage(prev => prev - 1);
    };

    return (
    <div className="flex flex-col">
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        {columns.map((col, index) =>
                            col.sortKey ? (
                                <SortableHeader
                                    key={String(col.sortKey)}
                                    label={col.header}
                                    sortKey={col.sortKey}
                                    sortConfig={sortConfig}
                                    // FIX: 'sort' is not defined, should be 'requestSort'
                                    requestSort={requestSort}
                                    className={col.className}
                                />
                            ) : (
                                <th
                                    key={index}
                                    scope="col"
                                    className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${col.className}`}
                                >
                                    {col.header}
                                </th>
                            )
                        )}
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedData.map((item, index) => (
                    <React.Fragment key={item.id}>
                            {renderRow(item, index + startIndex)}
                    </React.Fragment>
                    ))}
                    {paginatedData.length === 0 && (
                        <tr>
                            <td colSpan={columns.length} className="px-6 py-8 text-center text-gray-500 text-sm">
                                No data available.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
        
        {totalPages > 1 && (
            <div className="bg-white border-t border-gray-200 px-4 py-3 flex items-center justify-between sm:px-6">
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm text-gray-700">
                            Showing <span className="font-medium">{startIndex + 1}</span> to <span className="font-medium">{Math.min(startIndex + rowsPerPage, data.length)}</span> of <span className="font-medium">{data.length}</span> results
                        </p>
                    </div>
                    <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                            <Button
                                onClick={handlePrev}
                                disabled={currentPage === 1}
                                variant="outline"
                                className="rounded-l-md rounded-r-none px-2 py-2 text-sm text-gray-500 disabled:opacity-50"
                                aria-label="Previous"
                            >
                                <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                            </Button>
                            <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                                {currentPage} / {totalPages}
                            </span>
                            <Button
                                onClick={handleNext}
                                disabled={currentPage === totalPages}
                                variant="outline"
                                className="rounded-r-md rounded-l-none px-2 py-2 text-sm text-gray-500 disabled:opacity-50"
                                aria-label="Next"
                            >
                                <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                            </Button>
                        </nav>
                    </div>
                </div>
                {/* Mobile Pagination */}
                <div className="flex items-center justify-between w-full sm:hidden">
                     <Button onClick={handlePrev} disabled={currentPage === 1} variant="outline" size="sm">Previous</Button>
                     <span className="text-sm text-gray-700">Page {currentPage} of {totalPages}</span>
                     <Button onClick={handleNext} disabled={currentPage === totalPages} variant="outline" size="sm">Next</Button>
                </div>
            </div>
        )}
    </div>
  );
}
