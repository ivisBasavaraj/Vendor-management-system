/**
 * Utility functions for MIME type detection and file handling
 */

/**
 * Determines the MIME type based on file extension
 * @param fileName - The file name or path
 * @returns The appropriate MIME type string
 */
export const getMimeTypeFromFileName = (fileName: string): string => {
  if (!fileName) return 'application/octet-stream';
  
  const fileExtension = fileName.split('.').pop()?.toLowerCase();
  
  switch (fileExtension) {
    case 'pdf':
      return 'application/pdf';
    case 'doc':
      return 'application/msword';
    case 'docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case 'xls':
      return 'application/vnd.ms-excel';
    case 'xlsx':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    case 'ppt':
      return 'application/vnd.ms-powerpoint';
    case 'pptx':
      return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    case 'txt':
      return 'text/plain';
    case 'csv':
      return 'text/csv';
    case 'zip':
      return 'application/zip';
    case 'rar':
      return 'application/vnd.rar';
    default:
      return 'application/octet-stream';
  }
};

/**
 * Gets the file type category for display purposes
 * @param fileName - The file name or path
 * @returns A category string (pdf, word, excel, powerpoint, image, text, archive, unknown)
 */
export const getFileCategory = (fileName: string): string => {
  if (!fileName) return 'unknown';
  
  const fileExtension = fileName.split('.').pop()?.toLowerCase();
  
  switch (fileExtension) {
    case 'pdf':
      return 'pdf';
    case 'doc':
    case 'docx':
      return 'word';
    case 'xls':
    case 'xlsx':
      return 'excel';
    case 'ppt':
    case 'pptx':
      return 'powerpoint';
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
      return 'image';
    case 'txt':
    case 'csv':
      return 'text';
    case 'zip':
    case 'rar':
      return 'archive';
    default:
      return 'unknown';
  }
};

/**
 * Checks if a file can be previewed in the browser
 * @param fileName - The file name or path
 * @returns true if the file can be previewed, false otherwise
 */
export const canPreviewInBrowser = (fileName: string): boolean => {
  const category = getFileCategory(fileName);
  return ['pdf', 'image'].includes(category);
};

/**
 * Gets a user-friendly file type description
 * @param fileName - The file name or path
 * @returns A human-readable file type description
 */
export const getFileTypeDescription = (fileName: string): string => {
  const category = getFileCategory(fileName);
  
  switch (category) {
    case 'pdf':
      return 'PDF Document';
    case 'word':
      return 'Word Document';
    case 'excel':
      return 'Excel Spreadsheet';
    case 'powerpoint':
      return 'PowerPoint Presentation';
    case 'image':
      return 'Image File';
    case 'text':
      return 'Text File';
    case 'archive':
      return 'Archive File';
    default:
      return 'Document';
  }
};