/**
 * Formats a date string (YYYY-MM-DD) to a localized date string
 * Avoids timezone conversion issues by parsing the date manually
 *
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export const formatDate = (dateString, options = {
  year: 'numeric',
  month: 'short',
  day: 'numeric'
}) => {
  if (!dateString) return 'N/A';

  // Parse date string manually to avoid timezone issues
  const [year, month, day] = dateString.split('T')[0].split('-').map(Number);
  const date = new Date(year, month - 1, day); // month is 0-indexed

  return date.toLocaleDateString('en-US', options);
};

/**
 * Formats a full ISO datetime string to a localized date string
 * For timestamps with time components (created_at, updated_at, etc.)
 *
 * @param {string} isoString - ISO 8601 datetime string
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export const formatDateTime = (isoString, options = {
  year: 'numeric',
  month: 'short',
  day: 'numeric'
}) => {
  if (!isoString) return 'N/A';

  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', options);
};
