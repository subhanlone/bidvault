import type { CategoryAttributes } from '../types';

export interface CategoryFieldConfig {
  key: string;
  label: string;
  required: boolean;
  type: 'text' | 'number' | 'select' | 'textarea';
  options?: string[];
  min?: number;
  max?: number;
  placeholder?: string;
}

const currentYear = new Date().getFullYear();

export const CATEGORY_FIELDS: Record<string, CategoryFieldConfig[]> = {
  'Electronics & Gadgets': [
    { key: 'brand', label: 'Brand', required: true, type: 'text', max: 100 },
    { key: 'model', label: 'Model', required: true, type: 'text', max: 100 },
    { key: 'specifications', label: 'Specifications', required: false, type: 'textarea', max: 1000 },
  ],
  'Vehicles': [
    { key: 'make', label: 'Make', required: true, type: 'text', max: 100 },
    { key: 'model', label: 'Model', required: true, type: 'text', max: 100 },
    { key: 'year', label: 'Year', required: true, type: 'number', min: 1980, max: currentYear },
    { key: 'mileage', label: 'Mileage (km)', required: true, type: 'number', min: 0, max: 2_000_000 },
  ],
  'Clothing & Fashion': [
    { key: 'size', label: 'Size', required: true, type: 'select', options: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'One Size'] },
    { key: 'color', label: 'Color', required: true, type: 'text', max: 50 },
    { key: 'brand', label: 'Brand', required: false, type: 'text', max: 100 },
  ],
  'Books & Education': [
    { key: 'author', label: 'Author', required: true, type: 'text', max: 150 },
    { key: 'format', label: 'Format', required: true, type: 'select', options: ['Physical', 'Digital'] },
    { key: 'publisher', label: 'Publisher', required: false, type: 'text', max: 150 },
  ],
  'Home & Furniture': [
    { key: 'material', label: 'Material', required: true, type: 'text', max: 100 },
    { key: 'dimensions', label: 'Dimensions', required: true, type: 'text', max: 100, placeholder: '120x60x75cm' },
    { key: 'roomType', label: 'Room Type', required: false, type: 'select', options: ['Living Room', 'Bedroom', 'Kitchen', 'Office', 'Other'] },
  ],
  'Sports & Fitness': [
    { key: 'sportType', label: 'Sport / Activity Type', required: true, type: 'text', max: 100 },
    { key: 'brand', label: 'Brand', required: false, type: 'text', max: 100 },
    { key: 'size', label: 'Size', required: false, type: 'text', max: 50 },
  ],
  'Art & Collectibles': [
    { key: 'creator', label: 'Creator / Artist', required: true, type: 'text', max: 150 },
    { key: 'medium', label: 'Medium', required: true, type: 'text', max: 150, placeholder: 'Oil on canvas' },
    { key: 'yearCreated', label: 'Year Created', required: false, type: 'number', min: 1000, max: currentYear },
  ],
};

export function getCategoryFields(category: string): CategoryFieldConfig[] {
  return CATEGORY_FIELDS[category] ?? [];
}

/** Validates attributes for a category; returns a map of field key -> error message for invalid/missing fields. */
export function validateCategoryFields(category: string, attributes: CategoryAttributes): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const field of getCategoryFields(category)) {
    const value = attributes[field.key];
    const isEmpty = value === undefined || value === null || value === '';

    if (field.required && isEmpty) {
      errors[field.key] = `${field.label} is required`;
      continue;
    }
    if (isEmpty) continue;

    if (field.type === 'number') {
      const num = Number(value);
      if (!Number.isInteger(num)) {
        errors[field.key] = `${field.label} must be a whole number`;
      } else if (field.min !== undefined && num < field.min) {
        errors[field.key] = `${field.label} must be at least ${field.min}`;
      } else if (field.max !== undefined && num > field.max) {
        errors[field.key] = `${field.label} must be at most ${field.max}`;
      }
    } else if (field.type === 'text' || field.type === 'textarea') {
      const str = String(value).trim();
      if (field.max !== undefined && str.length > field.max) {
        errors[field.key] = `${field.label} must be under ${field.max} characters`;
      }
    } else if (field.type === 'select' && field.options && !field.options.includes(String(value))) {
      errors[field.key] = `${field.label} is invalid`;
    }
  }
  return errors;
}
