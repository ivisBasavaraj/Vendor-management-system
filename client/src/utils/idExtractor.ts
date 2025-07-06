/**
 * Utility function to safely extract ID from various formats
 * Handles cases where the value might be:
 * - A string ID
 * - An object with _id property
 * - An object with id property
 * - null/undefined
 */
export const extractId = (value: any): string | null => {
  if (!value) {
    return null;
  }
  
  if (typeof value === 'string') {
    return value;
  }
  
  if (typeof value === 'object') {
    return value._id || value.id || null;
  }
  
  // Fallback: convert to string
  return String(value);
};

/**
 * Utility function to safely extract ID and throw error if invalid
 */
export const extractIdRequired = (value: any, fieldName: string = 'ID'): string => {
  const id = extractId(value);
  
  if (!id || id === 'undefined' || id === 'null') {
    throw new Error(`Invalid ${fieldName}: ${JSON.stringify(value)}`);
  }
  
  return id;
};