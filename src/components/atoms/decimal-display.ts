/** Truncate decimal text without converting through a JavaScript number. */
export function truncateDecimalDisplay(value: string): string {
  return value.replace(/(\.\d{2})\d+$/, "$1");
}
