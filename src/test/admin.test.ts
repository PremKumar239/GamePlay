import { describe, expect, it } from 'vitest';
import { salesSummary, taxSummary, type AdminOrder, type AdminProduct } from '@/lib/admin';

const pad: AdminProduct = {
  id: 1, name: 'Pad', category: 'Controllers', group_name: 'PlayStation', subcategory: 'Controllers',
  image_key: 'remote', image_url: null, price: 100, old_price: null, badge: null, description: '', stock: 2,
};

function order(partial: Partial<AdminOrder> & Pick<AdminOrder, 'id' | 'status' | 'payment_status' | 'total'>): AdminOrder {
  return {
    order_number: `GP-${partial.id}`,
    customer_name: 'A',
    customer_phone: '0300',
    customer_email: null,
    customer_address: null,
    notes: null,
    payment_method: 'whatsapp',
    created_at: '2026-10-18T00:00:00Z',
    items: [],
    ...partial,
  };
}

describe('admin sales', () => {
  it('totals paid orders and flags low stock', () => {
    const summary = salesSummary([
      order({ id: 1, status: 'confirmed', payment_status: 'paid', total: 200, items: [{ id: 1, order_id: 1, product_id: 1, product_name: 'Pad', quantity: 2, unit_price: 100, line_total: 200 }] }),
      order({ id: 2, status: 'pending', payment_status: 'unpaid', total: 100 }),
      order({ id: 3, status: 'cancelled', payment_status: 'paid', total: 50 }),
    ], [pad], 5);

    expect(summary.orders).toBe(3);
    expect(summary.sales).toBe(1);
    expect(summary.revenue).toBe(200);
    expect(summary.pending).toBe(1);
    expect(summary.lowStock.map(product => product.name)).toEqual(['Pad']);
    expect(summary.bestsellers[0]?.quantity).toBe(2);
  });
});

describe('admin tax', () => {
  it('applies card and COD percentages without changing order totals', () => {
    const summary = taxSummary([
      order({ id: 1, status: 'confirmed', payment_status: 'paid', payment_method: 'card', total: 10000 }),
      order({ id: 2, status: 'pending', payment_status: 'unpaid', payment_method: 'whatsapp', total: 5000 }),
      order({ id: 3, status: 'cancelled', payment_status: 'paid', payment_method: 'cod', total: 8000 }),
    ], { card_tax_percent: 5, cod_tax_percent: 2 });

    expect(summary.rows).toHaveLength(2);
    expect(summary.rows[0]?.taxAmount).toBe(500);
    expect(summary.rows[1]?.taxAmount).toBe(100);
    expect(summary.cardTax).toBe(500);
    expect(summary.codTax).toBe(100);
    expect(summary.totalTax).toBe(600);
  });
});
