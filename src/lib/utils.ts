/**
 * 시즌명/설명 텍스트에서 프로그램명을 제거하여 짧게 표시
 */
export function sanitizeLabel(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .replace(/골\s*때리는\s*그녀들\s*/g, '')
    .replace(/^\s+/, '')
    .trim();
}
