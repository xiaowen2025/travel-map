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
  const code = point.country;
  if (!code) return '';
  return getCountryName(code, locale);
}
