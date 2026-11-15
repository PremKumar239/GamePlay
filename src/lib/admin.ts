import { apiRequest } from '@/lib/http';

export const orderStatuses = ['pending', 'confirmed', 'shipped', 'completed', 'cancelled'] as const;
export const paymentStatuses = ['unpaid', 'paid', 'refunded'] as const;
export type OrderStatus = (typeof orderStatuses)[number];
export type PaymentStatus = (typeof paymentStatuses)[number];

export type AdminProduct = {
  id: number;
  name: string;
  category: string;
  group_name: string | null;
  subcategory: string | null;
  image_key: string;
  image_url: string | null;
  price: number;
  old_price: number | null;
  badge: string | null;
  description: string;
  stock: number;
};

export type AdminCategory = {
  id: number;
  name: string;
  label: string;
  sort_order: number;
  subcategories: AdminSubcategory[];
};

export type AdminSubcategory = {
  id: number;
  category_id: number;
  name: string;
  sort_order: number;
};

export type AdminOrderItem = {
  id: number;
  order_id: number;
  product_id: number | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
};

export type AdminOrder = {
  id: number;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  customer_address: string | null;
  notes: string | null;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: string;
  total: number;
  created_at: string;
  items: AdminOrderItem[];
};

export type StoreSettings = {
  id: number;
  store_name: string;
  phone: string;
  whatsapp_number: string;
  address: string;
  closing_time: string;
  low_stock_threshold: number;
};

export const messageStatuses = ['new', 'read', 'replied', 'archived'] as const;
export type MessageStatus = (typeof messageStatuses)[number];

export type AdminContactMessage = {
  id: number;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  message: string;
  status: MessageStatus;
  created_at: string;
};

export type ProductInput = {
  name: string;
  group_name: string;
  subcategory: string;
  price: number;
  old_price: number | null;
  stock: number;
  description: string;
  badge: string | null;
  image_url: string | null;
  image_key: string;
};

export function messageOf(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong';
}

export async function fetchProducts() {
  const result = await apiRequest<{ products: AdminProduct[] }>('/api/admin/products');
  return result.products;
}

export async function saveProduct(id: number | undefined, input: ProductInput) {
  if (id) {
    await apiRequest(`/api/admin/products/${id}`, { method: 'PUT', body: JSON.stringify(input) });
    return;
  }
  await apiRequest('/api/admin/products', { method: 'POST', body: JSON.stringify(input) });
}

export async function deleteProduct(product: AdminProduct) {
  await apiRequest(`/api/admin/products/${product.id}`, { method: 'DELETE' });
}

export async function updateStock(id: number, stock: number) {
  await apiRequest(`/api/admin/products/${id}/stock`, { method: 'PATCH', body: JSON.stringify({ stock }) });
}

export async function uploadProductImage(file: File) {
  const body = new FormData();
  body.append('file', file);
  const result = await apiRequest<{ url: string }>('/api/admin/uploads', { method: 'POST', body });
  return result.url;
}

export async function fetchCategories() {
  const result = await apiRequest<{ categories: AdminCategory[] }>('/api/admin/categories');
  return result.categories;
}

