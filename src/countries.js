import countriesData from '../public/data/countries.json';

export const countries = countriesData.countries;

export function getCountryName(code, locale = 'zh') {
  return countries[code]?.[locale] || countries[code]?.en || code;
}

export function getCountry(point, locale = 'zh') {
  const code = point.country;
  if (!code) return '';
  return getCountryName(code, locale);
}
