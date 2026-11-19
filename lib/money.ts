export function money(minor: number, currency = 'GHS') {
  return new Intl.NumberFormat('en-GH', {style: 'currency', currency}).format(minor / 100);
}
