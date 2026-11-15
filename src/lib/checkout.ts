export const COD_LIMIT = 25000;

export type CheckoutPayment = 'card' | 'cod';

export function canPayCashOnDelivery(total: number) {
  return total > 0 && total < COD_LIMIT;
}

export function formatCardNumber(value: string) {
  return value.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ');
}

export function formatCardExpiry(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length < 3) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function isValidPhone(value: string) {
  const digits = value.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15;
}

export function isValidCardNumber(value: string) {
  const digits = value.replace(/\D/g, '');
  return digits.length >= 13 && digits.length <= 16;
}

export function isValidCardExpiry(value: string) {
  const match = value.trim().match(/^(0[1-9]|1[0-2])\/(\d{2})$/);
  if (!match) return false;
  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  const end = new Date(year, month, 0, 23, 59, 59);
  return end.getTime() >= Date.now();
}

export function isValidCardCvv(value: string) {
  return /^\d{3,4}$/.test(value.trim());
}
