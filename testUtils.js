
const countries = [
  { name: "India", code: "+91" },
  { name: "Uzbekistan", code: "+998" },
  { name: "United States", code: "+1" }
];

const extractCountryAndPhone = (rawPhone = "", rawCountry = "", countries = []) => {
  let phone = (rawPhone || "").trim();
  let country = (rawCountry || "").trim();
  
  let detectedCountryCode = "";
  let detectedCountryName = "";
  let cleanPhone = phone;

  if (phone) {
    const sortedCountries = [...countries].sort((a, b) => b.code.length - a.code.length);
    let match = sortedCountries.find(c => phone.startsWith(c.code));
    
    if (!match && !phone.startsWith("+")) {
      match = sortedCountries.find(c => `+${phone}`.startsWith(c.code));
    }

    if (match) {
      detectedCountryCode = match.code;
      detectedCountryName = match.name;
      
      let phoneWithoutCode = phone;
      if (phone.startsWith(match.code)) {
        phoneWithoutCode = phone.substring(match.code.length);
      } else if (`+${phone}`.startsWith(match.code)) {
        const codeWithoutPlus = match.code.substring(1);
        if (phone.startsWith(codeWithoutPlus)) {
          phoneWithoutCode = phone.substring(codeWithoutPlus.length);
        }
      }
      
      cleanPhone = phoneWithoutCode.trim();
      if (cleanPhone.startsWith("-") || cleanPhone.startsWith(" ")) {
        cleanPhone = cleanPhone.substring(1).trim();
      }
    }
  }

  if (!detectedCountryCode && country) {
    const matchByCode = countries.find(c => c.code === country || c.code === `+${country}`);
    if (matchByCode) {
      detectedCountryCode = matchByCode.code;
      detectedCountryName = matchByCode.name;
    } else {
      const matchByName = countries.find(c => c.name.toLowerCase() === country.toLowerCase());
      if (matchByName) {
        detectedCountryCode = matchByName.code;
        detectedCountryName = matchByName.name;
      }
    }
  }

  return {
    phone: cleanPhone,
    countryCode: detectedCountryCode,
    countryName: detectedCountryName || country
  };
};

console.log("Test 1 (Rahul Sharma):", extractCountryAndPhone("+91 9988776655", "India", countries));
console.log("Test 2 (Tharun Teja):", extractCountryAndPhone("89851654092", "", countries));
console.log("Test 3 (No plus match):", extractCountryAndPhone("91 9988776655", "", countries));
console.log("Test 4 (Uzbekistan collision):", extractCountryAndPhone("9988776655", "India", countries));
