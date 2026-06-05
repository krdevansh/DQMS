import { Request, Response, NextFunction } from 'express';

type ValidationRule = {
  field: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required?: boolean;
  min?: number;
  max?: number;
  regex?: RegExp;
  message?: string;
};

export function validate(rules: ValidationRule[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: string[] = [];

    for (const rule of rules) {
      const value = req.body[rule.field];

      if (rule.required && (value === undefined || value === null || value === '')) {
        errors.push(rule.message || `${rule.field} is required`);
        continue;
      }

      if (value === undefined || value === null) continue;

      if (rule.type === 'string' && typeof value !== 'string') {
        errors.push(`${rule.field} must be a string`);
        continue;
      }

      if (rule.type === 'number' && (typeof value !== 'number' || isNaN(value))) {
        errors.push(`${rule.field} must be a number`);
        continue;
      }

      if (rule.type === 'array' && !Array.isArray(value)) {
        errors.push(`${rule.field} must be an array`);
        continue;
      }

      if (typeof value === 'string') {
        if (rule.min !== undefined && value.length < rule.min) {
          errors.push(`${rule.field} must be at least ${rule.min} characters`);
        }
        if (rule.max !== undefined && value.length > rule.max) {
          errors.push(`${rule.field} must be at most ${rule.max} characters`);
        }
        if (rule.regex && !rule.regex.test(value)) {
          errors.push(rule.message || `${rule.field} format is invalid`);
        }
      }

      if (typeof value === 'number') {
        if (rule.min !== undefined && value < rule.min) {
          errors.push(`${rule.field} must be at least ${rule.min}`);
        }
        if (rule.max !== undefined && value > rule.max) {
          errors.push(`${rule.field} must be at most ${rule.max}`);
        }
      }
    }

    if (errors.length > 0) {
      res.status(400).json({ error: 'Validation failed', details: errors });
      return;
    }

    next();
  };
}

// Common validation rules
export const phoneRule: ValidationRule = { field: 'phone', type: 'string', required: true, min: 10, max: 10, regex: /^\d{10}$/, message: 'Phone must be 10 digits' };
export const pinRule: ValidationRule = { field: 'pin', type: 'string', required: true, min: 5, max: 5, message: 'PIN must be exactly 5 characters' };
export const nameRule: ValidationRule = { field: 'name', type: 'string', required: true, min: 2, max: 100 };
export const emailRule: ValidationRule = { field: 'email', type: 'string', regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email format' };
