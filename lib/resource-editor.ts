export function priceToMinor(value: string) {
  if (!/^\d{1,8}(?:\.\d{1,2})?$/.test(value)) throw new Error('Enter an amount with up to two decimal places.');
  const [whole, fraction = ''] = value.split('.');
  const minor = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  if (minor < 1 || minor > 2147483647) throw new Error('Enter a positive price within the supported range.');
  return minor;
}
export function moveItem<T>(items: T[], index: number, offset: number): T[] {
  const next = index + offset;
  if (index < 0 || index >= items.length || next < 0 || next >= items.length) return items;
  const result = [...items]; [result[index], result[next]] = [result[next], result[index]];
  return result;
}
