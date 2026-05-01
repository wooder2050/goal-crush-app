/**
 * API 텍스트에서 제3자 콘텐츠 참조를 제거하여 중립적으로 표시
 */
export function sanitizeLabel(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .replace(/골\s*때리는\s*그녀들\s*/g, '')
    .replace(/골때녀\s*/g, '')
    .replace(/SBS\s*컵/g, '컵 대회')
    .replace(/SBS\s*/gi, '')
    .replace(/^\s+/, '')
    .trim();
}
