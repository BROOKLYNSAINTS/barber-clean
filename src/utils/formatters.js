/**
 * Format a number as currency (USD)
 * @param {number} amount - The amount to format
 * @param {string} currency - The currency code (default: USD)
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount, currency = 'USD') {
  // Handle empty or invalid values
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return '$0.00';
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Format a date string (YYYY-MM-DD) to a more readable format
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @returns {string} Formatted date string (e.g., "Oct 15, 2023")
 */
export function formatDate(dateStr) {
  if (!dateStr) return '';
  
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric', 
    year: 'numeric'
  });
}

/**
 * Format a time string to a more readable format
 * @param {string} timeStr - Time string (e.g., "15:30" or "3:30 PM")
 * @returns {string} Formatted time string
 */
export function formatTime(timeStr) {
  if (!timeStr) return '';
  
  // If it's already in 12-hour format with AM/PM, return as is
  if (timeStr.includes('AM') || timeStr.includes('PM') || 
      timeStr.includes('A.M.') || timeStr.includes('P.M.')) {
    return timeStr;
  }
  
  // Convert 24-hour format to 12-hour format
  const [hours, minutes] = timeStr.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) return timeStr;
  
  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  
  return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Calculate time difference and return a human-readable string
 * @param {Date|string} date - Date to compare
 * @returns {string} Human-readable time difference
 */
export function timeAgo(date) {
  if (!date) return '';
  
  const now = new Date();
  const timeDate = new Date(date);
  
  if (isNaN(timeDate.getTime())) return '';
  
  const seconds = Math.floor((now - timeDate) / 1000);
  
  // Less than a minute
  if (seconds < 60) return 'just now';
  
  // Minutes
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  
  // Hours
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  
  // Days
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  
  // Months
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} ${months === 1 ? 'month' : 'months'} ago`;
  
  // Years
  const years = Math.floor(months / 12);
  return `${years} ${years === 1 ? 'year' : 'years'} ago`;
}