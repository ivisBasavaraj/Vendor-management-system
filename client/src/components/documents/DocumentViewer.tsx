import React, { useState, useEffect } from 'react';
import Button from '../ui/Button';
import { ArrowDownTrayIcon, DocumentTextIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface DocumentViewerProps {
  documentUrl: string;
  fileName?: string;
  mimeType?: string;
  filePath?: string; // Add filePath prop for download functionality
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ 
  documentUrl, 
  fileName = 'document',
  mimeType = 'application/pdf',
  filePath
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<boolean>(false);

  // Reset preview error when documentUrl changes
  useEffect(() => {
    setPreviewError(false);
  }, [documentUrl]);

  const handleDownload = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Starting download for:', { documentUrl, fileName, filePath });
      
      // Import apiService dynamically to avoid circular dependencies
      const { default: apiService } = await import('../../utils/api');
      
      // Use the provided filePath or extract from documentUrl
      let downloadPath = filePath || documentUrl;
      if (documentUrl.includes('/api/document-submissions/view?filePath=')) {
        const urlParams = new URLSearchParams(documentUrl.split('?')[1]);
        downloadPath = urlParams.get('filePath') || downloadPath;
      }
      
      console.log('Downloading file with path:', downloadPath);
      
      // Call the download API
      const response = await apiService.documents.downloadFile(downloadPath, fileName);
      
      // Create blob URL and trigger download
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || 'document';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('Download completed successfully');
      setLoading(false);
    } catch (err) {
      console.error('Error downloading document:', err);
      setError('Failed to download document. Please try again later.');
      setLoading(false);
    }
  };

  const handlePreviewError = () => {
    console.error('Error loading document preview');
    setPreviewError(true);
  };

  // Determine file type for icon and preview handling
  const getFileType = () => {
    if (!mimeType) return 'unknown';
    
    if (mimeType.includes('pdf')) return 'pdf';
    if (mimeType.includes('image')) return 'image';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'word';
    if (mimeType.includes('excel') || mimeType.includes('sheet')) return 'excel';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'powerpoint';
    if (mimeType.includes('text')) return 'text';
    
    return 'unknown';
  };

  const fileType = getFileType();

  return (
    <div className="flex flex-col items-center w-full">
      <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-lg p-4 mb-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <DocumentTextIcon className="h-5 w-5 mr-2 text-gray-500" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate max-w-md">
              {fileName}
            </h3>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={loading}
            leftIcon={<ArrowDownTrayIcon className="h-4 w-4" />}
          >
            Download
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 p-4 mb-4">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2" />
              <div>
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-center">
          <div className="border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden w-full h-[600px] bg-white dark:bg-gray-900">
            {previewError ? (
              <div className="flex flex-col items-center justify-center h-full">
                <ExclamationTriangleIcon className="h-12 w-12 text-yellow-500 mb-4" />
                <p className="text-gray-700 dark:text-gray-300 mb-4 text-center px-4">
                  There was an error loading the preview for this document.
                </p>
                <Button
                  variant="primary"
                  onClick={handleDownload}
                  leftIcon={<ArrowDownTrayIcon className="h-5 w-5" />}
                >
                  Download to View
                </Button>
              </div>
            ) : fileType === 'pdf' ? (
              <iframe 
                src={documentUrl} 
                className="w-full h-full" 
                title={fileName}
                onError={handlePreviewError}
                sandbox="allow-same-origin allow-scripts allow-forms"
              />
            ) : fileType === 'image' ? (
              <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-800">
                <img 
                  src={documentUrl} 
                  alt={fileName} 
                  className="max-w-full max-h-full object-contain mx-auto"
                  onError={handlePreviewError}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <DocumentTextIcon className="h-16 w-16 text-gray-400 mb-4" />
                <p className="text-gray-700 dark:text-gray-300 mb-2 text-center">
                  {fileType !== 'unknown' 
                    ? `This is a ${fileType.toUpperCase()} file` 
                    : 'This file type cannot be previewed in the browser'}
                </p>
                <p className="text-gray-500 dark:text-gray-400 mb-4 text-center px-4">
                  Please download the file to view its contents
                </p>
                <Button
                  variant="primary"
                  onClick={handleDownload}
                  leftIcon={<ArrowDownTrayIcon className="h-5 w-5" />}
                >
                  Download to View
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentViewer;