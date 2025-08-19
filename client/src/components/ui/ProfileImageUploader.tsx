import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import {
  CameraIcon,
  PhotoIcon,
  TrashIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

interface ProfileImageUploaderProps {
  currentImage?: string;
  onImageChange?: (file: File | null, preview: string | null) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

const ProfileImageUploader: React.FC<ProfileImageUploaderProps> = ({
  currentImage,
  onImageChange,
  className = '',
  size = 'md',
  disabled = false,
}) => {
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const sizeClasses = {
    sm: 'h-16 w-16',
    md: 'h-24 w-24',
    lg: 'h-32 w-32',
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setError(null);
    
    if (rejectedFiles.length > 0) {
      const errors = rejectedFiles[0].errors;
      if (errors.some((e: any) => e.code === 'file-too-large')) {
        setError('File size must be less than 5MB');
      } else if (errors.some((e: any) => e.code === 'file-invalid-type')) {
        setError('Only JPG, PNG, and GIF images are allowed');
      } else {
        setError('Invalid file');
      }
      return;
    }

    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      const previewUrl = URL.createObjectURL(file);
      
      setPreview(previewUrl);
      setUploading(true);
      
      // Simulate upload process
      setTimeout(() => {
        setUploading(false);
        if (onImageChange) {
          onImageChange(file, previewUrl);
        }
      }, 1000);
    }
  }, [onImageChange]);

  const removeImage = () => {
    if (preview && preview !== currentImage) {
      URL.revokeObjectURL(preview);
    }
    setPreview(null);
    setError(null);
    if (onImageChange) {
      onImageChange(null, null);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif'],
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    multiple: false,
    disabled: disabled || uploading,
  });

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="relative">
        {/* Profile Image Display */}
        <div className={`${sizeClasses[size]} rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 border-4 border-white dark:border-gray-700 shadow-lg`}>
          {preview ? (
            <img
              src={preview}
              alt="Profile"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
              <PhotoIcon className={`${iconSizes[size]} text-white`} />
            </div>
          )}
          
          {/* Upload Overlay */}
          {uploading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
            </div>
          )}
        </div>

        {/* Upload Button */}
        <div
          {...getRootProps()}
          className={`absolute -bottom-2 -right-2 ${sizeClasses.sm} rounded-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 shadow-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center ${
            disabled || uploading ? 'opacity-50 cursor-not-allowed' : ''
          } ${isDragActive ? 'bg-blue-50 border-blue-300' : ''}`}
        >
          <input {...getInputProps()} />
          <CameraIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
        </div>

        {/* Remove Button */}
        {preview && !uploading && (
          <button
            onClick={removeImage}
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg transition-colors flex items-center justify-center"
            disabled={disabled}
          >
            <TrashIcon className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Upload Instructions */}
      <div className="mt-3 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Click the camera icon to upload
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500">
          JPG, PNG, GIF up to 5MB
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 flex items-center text-sm text-red-600 dark:text-red-400"
        >
          <ExclamationCircleIcon className="h-4 w-4 mr-1" />
          {error}
        </motion.div>
      )}

      {/* Success Message */}
      {preview && !uploading && !error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 flex items-center text-sm text-green-600 dark:text-green-400"
        >
          <CheckCircleIcon className="h-4 w-4 mr-1" />
          Image ready to upload
        </motion.div>
      )}
    </div>
  );
};

export default ProfileImageUploader;