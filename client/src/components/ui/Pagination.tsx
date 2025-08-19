import React from 'react';
import Button from './Button';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

const Pagination: React.FC<PaginationProps> = ({ 
  currentPage, 
  totalPages,
  onPageChange,
  className = ''
}) => {
  // Generate page numbers to display
  const getPageNumbers = () => {
    const pageNumbers = [];
    
    // Always show first page
    if (currentPage > 3) {
      pageNumbers.push(1);
    }
    
    // Show ellipsis if needed
    if (currentPage > 4) {
      pageNumbers.push('...');
    }
    
    // Show pages around current page
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pageNumbers.push(i);
    }
    
    // Show ellipsis if needed
    if (currentPage < totalPages - 3) {
      pageNumbers.push('...');
    }
    
    // Always show last page
    if (currentPage < totalPages - 1) {
      pageNumbers.push(totalPages);
    }
    
    return pageNumbers;
  };
  
  const pageNumbers = getPageNumbers();
  
  return (
    <div className={`flex justify-center items-center ${className}`}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="mr-2"
      >
        Previous
      </Button>
      
      {pageNumbers.map((page, index) => (
        <React.Fragment key={index}>
          {page === '...' ? (
            <span className="px-3 py-1 mx-1">...</span>
          ) : (
            <button
              className={`px-3 py-1 mx-1 rounded-md ${
                page === currentPage
                  ? 'bg-primary text-white'
                  : 'text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
              onClick={() => typeof page === 'number' && onPageChange(page)}
            >
              {page}
            </button>
          )}
        </React.Fragment>
      ))}
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="ml-2"
      >
        Next
      </Button>
    </div>
  );
};

export default Pagination; 