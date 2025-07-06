import React, { useState } from 'react';
// Mock implementation for react-pdf
// This is a temporary solution until the actual react-pdf package is installed
const pdfjs = {
  version: '2.12.313',
  GlobalWorkerOptions: {
    workerSrc: ''
  }
};

// Mock Document and Page components
const Document = ({ file, onLoadSuccess, onLoadError, loading, children }: any) => {
  React.useEffect(() => {
    // Simulate successful loading
    setTimeout(() => {
      onLoadSuccess({ numPages: 5 });
    }, 1000);
  }, [file, onLoadSuccess]);

  return <div className="pdf-document">{children}</div>;
};

const Page = ({ pageNumber, renderTextLayer, renderAnnotationLayer, className, width }: any) => {
  return (
    <div className={className} style={{ width: `${width}px`, height: '800px', background: '#f0f0f0', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div className="text-center">
        <p className="text-lg font-medium">PDF Preview</p>
        <p>Page {pageNumber}</p>
        <p className="text-sm text-gray-500 mt-4">
          (PDF viewer is currently unavailable. Please install react-pdf package.)
        </p>
      </div>
    </div>
  );
};

import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import Button from '../ui/Button';

interface PDFViewerProps {
  pdfUrl: string;
  fileName?: string;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ pdfUrl, fileName }) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('Error loading PDF:', error);
    setError('Failed to load the PDF document. Please try again later.');
    setLoading(false);
  };

  const goToPrevPage = () => {
    setPageNumber(prevPageNumber => Math.max(prevPageNumber - 1, 1));
  };

  const goToNextPage = () => {
    setPageNumber(prevPageNumber => Math.min(prevPageNumber + 1, numPages || 1));
  };

  return (
    <div className="flex flex-col items-center">
      <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-lg p-4 mb-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {fileName || 'Document Viewer'}
          </h3>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {numPages ? `Page ${pageNumber} of ${numPages}` : 'Loading...'}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-center">
          <div className="border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden">
            <Document
              file={pdfUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={
                <div className="flex justify-center items-center h-96 w-full">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
                </div>
              }
            >
              <Page 
                pageNumber={pageNumber} 
                renderTextLayer={false}
                renderAnnotationLayer={false}
                className="pdf-page"
                width={600}
              />
            </Document>
          </div>
        </div>

        {numPages && numPages > 1 && (
          <div className="flex justify-center mt-4 space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPrevPage}
              disabled={pageNumber <= 1}
              leftIcon={<ChevronLeftIcon className="h-4 w-4" />}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextPage}
              disabled={pageNumber >= numPages}
              rightIcon={<ChevronRightIcon className="h-4 w-4" />}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PDFViewer;