import type { ValidationError } from '@/types';

export interface ValidationRule<T = unknown> {
  validate: (value: T, context?: Record<string, unknown>) => boolean;
  message: string;
}

export class Validator<T = unknown> {
  private rules: ValidationRule<T>[] = [];
  private fieldName: string;

  constructor(fieldName: string) {
    this.fieldName = fieldName;
  }

  addRule(rule: ValidationRule<T>): this {
    this.rules.push(rule);
    return this;
  }

  required(message?: string): this {
    return this.addRule({
      validate: (value) => {
        if (typeof value === 'string') {
          return value.trim().length > 0;
        }
        return value !== null && value !== undefined;
      },
      message: message || `${this.fieldName} wajib diisi`,
    });
  }

  email(message?: string): this {
    return this.addRule({
      validate: (value) => {
        if (typeof value !== 'string') return false;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value);
      },
      message: message || 'Format email tidak valid',
    });
  }

  min(length: number, message?: string): this {
    return this.addRule({
      validate: (value) => {
        if (typeof value === 'string') {
          return value.length >= length;
        }
        if (typeof value === 'number') {
          return value >= length;
        }
        return false;
      },
      message: message || `${this.fieldName} minimal ${length} karakter`,
    });
  }

  max(length: number, message?: string): this {
    return this.addRule({
      validate: (value) => {
        if (typeof value === 'string') {
          return value.length <= length;
        }
        if (typeof value === 'number') {
          return value <= length;
        }
        return false;
      },
      message: message || `${this.fieldName} maksimal ${length} karakter`,
    });
  }

  oneOf(values: T[], message?: string): this {
    return this.addRule({
      validate: (value) => values.includes(value),
      message: message || `${this.fieldName} tidak valid`,
    });
  }

  pattern(regex: RegExp, message?: string): this {
    return this.addRule({
      validate: (value) => {
        if (typeof value !== 'string') return false;
        return regex.test(value);
      },
      message: message || `${this.fieldName} tidak valid`,
    });
  }

  custom(validate: (value: T) => boolean, message: string): this {
    return this.addRule({ validate, message });
  }

  validate(value: T, context?: Record<string, unknown>): ValidationError[] {
    const errors: ValidationError[] = [];

    for (const rule of this.rules) {
      if (!rule.validate(value, context)) {
        errors.push({
          field: this.fieldName,
          message: rule.message,
        });
      }
    }

    return errors;
  }
}

export class FormValidator {
  private validators: Map<string, Validator<unknown>> = new Map();

  field<T = unknown>(fieldName: string): Validator<T> {
    const validator = new Validator<T>(fieldName);
    this.validators.set(fieldName, validator as Validator<unknown>);
    return validator;
  }

  validate(data: Record<string, unknown>): ValidationError[] {
    const errors: ValidationError[] = [];

    this.validators.forEach((validator, fieldName) => {
      const value = data[fieldName];
      const fieldErrors = validator.validate(value, data);
      errors.push(...fieldErrors);
    });

    return errors;
  }

  validateField(fieldName: string, value: unknown, context?: Record<string, unknown>): ValidationError[] {
    const validator = this.validators.get(fieldName);
    if (!validator) {
      return [];
    }
    return validator.validate(value, context);
  }

  isValid(data: Record<string, unknown>): boolean {
    return this.validate(data).length === 0;
  }

  clear(): void {
    this.validators.clear();
  }
}

export function validateRequired(value: unknown, fieldName: string): ValidationError | null {
  if (typeof value === 'string') {
    return value.trim().length > 0 ? null : { field: fieldName, message: `${fieldName} wajib diisi` };
  }
  return value !== null && value !== undefined ? null : { field: fieldName, message: `${fieldName} wajib diisi` };
}

export function validateEmail(value: string, fieldName: string = 'Email'): ValidationError | null {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value) ? null : { field: fieldName, message: 'Format email tidak valid' };
}

export function validateMin(value: string | number, min: number, fieldName: string): ValidationError | null {
  if (typeof value === 'string') {
    return value.length >= min ? null : { field: fieldName, message: `${fieldName} minimal ${min} karakter` };
  }
  if (typeof value === 'number') {
    return value >= min ? null : { field: fieldName, message: `${fieldName} minimal ${min}` };
  }
  return { field: fieldName, message: `${fieldName} tidak valid` };
}

export function validateMax(value: string | number, max: number, fieldName: string): ValidationError | null {
  if (typeof value === 'string') {
    return value.length <= max ? null : { field: fieldName, message: `${fieldName} maksimal ${max} karakter` };
  }
  if (typeof value === 'number') {
    return value <= max ? null : { field: fieldName, message: `${fieldName} maksimal ${max}` };
  }
  return { field: fieldName, message: `${fieldName} tidak valid` };
}

export function validateFileSize(file: File, maxSize: number, fieldName: string = 'File'): ValidationError | null {
  const maxSizeMB = maxSize / (1024 * 1024);
  return file.size <= maxSize
    ? null
    : { field: fieldName, message: `Ukuran ${fieldName.toLowerCase()} tidak boleh lebih dari ${maxSizeMB}MB` };
}

export function validateFileType(
  file: File,
  allowedTypes: string[],
  fieldName: string = 'File'
): ValidationError | null {
  const fileExt = file.name.split('.').pop()?.toLowerCase();
  return fileExt && allowedTypes.includes(fileExt)
    ? null
    : { field: fieldName, message: `Format ${fieldName.toLowerCase()} harus ${allowedTypes.join(', ')}` };
}

export function combineValidationErrors(...errors: (ValidationError | null)[]): ValidationError[] {
  return errors.filter((error): error is ValidationError => error !== null);
}

export function groupValidationErrors(errors: ValidationError[]): Record<string, string[]> {
  const grouped: Record<string, string[]> = {};
  errors.forEach((error) => {
    if (!grouped[error.field]) {
      grouped[error.field] = [];
    }
    grouped[error.field].push(error.message);
  });
  return grouped;
}

export function getFirstError(errors: ValidationError[]): string | null {
  return errors.length > 0 ? errors[0].message : null;
}

export function hasFieldError(errors: ValidationError[], fieldName: string): boolean {
  return errors.some((error) => error.field === fieldName);
}

export function getFieldErrors(errors: ValidationError[], fieldName: string): string[] {
  return errors
    .filter((error) => error.field === fieldName)
    .map((error) => error.message);
}
