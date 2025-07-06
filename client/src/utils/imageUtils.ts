/**
 * Utility functions for handling image URLs
 */

/**
 * Converts a relative image URL to a full URL
 * @param imageUrl - The image URL (can be relative or absolute)
 * @returns Full URL for the image
 */
export const getFullImageUrl = (imageUrl: string | null | undefined): string => {
  if (!imageUrl) return '';
  
  // If the URL is already absolute, return as is
  if (imageUrl.startsWith('http') || imageUrl.startsWith('https')) {
    return imageUrl;
  }
  
  // If it's a relative URL, prepend the server URL
  const serverUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
  return `${serverUrl}${imageUrl}`;
};

/**
 * Checks if an image URL is valid and accessible
 * @param imageUrl - The image URL to check
 * @returns Promise that resolves to true if image is accessible
 */
export const isImageAccessible = (imageUrl: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = imageUrl;
  });
};