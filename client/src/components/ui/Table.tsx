import React from 'react';

interface TableProps {
  children: React.ReactNode;
  className?: string;
}

interface TableHeadProps {
  children: React.ReactNode;
  className?: string;
}

interface TableBodyProps {
  children: React.ReactNode;
  className?: string;
}

interface TableRowProps {
  children: React.ReactNode;
  className?: string;
}

interface TableCellProps {
  children?: React.ReactNode;
  className?: string;
  colSpan?: number;
}

const Table: React.FC<TableProps> & {
  Head: React.FC<TableHeadProps>;
  Body: React.FC<TableBodyProps>;
  Row: React.FC<TableRowProps>;
  Cell: React.FC<TableCellProps>;
} = ({ children, className = '' }) => {
  return (
    <table className={`min-w-full divide-y divide-neutral-200 dark:divide-neutral-700 ${className}`}>
      {children}
    </table>
  );
};

const Head: React.FC<TableHeadProps> = ({ children, className = '' }) => {
  return (
    <thead className={`bg-neutral-50 dark:bg-neutral-800 ${className}`}>
      {children}
    </thead>
  );
};

const Body: React.FC<TableBodyProps> = ({ children, className = '' }) => {
  return (
    <tbody className={`bg-white dark:bg-neutral-900 divide-y divide-neutral-200 dark:divide-neutral-700 ${className}`}>
      {children}
    </tbody>
  );
};

const Row: React.FC<TableRowProps> = ({ children, className = '' }) => {
  return (
    <tr className={`hover:bg-neutral-50 dark:hover:bg-neutral-800 ${className}`}>
      {children}
    </tr>
  );
};

const Cell: React.FC<TableCellProps> = ({ children, className = '', colSpan }) => {
  return (
    <td className={`px-6 py-4 text-sm text-neutral-900 dark:text-neutral-100 ${className}`} colSpan={colSpan}>
      {children}
    </td>
  );
};

Table.Head = Head;
Table.Body = Body;
Table.Row = Row;
Table.Cell = Cell;

export default Table; 