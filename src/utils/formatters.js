/**
 * Formats a numeric string or number with commas based on the currency.
 * Support Indian Numbering System (en-IN) for INR and International for others.
 */
export const formatBudget = (value, currencyCode = "INR") => {
  if (value === undefined || value === null || value === "") return "";
  
  // Remove all non-numeric characters
  const numericValue = value.toString().replace(/\D/g, "");
  if (numericValue === "") return "";

  const number = parseInt(numericValue, 10);
  
  // Indian formatting for INR, International for others
  const locale = currencyCode === "INR" ? "en-IN" : "en-US";
  
  return new Intl.NumberFormat(locale).format(number);
};

/**
 * Returns the raw numeric string without commas.
 */
export const parseBudget = (formattedValue) => {
  if (!formattedValue) return "";
  return formattedValue.toString().replace(/\D/g, "");
};
