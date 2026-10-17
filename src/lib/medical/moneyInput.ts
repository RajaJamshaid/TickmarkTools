/** Formats integer cents as a plain decimal string for form inputs and CSV, e.g. 12345 -> "123.45". */
export function centsToInput(cents: number): string {
  const abs = Math.abs(cents)
  return `${cents < 0 ? '-' : ''}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, '0')}`
}
