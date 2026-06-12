/**
 * Converte qualquer valor de erro em string segura para exibir no JSX.
 */
export function formatError(value) {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'object' && item?.msg ? item.msg : String(item)))
      .join(' ');
  }
  if (typeof value === 'object' && value.message) return value.message;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}
