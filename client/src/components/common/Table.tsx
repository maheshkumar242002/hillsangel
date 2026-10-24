import React from 'react';
import { Loader2, Inbox } from 'lucide-react';

export interface TableColumn<T = any> {
  key: string;
  header: React.ReactNode;
  width?: string;
  minWidth?: string;
  align?: 'left' | 'center' | 'right';
  className?: string;
  render?: (row: T, index: number) => React.ReactNode;
}

export interface TableProps<T = any> {
  columns?: TableColumn<T>[];
  data?: T[];
  minWidth?: string;
  loading?: boolean;
  emptyMessage?: string;
  emptyState?: React.ReactNode;
  hoverable?: boolean;
  striped?: boolean;
  className?: string;
  containerClassName?: string;
  children?: React.ReactNode;
  keyExtractor?: (row: T, index: number) => string | number;
}

export const Table = <T extends Record<string, any>>({
  columns,
  data,
  minWidth = '1000px',
  loading = false,
  emptyMessage = 'No records found',
  emptyState,
  hoverable = true,
  striped = false,
  className = '',
  containerClassName = '',
  children,
  keyExtractor,
}: TableProps<T>): React.ReactElement => {
  return (
    <div
      className={`bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden ${containerClassName}`}
    >
      <div className="overflow-x-auto w-full">
        <table
          style={{ minWidth }}
          className={`w-full text-left border-collapse text-xs ${className}`}
        >
          {children ? (
            children
          ) : (
            <>
              {columns && (
                <thead>
                  <tr className="border-b border-gray-100 text-muted uppercase bg-surface/50 text-[11px] tracking-wider select-none">
                    {columns.map((col) => (
                      <th
                        key={col.key}
                        style={{ width: col.width, minWidth: col.minWidth }}
                        className={`py-3.5 px-4 font-bold ${
                          col.align === 'right'
                            ? 'text-right'
                            : col.align === 'center'
                            ? 'text-center'
                            : 'text-left'
                        } ${col.className || ''}`}
                      >
                        {col.header}
                      </th>
                    ))}
                  </tr>
                </thead>
              )}

              <tbody className="divide-y divide-gray-100 font-sans">
                {loading ? (
                  <tr>
                    <td
                      colSpan={columns ? columns.length : 1}
                      className="py-12 text-center text-muted"
                    >
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        <span className="text-xs font-medium">Loading records...</span>
                      </div>
                    </td>
                  </tr>
                ) : data && data.length > 0 ? (
                  data.map((row, index) => {
                    const rowKey = keyExtractor
                      ? keyExtractor(row, index)
                      : row.id || row._id || index;

                    return (
                      <tr
                        key={rowKey}
                        className={`transition-colors ${
                          hoverable ? 'hover:bg-gray-50/70' : ''
                        } ${striped && index % 2 === 1 ? 'bg-surface/30' : ''}`}
                      >
                        {columns?.map((col) => (
                          <td
                            key={col.key}
                            style={{ minWidth: col.minWidth }}
                            className={`py-3 px-4 ${
                              col.align === 'right'
                                ? 'text-right'
                                : col.align === 'center'
                                ? 'text-center'
                                : 'text-left'
                            } ${col.className || ''}`}
                          >
                            {col.render ? col.render(row, index) : row[col.key]}
                          </td>
                        ))}
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={columns ? columns.length : 1}
                      className="py-12 text-center text-muted"
                    >
                      {emptyState ? (
                        emptyState
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Inbox className="w-8 h-8 text-gray-300 stroke-1" />
                          <p className="text-xs font-medium text-gray-500">{emptyMessage}</p>
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </>
          )}
        </table>
      </div>
    </div>
  );
};

// Sub-components for composable JSX usage
Table.Header = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <thead>
    <tr className={`border-b border-gray-100 text-muted uppercase bg-surface/50 text-[11px] tracking-wider select-none ${className}`}>
      {children}
    </tr>
  </thead>
);

Table.Head = ({
  children,
  className = '',
  align = 'left',
  width,
  minWidth,
}: {
  children: React.ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
  width?: string;
  minWidth?: string;
}) => (
  <th
    style={{ width, minWidth }}
    className={`py-3.5 px-4 font-bold ${
      align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'
    } ${className}`}
  >
    {children}
  </th>
);

Table.Body = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <tbody className={`divide-y divide-gray-100 ${className}`}>{children}</tbody>
);

Table.Row = ({
  children,
  className = '',
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) => (
  <tr
    onClick={onClick}
    className={`hover:bg-gray-50/70 transition-colors ${onClick ? 'cursor-pointer' : ''} ${className}`}
  >
    {children}
  </tr>
);

Table.Cell = ({
  children,
  className = '',
  align = 'left',
}: {
  children: React.ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
}) => (
  <td
    className={`py-3 px-4 ${
      align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'
    } ${className}`}
  >
    {children}
  </td>
);

export default Table;
