/**
 * Robustly extracts country code and clean phone number from stored data.
 * Handles cases where phone might or might not have + prefix, 
 * and fallback to matching by country name.
 * 
 * @param {string} rawPhone - The phone number from DB (e.g. "+919876543210" or "919876543210")
 * @param {string} rawCountry - The country from DB (e.g. "India" or "+91")
 * @param {Array} countries - The list of country objects { name, code }
 * @returns {Object} { phone, countryCode, countryName }
 */
export const extractCountryAndPhone = (rawPhone = "", rawCountry = "", countries = []) => {
  let phone = (rawPhone || "").trim();
  let country = (rawCountry || "").trim();
  
  let detectedCountryCode = "";
  let detectedCountryName = "";
  let cleanPhone = phone;

  // 1. Try to match by the explicit country field FIRST (most reliable)
  if (country) {
    // Handle combined format: "India (+91)" or "United States (+1)"
    const combinedMatch = country.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
    let parsedName = "";
    let parsedCode = "";
    if (combinedMatch) {
      parsedName = combinedMatch[1].trim();
      parsedCode = combinedMatch[2].trim();
    }

    if (parsedName && parsedCode) {
      // Try to match by parsed name first
      const matchByParsed = countries.find(c =>
        c.name.toLowerCase() === parsedName.toLowerCase() ||
        c.code === parsedCode ||
        c.code === `+${parsedCode}` ||
        c.code.replace("+", "") === parsedCode.replace("+", "")
      );
      if (matchByParsed) {
        detectedCountryCode = matchByParsed.code;
        detectedCountryName = matchByParsed.name;
      } else {
        // Use parsed values directly as fallback
        detectedCountryCode = parsedCode.startsWith("+") ? parsedCode : `+${parsedCode}`;
        detectedCountryName = parsedName;
      }
    } else {
      // Check if country is a code (e.g., "+91", "91")
      const matchByCode = countries.find(c => 
        c.code === country || 
        c.code === `+${country}` || 
        c.code.replace("+", "") === country
      );
      
      if (matchByCode) {
        detectedCountryCode = matchByCode.code;
        detectedCountryName = matchByCode.name;
      } else {
        // Check if country is a name (e.g., "India")
        const matchByName = countries.find(c => 
          c.name.toLowerCase() === country.toLowerCase()
        );
        if (matchByName) {
          detectedCountryCode = matchByName.code;
          detectedCountryName = matchByName.name;
        }
      }
    }
  }

  // 2. Try to match by phone number prefix if country wasn't found or was ambiguous
  if (!detectedCountryCode && phone) {
    const sortedCountries = [...countries].sort((a, b) => b.code.length - a.code.length);
    
    // Check with + prefix first
    let match = sortedCountries.find(c => phone.startsWith(c.code));
    
    // If not found and phone doesn't start with +, try prepending + for matching
    if (!match && !phone.startsWith("+")) {
      match = sortedCountries.find(c => `+${phone}`.startsWith(c.code));
    }

    if (match) {
      detectedCountryCode = match.code;
      detectedCountryName = match.name;
    }
  }

  // 3. Clean up the phone number (remove the detected country code from the start)
  if (detectedCountryCode) {
    const code = detectedCountryCode; // e.g., "+91"
    const plainCode = code.replace("+", ""); // e.g., "91"
    
    let phoneWithoutCode = cleanPhone;
    
    if (cleanPhone.startsWith(code)) {
      phoneWithoutCode = cleanPhone.substring(code.length);
    } else if (cleanPhone.startsWith(plainCode)) {
      phoneWithoutCode = cleanPhone.substring(plainCode.length);
    } else if (cleanPhone.startsWith("+") && cleanPhone.replace("+", "").startsWith(plainCode)) {
       // already handled by startsWith(code) but being safe
       phoneWithoutCode = cleanPhone.substring(code.length);
    }

    cleanPhone = phoneWithoutCode.trim();
    // Handle potential separator like space or hyphen
    if (cleanPhone.startsWith("-") || cleanPhone.startsWith(" ")) {
      cleanPhone = cleanPhone.substring(1).trim();
    }
  }

  return {
    phone: cleanPhone,
    countryCode: detectedCountryCode,
    countryName: detectedCountryName || country
  };
};
