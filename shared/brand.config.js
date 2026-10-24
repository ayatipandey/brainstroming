// Every product and business detail lives here, so a rename or a change of
// address is a one-line edit. Values left empty are reported as missing:
// `npm run build` fails until they are filled, and dev builds show a banner.
//
// The name is a placeholder until a final name is chosen.

export const BRAND = {
  name: 'Perk Predict',
  tagline: 'Rewards that find you',
  // Business details. Do not invent these; fill them from company records.
  legalEntity: '',          // e.g. registered company name
  address: '',              // registered or mailing address
  contactEmail: '',         // monitored support / privacy inbox
  registration: '',         // company number, state of registration, or ownership note
  // Legal documents
  policyVersion: '2026-10-draft-1',
  policyEffectiveDate: '',  // set when legal review signs off
};

export const REQUIRED_BUSINESS_FIELDS = ['legalEntity', 'address', 'contactEmail', 'registration', 'policyEffectiveDate'];

export function missingBusinessFields(b = BRAND) {
  return REQUIRED_BUSINESS_FIELDS.filter((k) => !String(b[k] || '').trim());
}
