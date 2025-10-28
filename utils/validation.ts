import { logger } from './logger';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface ValidationRule<T> {
  name: string;
  validate: (value: T) => boolean;
  message: string;
  severity?: 'error' | 'warning';
}

export class Validator {
  private static instance: Validator;

  private constructor() {}

  public static getInstance(): Validator {
    if (!Validator.instance) {
      Validator.instance = new Validator();
    }
    return Validator.instance;
  }

  public validateField<T>(value: T, rules: ValidationRule<T>[], fieldName?: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const rule of rules) {
      try {
        if (!rule.validate(value)) {
          const message = fieldName ? `${fieldName}: ${rule.message}` : rule.message;
          
          if (rule.severity === 'warning') {
            warnings.push(message);
          } else {
            errors.push(message);
          }
        }
      } catch (error) {
        logger.error('Validation rule error', {
          rule: rule.name,
          fieldName,
          error: error instanceof Error ? error.message : String(error)
        });
        errors.push(`Validation error for ${fieldName || 'field'}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  public validateObject<T extends Record<string, any>>(
    obj: T,
    schema: Record<keyof T, ValidationRule<any>[]>
  ): ValidationResult & { fieldErrors: Record<string, string[]> } {
    const allErrors: string[] = [];
    const allWarnings: string[] = [];
    const fieldErrors: Record<string, string[]> = {};

    for (const [fieldName, rules] of Object.entries(schema)) {
      const fieldValue = obj[fieldName];
      const result = this.validateField(fieldValue, rules, fieldName);
      
      if (!result.isValid) {
        allErrors.push(...result.errors);
        fieldErrors[fieldName] = result.errors;
      }
      
      if (result.warnings) {
        allWarnings.push(...result.warnings);
      }
    }

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings.length > 0 ? allWarnings : undefined,
      fieldErrors
    };
  }
}

// Common validation rules
export const ValidationRules = {
  required: <T>(message = 'This field is required'): ValidationRule<T> => ({
    name: 'required',
    validate: (value) => value !== null && value !== undefined && value !== '',
    message
  }),

  email: (message = 'Please enter a valid email address'): ValidationRule<string> => ({
    name: 'email',
    validate: (value) => {
      if (!value) return true; // Allow empty if not required
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value);
    },
    message
  }),

  minLength: (min: number, message?: string): ValidationRule<string> => ({
    name: 'minLength',
    validate: (value) => !value || value.length >= min,
    message: message || `Must be at least ${min} characters long`
  }),

  maxLength: (max: number, message?: string): ValidationRule<string> => ({
    name: 'maxLength',
    validate: (value) => !value || value.length <= max,
    message: message || `Must be no more than ${max} characters long`
  }),

  pattern: (regex: RegExp, message: string): ValidationRule<string> => ({
    name: 'pattern',
    validate: (value) => !value || regex.test(value),
    message
  }),

  numeric: (message = 'Must be a valid number'): ValidationRule<string | number> => ({
    name: 'numeric',
    validate: (value) => {
      if (value === null || value === undefined || value === '') return true;
      return !isNaN(Number(value));
    },
    message
  }),

  positiveNumber: (message = 'Must be a positive number'): ValidationRule<string | number> => ({
    name: 'positiveNumber',
    validate: (value) => {
      if (value === null || value === undefined || value === '') return true;
      const num = Number(value);
      return !isNaN(num) && num > 0;
    },
    message
  }),

  dateRange: (minDate?: Date, maxDate?: Date, message?: string): ValidationRule<string | Date> => ({
    name: 'dateRange',
    validate: (value) => {
      if (!value) return true;
      const date = value instanceof Date ? value : new Date(value);
      if (isNaN(date.getTime())) return false;
      
      if (minDate && date < minDate) return false;
      if (maxDate && date > maxDate) return false;
      return true;
    },
    message: message || 'Date is outside the allowed range'
  }),

  futureDate: (message = 'Date must be in the future'): ValidationRule<string | Date> => ({
    name: 'futureDate',
    validate: (value) => {
      if (!value) return true;
      const date = value instanceof Date ? value : new Date(value);
      return !isNaN(date.getTime()) && date > new Date();
    },
    message
  }),

  url: (message = 'Please enter a valid URL'): ValidationRule<string> => ({
    name: 'url',
    validate: (value) => {
      if (!value) return true;
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    message
  }),

  coordinates: (message = 'Please enter valid coordinates'): ValidationRule<{ lat: number; lng: number }> => ({
    name: 'coordinates',
    validate: (value) => {
      if (!value) return true;
      const { lat, lng } = value;
      return typeof lat === 'number' && typeof lng === 'number' &&
             lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
    },
    message
  }),

  passwordStrength: (message = 'Password must be at least 8 characters with uppercase, lowercase, and number'): ValidationRule<string> => ({
    name: 'passwordStrength',
    validate: (value) => {
      if (!value) return true;
      const hasUpper = /[A-Z]/.test(value);
      const hasLower = /[a-z]/.test(value);
      const hasNumber = /\d/.test(value);
      const hasMinLength = value.length >= 8;
      return hasUpper && hasLower && hasNumber && hasMinLength;
    },
    message
  })
};

export const validator = Validator.getInstance();