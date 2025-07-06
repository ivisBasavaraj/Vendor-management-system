import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import {
  DocumentIcon,
  DocumentTextIcon,
  DocumentChartBarIcon,
  PhotoIcon,
  TrashIcon,
  ArrowUpTrayIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';

export interface UploadedFile extends File {
  id: string;
  preview?: string;
  progress: number;
  error?: string;
  uploaded?: boolean;
}

interface FileUploaderProps {
  maxFiles?: number;
  maxSize?: number;
  accept?: Record<string, string[]>;
  onFilesChange?: (files: UploadedFile[]) => void;
  className?: string;
}

const FileUploader: React.FC<FileUploaderProps> = ({
  maxFiles = 5,
  maxSize = 10485760, // 10MB
  accept = {
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'application/vnd.ms-excel': ['.xls'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
  },
  onFilesChange,
  className = '',
}) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  
  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    // Handle rejected files (too large, wrong type, etc.)
    if (rejectedFiles.length > 0) {
      const errorFiles: UploadedFile[] = rejectedFiles.map(({ file, errors }) => ({
        ...file,
        id: crypto.randomUUID ? crypto.randomUUID() : `${file.name}-${Date.now()}`,
        progress: 0,
        error: errors.map((e: any) => e.message).join(', '),
      })) as UploadedFile[];

      setFiles(prev => [...prev, ...errorFiles].slice(0, maxFiles));
    }
    
    // Handle accepted files
    const newFiles: UploadedFile[] = acceptedFiles.map(file => {
      // Create preview for images
      let preview;
      if (file.type.startsWith('image/')) {
        preview = URL.createObjectURL(file);
      }
      
      return {
        ...file,
        id: crypto.randomUUID ? crypto.randomUUID() : `${file.name}-${Date.now()}`,
        preview,
        progress: 0,
      } as UploadedFile;
    });
    
    const updatedFiles = [...files, ...newFiles].slice(0, maxFiles);
    setFiles(updatedFiles);
    
    if (onFilesChange) {
      onFilesChange(updatedFiles);
    }
    
    // Simulate upload process
    newFiles.forEach(file => {
      simulateUpload(file);
    });
  }, [files, maxFiles, onFilesChange]);
  
  const simulateUpload = (file: UploadedFile) => {
    // This would be replaced with a real upload implementation
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 10) + 5;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        
        // Mark as uploaded after completion
        setFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, progress, uploaded: true } : f
        ));
        
        if (onFilesChange) {
          onFilesChange(files.map(f => 
            f.id === file.id ? { ...f, progress, uploaded: true } : f
          ));
        }
      } else {
        setFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, progress } : f
        ));
      }
    }, 300);
  };
  
  const removeFile = (id: string) => {
    // Clean up any created object URLs to avoid memory leaks
    const fileToRemove = files.find(file => file.id === id);
    if (fileToRemove?.preview) {
      URL.revokeObjectURL(fileToRemove.preview);
    }
    
    const updatedFiles = files.filter(file => file.id !== id);
    setFiles(updatedFiles);
    
    if (onFilesChange) {
      onFilesChange(updatedFiles);
    }
  };
  
  const getFileIcon = (file: UploadedFile) => {
    if (file.type.startsWith('image/')) {
      return <PhotoIcon className="h-8 w-8 text-blue-500" />;
    }
    
    if (file.type === 'application/pdf') {
      return <DocumentTextIcon className="h-8 w-8 text-red-500" />;
    }
    
    if (file.type.includes('spreadsheet') || file.type.includes('excel')) {
      return <DocumentChartBarIcon className="h-8 w-8 text-green-500" />;
    }
    
    return <DocumentIcon className="h-8 w-8 text-neutral-500" />;
  };
  
  const { getRootProps, getInputProps, isDragActive, isFocused, isDragAccept, isDragReject } = useDropzone({
    onDrop,
    maxFiles: maxFiles - files.length,
    maxSize,
    accept,
    disabled: files.length >= maxFiles,
  });
  
  const fileRejections = isDragReject || files.length >= maxFiles;
  
  return (
    <div className={className}>
      <div
        {...getRootProps()}
        className={`p-6 border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-colors cursor-pointer
          ${isDragActive && !fileRejections ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10' : 'border-neutral-300 dark:border-neutral-700 hover:border-primary-400 dark:hover:border-primary-600'}
          ${isFocused ? 'border-primary-400 dark:border-primary-600' : ''}
          ${fileRejections ? 'border-danger-500 bg-danger-50 dark:bg-danger-900/10' : ''}
          ${files.length >= maxFiles ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        <ArrowUpTrayIcon className={`h-10 w-10 mb-3 ${fileRejections ? 'text-danger-500' : 'text-primary-500 dark:text-primary-400'}`} />
        
        {isDragActive ? (
          <p className="text-center font-medium">Drop the files here...</p>
        ) : (
          <>
            <p className="text-center font-medium">
              Drag & drop files here, or click to select files
            </p>
            <p className="text-center text-neutral-500 dark:text-neutral-400 text-sm mt-1">
              {files.length >= maxFiles ? (
                <span className="text-danger-600 dark:text-danger-400">Maximum number of files reached.</span>
              ) : (
                <>Maximum {maxFiles} files, up to {(maxSize / 1024 / 1024).toFixed(0)}MB each</>
              )}
            </p>
          </>
        )}
      </div>
      
      {/* File list */}
      {files.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-5 space-y-4"
        >
          <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Files ({files.length}/{maxFiles})</h3>
          
          <div className="space-y-3">
            {files.map((file) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className={`border rounded-lg p-3 flex items-start ${file.error ? 'border-danger-300 bg-danger-50 dark:border-danger-800 dark:bg-danger-900/10' : 'border-neutral-200 dark:border-neutral-800'}`}
              >
                <div className="mr-3 flex-shrink-0">
                  {file.preview ? (
                    <div className="h-12 w-12 rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                      <img src={file.preview} alt={file.name} className="h-full w-full object-cover" />
                    </div>
                  ) : (
                    <div className="h-12 w-12 rounded-lg flex items-center justify-center bg-neutral-100 dark:bg-neutral-800">
                      {getFileIcon(file)}
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between">
                    <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 truncate" title={file.name}>
                      {file.name}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 ml-2 flex-shrink-0">
                      {Math.round(file.size / 1024)} KB
                    </p>
                  </div>
                  
                  {file.error ? (
                    <div className="mt-1 flex items-center text-xs text-danger-600 dark:text-danger-400">
                      <ExclamationCircleIcon className="h-3.5 w-3.5 mr-1" />
                      {file.error}
                    </div>
                  ) : file.uploaded ? (
                    <div className="mt-1 flex items-center text-xs text-success-600 dark:text-success-400">
                      <CheckCircleIcon className="h-3.5 w-3.5 mr-1" />
                      Upload complete
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between mt-1 items-center">
                        <div className="upload-progress-bar flex-1 max-w-xs">
                          <div 
                            className="upload-progress-bar-fill" 
                            style={{ width: `${file.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-neutral-500 dark:text-neutral-400 ml-2">
                          {file.progress}%
                        </span>
                      </div>
                    </>
                  )}
                </div>
                
                <button
                  type="button"
                  onClick={() => removeFile(file.id)}
                  className="ml-3 flex-shrink-0 p-1 text-neutral-400 hover:text-danger-500 dark:text-neutral-500 dark:hover:text-danger-400 rounded-full"
                >
                  <span className="sr-only">Remove</span>
                  <TrashIcon className="h-5 w-5" />
                </button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default FileUploader; 