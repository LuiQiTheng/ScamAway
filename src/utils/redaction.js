export function redactSensitiveInformation(value = '') {
  if (!value) return '';

  return value
    .replace(/\b\d{6}[-\s]?\d{2}[-\s]?\d{4}\b/g, '[REDACTED IC/NRIC]')

    .replace(/(?:\+?60|0)[\s-]?1[0-9](?:[\s-]?[0-9]){7,8}\b/g, '[REDACTED PHONE]')

    .replace(/\b(?:\d[\s-]?){8,16}\b/g, '[REDACTED BANK ACCOUNT]')

    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED EMAIL]');
}