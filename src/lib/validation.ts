/**
 * Input validation utilities
 * Used across the application for sanitizing and validating user input
 */

// Password requirements
export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[a-zA-Z\d@$!%*?&]/;
export const PASSWORD_PATTERN_MESSAGE = "Password must contain uppercase, lowercase, number, and special character";

// Email validation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}

export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password) {
    return { valid: false, error: "Password is required" };
  }
  if (password.length < PASSWORD_MIN_LENGTH) {
    return { valid: false, error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters` };
  }
  if (!PASSWORD_PATTERN.test(password)) {
    return { valid: false, error: PASSWORD_PATTERN_MESSAGE };
  }
  return { valid: true };
}

// Numeric validation for financial amounts
export function isValidAmount(amount: unknown): boolean {
  const num = Number(amount);
  return !isNaN(num) && num >= 0 && isFinite(num);
}

export function validateAmount(amount: unknown): { valid: boolean; error?: string } {
  if (amount === null || amount === undefined || amount === "") {
    return { valid: false, error: "Amount is required" };
  }
  
  const num = Number(amount);
  
  if (isNaN(num)) {
    return { valid: false, error: "Amount must be a valid number" };
  }
  
  if (num < 0) {
    return { valid: false, error: "Amount cannot be negative" };
  }
  
  if (!isFinite(num)) {
    return { valid: false, error: "Amount must be a finite number" };
  }
  
  return { valid: true };
}

// Sanitize string input - remove potentially dangerous characters
export function sanitizeString(input: string, maxLength: number = 1000): string {
  return input
    .trim()
    .substring(0, maxLength)
    .replace(/[\x00-\x1F\x7F]/g, ""); // Remove control characters
}

// Validate category enum
export function isValidCategory(category: unknown, validCategories: string[]): boolean {
  return typeof category === "string" && validCategories.includes(category);
}

// Validate date string
export function isValidDate(dateString: unknown): boolean {
  if (typeof dateString !== "string") return false;
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

// Sanitize error messages - don't expose internal details
export function sanitizeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Don't expose internal error details to the UI
    const message = error.message.toLowerCase();
    
    if (message.includes("credentials") || message.includes("auth")) {
      return "Authentication failed. Please check your credentials.";
    }
    if (message.includes("network") || message.includes("connection")) {
      return "Network error. Please check your connection and try again.";
    }
    if (message.includes("already exists") || message.includes("duplicate")) {
      return "This entry already exists. Please use different information.";
    }
  }
  
  return "An error occurred. Please try again.";
}
