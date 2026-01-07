export function isUnexpectedError(status: number): boolean {
  return status >= 500;
}
