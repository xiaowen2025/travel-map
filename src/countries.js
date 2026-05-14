import countriesData from '../public/data/countries.json';

export const countries = countriesData.countries;
export const fullNames = countriesData.fullNames;

export function getCountryName(code, locale = 'zh') {
  return countries[code]?.[locale] || countries[code]?.en || code;
}

export function getCountryByFullName(fullName, locale = 'zh') {
  const code = fullNames[fullName];
  if (!code) return fullName;
  return getCountryName(code, locale);
}

export function getCountryCode(fullName) {
  return fullNames[fullName] || null;
}

export function getCountry(point, locale = 'zh') {
  let code = point.country;
  if (!code) return '';
  // If code is a full name (e.g. "Croatia"), convert to code (e.g. "HR")
  if (!countries[code] && fullNames[code]) {
    code = fullNames[code];
  }
  return getCountryName(code, locale);
}
