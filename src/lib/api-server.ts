import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import bcrypt from 'bcryptjs';
import { db, query } from '@/lib/db';
import type { AdminCategory, AdminContactMessage, AdminOrder, AdminProduct, MessageStatus, OrderStatus, PaymentStatus, ProductInput, StoreSettings, TaxPaymentMethod, TaxSettings } from '@/lib/admin';
import { getStoreReviews } from '@/lib/google-reviews';
import type { CatalogGroup, StoreFacts } from '@/lib/store';

const COOKIE = 'gp_admin';
const SESSION_HOURS = 12;

function secret() {
  return process.env.ADMIN_SESSION_SECRET || 'gameplay-dev-session-secret-change-me';
}

function json(data: unknown, status = 200, headers?: HeadersInit) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });
}

function signSession(email: string) {
  const exp = Date.now() + SESSION_HOURS * 60 * 60 * 1000;
  const payload = `${email}|${exp}`;
  const sig = createHmac('sha256', secret()).update(payload).digest('hex');
  return Buffer.from(`${payload}|${sig}`).toString('base64url');
}

function readSession(cookieHeader: string | null) {
  const raw = cookieHeader?.split(';').map(part => part.trim()).find(part => part.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
  if (!raw) return null;
  try {
    const decoded = Buffer.from(raw, 'base64url').toString();
    const [email, exp, sig] = decoded.split('|');
    if (!email || !exp || !sig) return null;
    if (Number(exp) < Date.now()) return null;
    const expected = createHmac('sha256', secret()).update(`${email}|${exp}`).digest('hex');
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    return email;
  } catch {
    return null;
  }
}

function sessionCookie(value: string, maxAge: number) {
  const parts = [`${COOKIE}=${value}`, 'Path=/', 'HttpOnly', 'SameSite=Lax', `Max-Age=${maxAge}`];
  if (process.env.NODE_ENV === 'production') parts.push('Secure');
  return parts.join('; ');
}

async function ensureAdmin() {
  const count = await query<{ count: string }>('select count(*)::text as count from admins');
  if (Number(count.rows[0]?.count ?? 0) > 0) return;
  const email = (process.env.ADMIN_EMAIL || 'admin@gameplay.local').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || 'GamePlay123!';
  const password_hash = await bcrypt.hash(password, 10);
  await query('insert into admins (email, password_hash, role) values ($1, $2, $3)', [email, password_hash, 'admin']);
}

async function requireAdmin(request: Request) {
  const email = readSession(request.headers.get('cookie'));
  if (!email) throw Object.assign(new Error('Sign in required.'), { status: 401 });
  const found = await query<{ email: string }>('select email from admins where lower(email) = lower($1)', [email]);
  if (!found.rows[0]) throw Object.assign(new Error('Sign in required.'), { status: 401 });
  return found.rows[0].email;
}

async function parseBody(request: Request) {
  const text = await request.text();
  if (!text) return {};
  return JSON.parse(text) as Record<string, unknown>;
}

function mapProduct(row: AdminProduct & { group_name: string | null }): AdminProduct {
  return {
    id: Number(row.id),
    name: row.name,
    category: row.category,
    group_name: row.group_name,
    subcategory: row.subcategory,
    image_key: row.image_key,
    image_url: row.image_url,
    price: Number(row.price),
    old_price: row.old_price == null ? null : Number(row.old_price),
    badge: row.badge,
    description: row.description ?? '',
    stock: Number(row.stock ?? 0),
  };
}

export async function handleApi(request: Request) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/$/, '') || '/';
  const method = request.method.toUpperCase();

  try {
    await ensureAdmin();

    if (path === '/api/health' && method === 'GET') {
      await query('select 1');
      return json({ ok: true, database: 'postgres' });
    }

    if (path === '/api/products' && method === 'GET') {
      const result = await query<AdminProduct>('select id,name,category,group_name,subcategory,image_key,image_url,price,old_price,badge,description,stock from products order by id');
      return json({ products: result.rows.map(mapProduct) });
    }

    if (path === '/api/catalog' && method === 'GET') {
      const categories = await query<{ id: number; name: string; label: string; sort_order: number }>('select id,name,label,sort_order from categories order by sort_order, id');
      const subs = await query<{ category_id: number; name: string; sort_order: number }>('select category_id,name,sort_order from subcategories order by sort_order, id');
      const catalog: CatalogGroup[] = categories.rows.map(row => ({
        name: row.name,
        label: row.label || '',
        subcategories: subs.rows.filter(sub => Number(sub.category_id) === Number(row.id)).map(sub => sub.name),
      }));
      return json({ catalog });
    }

    if (path === '/api/reviews' && method === 'GET') {
      const force = url.searchParams.get('refresh') === '1';
      return json(await getStoreReviews(force));
    }

    if (path === '/api/settings' && method === 'GET') {
      const result = await query('select store_name,phone,whatsapp_number,address,closing_time from store_settings where id = 1');
      const row = result.rows[0];
      const facts: StoreFacts | null = row ? {
        name: row.store_name,
        phone: row.phone,
        whatsappNumber: row.whatsapp_number,
        address: row.address,
        closingTime: row.closing_time,
      } : null;
      return json({ facts });
    }

    if (path === '/api/enquiries' && method === 'POST') {
      const body = await parseBody(request);
      const name = String(body.name ?? '').trim();
      const phone = String(body.phone ?? '').trim();
      const items = Array.isArray(body.items) ? body.items as { product_id: number; quantity: number }[] : [];
      if (!name || !phone) return json({ error: 'Name and phone are required.' }, 400);
      if (!items.length || items.length > 30) return json({ error: 'Add between 1 and 30 products.' }, 400);
      const client = await db().connect();
      try {
        await client.query('begin');
        const inserted = await client.query<{ id: number }>('insert into orders (order_number, customer_name, customer_phone, notes, status, payment_status, payment_method, total) values ($1,$2,$3,$4,$5,$6,$7,$8) returning id', [`TMP-${randomBytes(8).toString('hex')}`, name, phone, null, 'pending', 'unpaid', 'whatsapp', 0]);
        const orderId = inserted.rows[0].id;
        const orderNumber = `GP-${String(orderId).padStart(5, '0')}`;
        let total = 0;
        for (const item of items) {
          const qty = Number(item.quantity);
          if (!Number.isInteger(qty) || qty < 1 || qty > 99) throw new Error('Invalid quantity');
          const product = await client.query<{ id: number; name: string; price: number }>('select id,name,price from products where id = $1', [item.product_id]);
          const row = product.rows[0];
          if (!row) throw new Error('Unknown product');
          const line = Number(row.price) * qty;
          total += line;
          await client.query('insert into order_items (order_id, product_id, product_name, quantity, unit_price, line_total) values ($1,$2,$3,$4,$5,$6)', [orderId, row.id, row.name, qty, row.price, line]);
        }
        await client.query('update orders set order_number = $1, total = $2 where id = $3', [orderNumber, total, orderId]);
        await client.query('commit');
        return json({ orderNumber });
      } catch (error) {
        await client.query('rollback');
        throw error;
      } finally {
        client.release();
      }
    }

    if (path === '/api/contact' && method === 'POST') {
      const body = await parseBody(request);
      const message = String(body.message ?? '').trim();
      if (!message) return json({ error: 'Message is required.' }, 400);
      if (message.length > 4000) return json({ error: 'Message is too long.' }, 400);
      const result = await query<{ id: number }>('insert into contact_messages (customer_name, customer_email, customer_phone, message, status) values ($1,$2,$3,$4,$5) returning id', [
        String(body.name ?? '').trim() || 'Website visitor',
        String(body.email ?? '').trim() || null,
        String(body.phone ?? '').trim() || null,
        message,
        'new',
      ]);
      return json({ id: result.rows[0].id });
    }

    if (path === '/api/admin/login' && method === 'POST') {
      const body = await parseBody(request);
      const email = String(body.email ?? '').trim().toLowerCase();
      const password = String(body.password ?? '');
      const found = await query<{ email: string; password_hash: string }>('select email, password_hash from admins where lower(email) = $1', [email]);
      const row = found.rows[0];
      if (!row || !(await bcrypt.compare(password, row.password_hash))) {
        return json({ error: 'Email or password is wrong.' }, 401);
      }
      return json({ email: row.email }, 200, { 'set-cookie': sessionCookie(signSession(row.email), SESSION_HOURS * 60 * 60) });
    }

    if (path === '/api/admin/logout' && method === 'POST') {
      return json({ ok: true }, 200, { 'set-cookie': sessionCookie('', 0) });
    }

    if (path === '/api/admin/me' && method === 'GET') {
      const email = await requireAdmin(request);
      return json({ email });
    }

    if (path === '/api/admin/products' && method === 'GET') {
      await requireAdmin(request);
      const result = await query<AdminProduct>('select id,name,category,group_name,subcategory,image_key,image_url,price,old_price,badge,description,stock from products order by name');
      return json({ products: result.rows.map(mapProduct) });
    }

    if (path === '/api/admin/products' && method === 'POST') {
      await requireAdmin(request);
      const input = await parseBody(request) as unknown as ProductInput;
      await query(
        'insert into products (name, group_name, subcategory, category, price, old_price, stock, description, badge, image_url, image_key) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)',
        [input.name, input.group_name, input.subcategory || null, input.subcategory || input.group_name, input.price, input.old_price, input.stock, input.description, input.badge, input.image_url, input.image_key || 'remote'],
      );
      return json({ ok: true });
    }

    const productMatch = path.match(/^\/api\/admin\/products\/(\d+)$/);
    if (productMatch && method === 'PUT') {
      await requireAdmin(request);
      const input = await parseBody(request) as unknown as ProductInput;
      await query(
        'update products set name=$1, group_name=$2, subcategory=$3, category=$4, price=$5, old_price=$6, stock=$7, description=$8, badge=$9, image_url=$10, image_key=$11 where id=$12',
        [input.name, input.group_name, input.subcategory || null, input.subcategory || input.group_name, input.price, input.old_price, input.stock, input.description, input.badge, input.image_url, input.image_key || 'remote', Number(productMatch[1])],
      );
      return json({ ok: true });
    }
    if (productMatch && method === 'DELETE') {
      await requireAdmin(request);
      const id = Number(productMatch[1]);
      const current = await query<{ image_url: string | null }>('select image_url from products where id = $1', [id]);
      const imageUrl = current.rows[0]?.image_url;
      if (imageUrl?.startsWith('/uploads/')) {
        await unlink(join(process.cwd(), 'public', imageUrl)).catch(() => undefined);
      }
      await query('delete from products where id = $1', [id]);
      return json({ ok: true });
    }

    const stockMatch = path.match(/^\/api\/admin\/products\/(\d+)\/stock$/);
    if (stockMatch && method === 'PATCH') {
      await requireAdmin(request);
      const body = await parseBody(request);
      await query('update products set stock = $1 where id = $2', [Number(body.stock), Number(stockMatch[1])]);
      return json({ ok: true });
    }

    if (path === '/api/admin/uploads' && method === 'POST') {
      await requireAdmin(request);
      const form = await request.formData();
      const file = form.get('file');
      if (!(file instanceof File)) return json({ error: 'Choose an image file.' }, 400);
      if (!file.type.startsWith('image/')) return json({ error: 'Choose an image file.' }, 400);
      if (file.size > 5 * 1024 * 1024) return json({ error: 'Images must be 5 MB or smaller.' }, 400);
      const ext = (extname(file.name) || '.jpg').toLowerCase().replace(/[^.a-z0-9]/g, '') || '.jpg';
      const name = `${crypto.randomUUID()}${ext}`;
      const dir = join(process.cwd(), 'public', 'uploads');
      await mkdir(dir, { recursive: true });
      await writeFile(join(dir, name), Buffer.from(await file.arrayBuffer()));
      return json({ url: `/uploads/${name}` });
    }

    if (path === '/api/admin/categories' && method === 'GET') {
      await requireAdmin(request);
      const categories = await query<{ id: number; name: string; label: string; sort_order: number }>('select id,name,label,sort_order from categories order by sort_order, id');
      const subs = await query<{ id: number; category_id: number; name: string; sort_order: number }>('select id,category_id,name,sort_order from subcategories order by sort_order, id');
      const rows: AdminCategory[] = categories.rows.map(category => ({
        id: Number(category.id),
        name: category.name,
        label: category.label,
        sort_order: Number(category.sort_order),
        subcategories: subs.rows.filter(sub => Number(sub.category_id) === Number(category.id)).map(sub => ({
          id: Number(sub.id),
          category_id: Number(sub.category_id),
          name: sub.name,
          sort_order: Number(sub.sort_order),
        })),
      }));
      return json({ categories: rows });
    }

    if (path === '/api/admin/categories' && method === 'POST') {
      await requireAdmin(request);
      const body = await parseBody(request);
      await query('insert into categories (name, label, sort_order) values ($1,$2,$3)', [body.name, body.label, body.sort_order]);
      return json({ ok: true });
    }

    const categoryMatch = path.match(/^\/api\/admin\/categories\/(\d+)$/);
    if (categoryMatch && method === 'PUT') {
      await requireAdmin(request);
      const body = await parseBody(request);
      await query('update categories set name=$1, label=$2, sort_order=$3 where id=$4', [body.name, body.label, body.sort_order, Number(categoryMatch[1])]);
      return json({ ok: true });
    }
    if (categoryMatch && method === 'DELETE') {
      await requireAdmin(request);
      await query('delete from categories where id = $1', [Number(categoryMatch[1])]);
      return json({ ok: true });
    }

    if (path === '/api/admin/subcategories' && method === 'POST') {
      await requireAdmin(request);
      const body = await parseBody(request);
      await query('insert into subcategories (category_id, name, sort_order) values ($1,$2,$3)', [body.category_id, body.name, body.sort_order]);
      return json({ ok: true });
    }

    const subMatch = path.match(/^\/api\/admin\/subcategories\/(\d+)$/);
    if (subMatch && method === 'DELETE') {
      await requireAdmin(request);
      await query('delete from subcategories where id = $1', [Number(subMatch[1])]);
      return json({ ok: true });
    }

    if (path === '/api/admin/orders' && method === 'GET') {
      await requireAdmin(request);
      const orders = await query('select id,order_number,customer_name,customer_phone,customer_email,customer_address,notes,status,payment_status,payment_method,total,created_at from orders order by created_at desc');
      const ids = orders.rows.map(row => Number(row.id));
      const items = ids.length
        ? await query('select id,order_id,product_id,product_name,quantity,unit_price,line_total from order_items where order_id = any($1::bigint[])', [ids])
        : { rows: [] };
      const rows: AdminOrder[] = orders.rows.map(order => ({
        id: Number(order.id),
        order_number: order.order_number,
        customer_name: order.customer_name,
        customer_phone: order.customer_phone,
        customer_email: order.customer_email,
        customer_address: order.customer_address,
        notes: order.notes,
        status: order.status,
        payment_status: order.payment_status,
        payment_method: order.payment_method,
        total: Number(order.total),
        created_at: new Date(order.created_at).toISOString(),
        items: items.rows.filter(item => Number(item.order_id) === Number(order.id)).map(item => ({
          id: Number(item.id),
          order_id: Number(item.order_id),
          product_id: item.product_id == null ? null : Number(item.product_id),
          product_name: item.product_name,
          quantity: Number(item.quantity),
          unit_price: Number(item.unit_price),
          line_total: Number(item.line_total),
        })),
      }));
      return json({ orders: rows });
    }

    const orderMatch = path.match(/^\/api\/admin\/orders\/(\d+)$/);
    if (orderMatch && method === 'PATCH') {
      await requireAdmin(request);
      const body = await parseBody(request);
      if (body.status && body.payment_status) {
        await query('update orders set status=$1, payment_status=$2 where id=$3', [body.status as OrderStatus, body.payment_status as PaymentStatus, Number(orderMatch[1])]);
      }
      if (body.payment_method) {
        await query('update orders set payment_method=$1 where id=$2', [body.payment_method as TaxPaymentMethod, Number(orderMatch[1])]);
      }
      return json({ ok: true });
    }

    if (path === '/api/admin/messages' && method === 'GET') {
      await requireAdmin(request);
      const result = await query<AdminContactMessage>('select id,customer_name,customer_email,customer_phone,message,status,created_at from contact_messages order by created_at desc');
      return json({
        messages: result.rows.map(row => ({
          ...row,
          id: Number(row.id),
          created_at: new Date(row.created_at).toISOString(),
        })),
      });
    }

    const messageMatch = path.match(/^\/api\/admin\/messages\/(\d+)$/);
    if (messageMatch && method === 'PATCH') {
      await requireAdmin(request);
      const body = await parseBody(request);
      await query('update contact_messages set status=$1 where id=$2', [body.status as MessageStatus, Number(messageMatch[1])]);
      return json({ ok: true });
    }

    if (path === '/api/admin/settings' && method === 'GET') {
      await requireAdmin(request);
      const result = await query<StoreSettings>('select id,store_name,phone,whatsapp_number,address,closing_time,low_stock_threshold from store_settings where id = 1');
      const row = result.rows[0];
      if (!row) return json({ error: 'Store settings missing.' }, 404);
      return json({
        settings: {
          ...row,
          id: Number(row.id),
          low_stock_threshold: Number(row.low_stock_threshold),
        },
      });
    }

    if (path === '/api/admin/settings' && method === 'PUT') {
      await requireAdmin(request);
      const body = await parseBody(request);
      await query(
        'update store_settings set store_name=$1, phone=$2, whatsapp_number=$3, address=$4, closing_time=$5, low_stock_threshold=$6 where id=1',
        [body.store_name, body.phone, body.whatsapp_number, body.address, body.closing_time, body.low_stock_threshold],
      );
      return json({ ok: true });
    }

    if (path === '/api/admin/tax' && method === 'GET') {
      await requireAdmin(request);
      const result = await query<TaxSettings>('select id,card_tax_percent,cod_tax_percent from tax_settings where id = 1');
      const row = result.rows[0] ?? { id: 1, card_tax_percent: 0, cod_tax_percent: 0 };
      if (!result.rows[0]) {
        await query('insert into tax_settings (id, card_tax_percent, cod_tax_percent) values (1,0,0) on conflict (id) do nothing');
      }
      return json({
        settings: {
          id: Number(row.id),
          card_tax_percent: Number(row.card_tax_percent),
          cod_tax_percent: Number(row.cod_tax_percent),
        },
      });
    }

    if (path === '/api/admin/tax' && method === 'PUT') {
      await requireAdmin(request);
      const body = await parseBody(request);
      await query(
        'insert into tax_settings (id, card_tax_percent, cod_tax_percent) values (1,$1,$2) on conflict (id) do update set card_tax_percent = excluded.card_tax_percent, cod_tax_percent = excluded.cod_tax_percent',
        [body.card_tax_percent, body.cod_tax_percent],
      );
      return json({ ok: true });
    }

    return json({ error: 'Not found.' }, 404);
  } catch (error) {
    const status = typeof error === 'object' && error && 'status' in error ? Number((error as { status: number }).status) : 500;
    const message = error instanceof Error ? error.message : 'Server error';
    return json({ error: message }, status || 500);
  }
}
