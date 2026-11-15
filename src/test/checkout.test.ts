import { describe, expect, it } from 'vitest';
import { canPayCashOnDelivery, COD_LIMIT, formatCardNumber, isValidCardExpiry, isValidCardNumber, isValidEmail, isValidPhone } from '@/lib/checkout';

describe('checkout rules', () => {
  it('allows cash on delivery only under Rs. 25,000', () => {
    expect(canPayCashOnDelivery(24999)).toBe(true);
    expect(canPayCashOnDelivery(COD_LIMIT)).toBe(false);
    expect(canPayCashOnDelivery(30000)).toBe(false);
  });

  it('formats and checks card numbers without storing them', () => {
    expect(formatCardNumber('4111111111111111')).toBe('4111 1111 1111 1111');
    expect(isValidCardNumber('4111 1111 1111 1111')).toBe(true);
    expect(isValidCardNumber('123')).toBe(false);
  });

  it('checks email, phone and expiry', () => {
    expect(isValidEmail('buyer@gameplay.local')).toBe(true);
    expect(isValidPhone('03235551600')).toBe(true);
    expect(isValidCardExpiry('12/99')).toBe(true);
    expect(isValidCardExpiry('13/99')).toBe(false);
  });
});
