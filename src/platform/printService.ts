/**
 * Triggers the native browser/system print dialog (window.print).
 * Note: This delegates output to the system print manager and does not generate a RePage PDF file.
 */
export function triggerNativePrintDialog(): boolean {
  if (typeof window !== 'undefined' && typeof window.print === 'function') {
    window.print();
    return true;
  }
  return false;
}
