
import React from 'react';
import { SortConfig } from '../../hooks/useSort';
import { SortableHeader } from './SortableHeader';

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
}

export function DataTable<T extends { id: string | number }>({
    columns,
    data,
    renderRow,
    sortConfig,
    requestSort,
}: DataTableProps<T>) {
    return (
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
                                    requestSort={requestSort as (key: any) => void}
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
                    {data.map((item, index) => (
                       <React.Fragment key={item.id}>
                            {renderRow(item, index)}
                       </React.Fragment>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
