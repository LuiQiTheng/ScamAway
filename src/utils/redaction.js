export function redactSensitiveInformation(value = '') {
  return value
    .replace(/(\+?6?01[0-9]-?[0-9]{7,8}|\+?6?0[3-9]-?[0-9]{7})/g, '[REDACTED PHONE]')
    .replace(/\b\d{10,15}\b/g, '[REDACTED BANK ACCOUNT]');
}
