"use client";

import React from "react";

export type Column<T> = {
  key: string;
  header: string | React.ReactNode;
  className?: string;
  headerClassName?: string;
  accessor?: (row: T) => React.ReactNode;
  render?: (row: T) => React.ReactNode; // alias of accessor
};

export type DataTableProps<T> = {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  emptyText?: string;
  selectable?: boolean;
  selectedIds?: string[];
  onToggleSelect?: (id: string, checked: boolean) => void;
  onToggleSelectAll?: (checked: boolean) => void;
  getRowId: (row: T) => string;
};

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  loading,
  emptyText = "No data",
  selectable,
  selectedIds = [],
  onToggleSelect,
  onToggleSelectAll,
  getRowId,
}: DataTableProps<T>) {
  const allSelected = selectable && data.length > 0 && selectedIds.length === data.length;

  return (
    <div className="bg-white border rounded-lg overflow-hidden">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50">
          <tr>
            {selectable ? (
              <th className="p-2 w-8">
                <input
                  type="checkbox"
                  checked={!!allSelected}
                  onChange={(e) => onToggleSelectAll && onToggleSelectAll(e.target.checked)}
                />
              </th>
            ) : null}
            {columns.map((col) => (
              <th key={col.key} className={`p-2 ${col.headerClassName || ""}`}>{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td className="p-6 text-center text-gray-500" colSpan={(columns.length + (selectable ? 1 : 0))}>Loading…</td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td className="p-6 text-center text-gray-500" colSpan={(columns.length + (selectable ? 1 : 0))}>{emptyText}</td>
            </tr>
          ) : (
            data.map((row) => {
              const id = getRowId(row);
              const isSelected = selectable ? selectedIds.includes(id) : false;
              return (
                <tr key={id} className="border-t">
                  {selectable ? (
                    <td className="p-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => onToggleSelect && onToggleSelect(id, e.target.checked)}
                      />
                    </td>
                  ) : null}
                  {columns.map((col) => (
                    <td key={col.key} className={`p-2 ${col.className || ""}`}>
                      {col.render ? col.render(row) : col.accessor ? col.accessor(row) : (row as any)[col.key]}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;

