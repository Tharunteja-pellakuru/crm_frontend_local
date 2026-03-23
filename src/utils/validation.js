import { toast } from "react-hot-toast";

/**
 * Validates form data against a schema and shows toast errors.
 * @param {Object} data - The form data object.
 * @param {Object} schema - Validation rules.
 * @returns {boolean} - true if valid, false if invalid.
 */
export const validateForm = (data, schema) => {
  for (const field in schema) {
    const rules = schema[field];
    const value = data[field];
    const label = rules.label || field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());

    if (rules.required && (value === undefined || value === null || value === "")) {
      toast.error(`${label} is required.`);
      return false;
    }

    if (value !== undefined && value !== null && value !== "") {
      if (rules.minLength && value.length < rules.minLength) {
        toast.error(`${label} must be at least ${rules.minLength} characters.`);
        return false;
      }

      if (rules.pattern && !rules.pattern.test(value)) {
        toast.error(`Invalid ${label} format.`);
        return false;
      }

      if (rules.type === "number" && isNaN(Number(value))) {
        toast.error(`${label} must be a number.`);
        return false;
      }

      if (rules.min !== undefined && Number(value) < rules.min) {
        toast.error(`${label} must be at least ${rules.min}.`);
        return false;
      }
    }
  }
  return true;
};
