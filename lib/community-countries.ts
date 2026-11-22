export const COMMUNITY_COUNTRIES = [
  'Ghana', 'Nigeria', 'Kenya', 'South Africa', 'Uganda', 'Tanzania', 'Rwanda', 'Cameroon', 'Côte d’Ivoire', 'Senegal', 'Ethiopia', 'Egypt', 'Morocco', 'Botswana', 'Zambia', 'Zimbabwe', 'Liberia', 'Sierra Leone', 'The Gambia', 'Burkina Faso', 'Benin', 'Togo', 'Gabon', 'Namibia', 'Malawi', 'Mozambique', 'Democratic Republic of the Congo', 'Republic of the Congo', 'Somalia', 'Sudan', 'South Sudan', 'Algeria', 'Tunisia', 'Angola', 'Mauritius', 'Madagascar', 'Cabo Verde', 'Seychelles', 'United States', 'United Kingdom', 'Canada', 'India', 'Australia', 'Germany', 'France', 'Netherlands', 'Ireland', 'Italy', 'Spain', 'Brazil', 'Japan', 'China', 'United Arab Emirates', 'Saudi Arabia', 'New Zealand', 'Other',
] as const;

export function isCommunityCountry(value: string): boolean {
  return (COMMUNITY_COUNTRIES as readonly string[]).includes(value);
}
