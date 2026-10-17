import { supabase } from '@/lib/supabase';

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

const productColumns = 'id,name,category,group_name,subcategory,image_key,image_url,price,old_price,badge,description,stock';

export function messageOf(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong';
}

function db() {
  if (!supabase) throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  return supabase;
}

function fail(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

export async function fetchProducts() {
  const result = await db().from('products').select(productColumns).order('name');
  fail(result.error);
  return (result.data ?? []) as AdminProduct[];
}

export async function saveProduct(id: number | undefined, input: ProductInput) {
  const payload = {
    name: input.name,
    group_name: input.group_name,
    subcategory: input.subcategory || null,
    category: input.subcategory || input.group_name,
    price: input.price,
    old_price: input.old_price,
    stock: input.stock,
    description: input.description,
    badge: input.badge,
    image_url: input.image_url,
    image_key: input.image_key || 'remote',
  };
  const result = id
    ? await db().from('products').update(payload).eq('id', id)
    : await db().from('products').insert(payload);
  fail(result.error);
}

export async function deleteProduct(product: AdminProduct) {
  const path = storagePath(product.image_url);
  if (path) await db().storage.from('product-images').remove([path]);
  const result = await db().from('products').delete().eq('id', product.id);
  fail(result.error);
}

export async function updateStock(id: number, stock: number) {
  const result = await db().from('products').update({ stock }).eq('id', id);
  fail(result.error);
}

export async function uploadProductImage(file: File) {
  if (!file.type.startsWith('image/')) throw new Error('Choose an image file.');
  if (file.size > 5 * 1024 * 1024) throw new Error('Images must be 5 MB or smaller.');
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const path = `${crypto.randomUUID()}.${ext}`;
  const uploaded = await db().storage.from('product-images').upload(path, file, { cacheControl: '3600', upsert: false });
  fail(uploaded.error);
  return db().storage.from('product-images').getPublicUrl(path).data.publicUrl;
}

export async function fetchCategories() {
  const categories = await db().from('categories').select('id,name,label,sort_order').order('sort_order');
  fail(categories.error);
  const subs = await db().from('subcategories').select('id,category_id,name,sort_order').order('sort_order');
  fail(subs.error);
  return ((categories.data ?? []) as Omit<AdminCategory, 'subcategories'>[]).map(category => ({
    ...category,
    subcategories: ((subs.data ?? []) as AdminSubcategory[]).filter(sub => sub.category_id === category.id),
  }));
}

export async function saveCategory(id: number | undefined, name: string, label: string, sortOrder: number) {
  const payload = { name, label, sort_order: sortOrder };
  const result = id
    ? await db().from('categories').update(payload).eq('id', id)
    : await db().from('categories').insert(payload);
  fail(result.error);
}

export async function deleteCategory(id: number) {
  const result = await db().from('categories').delete().eq('id', id);
  fail(result.error);
}

export async function saveSubcategory(categoryId: number, name: string, sortOrder: number) {
  const result = await db().from('subcategories').insert({ category_id: categoryId, name, sort_order: sortOrder });
  fail(result.error);
}

export async function deleteSubcategory(id: number) {
  const result = await db().from('subcategories').delete().eq('id', id);
  fail(result.error);
}

export async function fetchOrders() {
  const orders = await db().from('orders').select('id,order_number,customer_name,customer_phone,customer_email,customer_address,notes,status,payment_status,payment_method,total,created_at').order('created_at', { ascending: false });
  fail(orders.error);
  const rows = (orders.data ?? []) as Omit<AdminOrder, 'items'>[];
  if (!rows.length) return [] as AdminOrder[];
  const items = await db().from('order_items').select('id,order_id,product_id,product_name,quantity,unit_price,line_total').in('order_id', rows.map(order => order.id));
  fail(items.error);
  const lines = (items.data ?? []) as AdminOrderItem[];
  return rows.map(order => ({ ...order, items: lines.filter(item => item.order_id === order.id) }));
}

export async function updateOrder(id: number, status: OrderStatus, paymentStatus: PaymentStatus) {
  const result = await db().from('orders').update({ status, payment_status: paymentStatus }).eq('id', id);
  fail(result.error);
}

export async function fetchSettings() {
  const result = await db().from('store_settings').select('id,store_name,phone,whatsapp_number,address,closing_time,low_stock_threshold').eq('id', 1).single();
  fail(result.error);
  return result.data as StoreSettings;
}

export async function saveSettings(input: Omit<StoreSettings, 'id'>) {
  const result = await db().from('store_settings').update(input).eq('id', 1);
  fail(result.error);
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

function storagePath(url: string | null) {
  if (!url) return null;
  const marker = '/product-images/';
  const index = url.indexOf(marker);
  if (index === -1) return null;
  const path = url.slice(index + marker.length).split('?')[0] ?? '';
  return decodeURIComponent(path);
}