export async function saveCategory(id: number | undefined, name: string, label: string, sortOrder: number) {
  const payload = { name, label, sort_order: sortOrder };
  if (id) {
    await apiRequest(`/api/admin/categories/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
    return;
  }
  await apiRequest('/api/admin/categories', { method: 'POST', body: JSON.stringify(payload) });
}

export async function deleteCategory(id: number) {
  await apiRequest(`/api/admin/categories/${id}`, { method: 'DELETE' });
}

export async function saveSubcategory(categoryId: number, name: string, sortOrder: number) {
  await apiRequest('/api/admin/subcategories', { method: 'POST', body: JSON.stringify({ category_id: categoryId, name, sort_order: sortOrder }) });
}

export async function deleteSubcategory(id: number) {
  await apiRequest(`/api/admin/subcategories/${id}`, { method: 'DELETE' });
}

export async function fetchOrders() {
  const result = await apiRequest<{ orders: AdminOrder[] }>('/api/admin/orders');
  return result.orders;
}

export async function updateOrder(id: number, status: OrderStatus, paymentStatus: PaymentStatus) {
  await apiRequest(`/api/admin/orders/${id}`, { method: 'PATCH', body: JSON.stringify({ status, payment_status: paymentStatus }) });
}

export async function fetchContactMessages() {
  const result = await apiRequest<{ messages: AdminContactMessage[] }>('/api/admin/messages');
  return result.messages;
}

export async function updateContactMessage(id: number, status: MessageStatus) {
  await apiRequest(`/api/admin/messages/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
}

export async function fetchSettings() {
  const result = await apiRequest<{ settings: StoreSettings }>('/api/admin/settings');
  return result.settings;
}

export async function saveSettings(input: Omit<StoreSettings, 'id'>) {
  await apiRequest('/api/admin/settings', { method: 'PUT', body: JSON.stringify(input) });
}

export async function loginAdmin(email: string, password: string) {
  const result = await apiRequest<{ email: string }>('/api/admin/login', { method: 'POST', body: JSON.stringify({ email, password }) });
  return result.email;
}

export async function logoutAdmin() {
  await apiRequest('/api/admin/logout', { method: 'POST' });
}

export async function fetchAdminSession() {
  const result = await apiRequest<{ email: string }>('/api/admin/me');
  return result.email;
}

export type TaxSettings = {
  id: number;
  card_tax_percent: number;
  cod_tax_percent: number;
};

export type TaxPaymentKind = 'card' | 'cod' | 'other';

export const taxPaymentMethods = ['card', 'cod'] as const;
export type TaxPaymentMethod = (typeof taxPaymentMethods)[number];

export async function fetchTaxSettings() {
  const result = await apiRequest<{ settings: TaxSettings }>('/api/admin/tax');
  return result.settings;
}

export async function saveTaxSettings(input: Pick<TaxSettings, 'card_tax_percent' | 'cod_tax_percent'>) {
  await apiRequest('/api/admin/tax', { method: 'PUT', body: JSON.stringify(input) });
}

export async function updateOrderPaymentMethod(id: number, paymentMethod: TaxPaymentMethod) {
  await apiRequest(`/api/admin/orders/${id}`, { method: 'PATCH', body: JSON.stringify({ payment_method: paymentMethod }) });
}

/** Admin Tax section only — maps stored payment_method to card / COD rates. WhatsApp enquiries count as COD. */
export function taxPaymentKind(method: string): TaxPaymentKind {
  const value = method.trim().toLowerCase();
  if (value === 'card' || value === 'card payment' || value === 'card_payment') return 'card';
  if (
    value === 'cod'
    || value === 'cash'
    || value === 'cash on delivery'
    || value === 'cash_on_delivery'
    || value === 'whatsapp'
  ) return 'cod';
  return 'other';
}

export function taxPercentFor(kind: TaxPaymentKind, settings: Pick<TaxSettings, 'card_tax_percent' | 'cod_tax_percent'>) {
  if (kind === 'card') return settings.card_tax_percent;
  if (kind === 'cod') return settings.cod_tax_percent;
  return 0;
}

export function taxAmountFor(orderTotal: number, percent: number) {
  return Math.round((orderTotal * percent) / 100);
}

export function taxSummary(orders: AdminOrder[], settings: Pick<TaxSettings, 'card_tax_percent' | 'cod_tax_percent'>) {
  const rows = orders
    .filter(order => order.status !== 'cancelled')
    .map(order => {
      const kind = taxPaymentKind(order.payment_method);
      const percent = taxPercentFor(kind, settings);
      const tax = taxAmountFor(order.total, percent);
      return {
        orderId: order.id,
        orderNumber: order.order_number,
        paymentMethod: order.payment_method,
        kind,
        orderAmount: order.total,
        taxPercent: percent,
        taxAmount: tax,
        createdAt: order.created_at,
      };
    });
  const cardTax = rows.filter(row => row.kind === 'card').reduce((sum, row) => sum + row.taxAmount, 0);
  const codTax = rows.filter(row => row.kind === 'cod').reduce((sum, row) => sum + row.taxAmount, 0);
  return {
    rows,
    cardTax,
    codTax,
    totalTax: cardTax + codTax,
  };
}

export function isPaidSale(order: AdminOrder) {
  return order.payment_status === 'paid' && order.status !== 'cancelled';
}

export function salesSummary(orders: AdminOrder[], products: AdminProduct[], threshold: number) {
  const paid = orders.filter(isPaidSale);
  const revenue = paid.reduce((sum, order) => sum + order.total, 0);
  const sellers = new Map<string, { name: string; quantity: number; revenue: number }>();
  for (const order of paid) {
    for (const item of order.items) {
      const current = sellers.get(item.product_name) ?? { name: item.product_name, quantity: 0, revenue: 0 };
      current.quantity += item.quantity;
      current.revenue += item.line_total;
      sellers.set(item.product_name, current);
    }
  }
  return {
    orders: orders.length,
    sales: paid.length,
    revenue,
    pending: orders.filter(order => order.status === 'pending').length,
    lowStock: products.filter(product => product.stock <= threshold).sort((a, b) => a.stock - b.stock),
    bestsellers: [...sellers.values()].sort((a, b) => b.quantity - a.quantity || b.revenue - a.revenue),
    history: [...paid].sort((a, b) => b.created_at.localeCompare(a.created_at)),
  };
}
