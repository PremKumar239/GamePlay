import { Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { ArrowRight, ArrowUpRight, ChevronDown, ChevronLeft, ChevronRight, Clock3, Gamepad2, Headphones, Heart, MapPin, Menu, MessageCircle, Minus, Phone, Plus, Search, ShieldCheck, ShoppingBag, ShoppingCart, Star, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import gamesBanner from '@/assets/games-banner.jpg';
import accessoriesBanner from '@/assets/accessories-banner.jpg';
import homeBannerFc27 from '@/assets/home-banner-fc27.webp';
import homeBannerAce from '@/assets/home-banner-ace.webp';
import homeBannerWolverine from '@/assets/home-banner-wolverine.webp';
import homeBannerGta6 from '@/assets/home-banner-gta6.webp';
import giftBannerXbox from '@/assets/gift-banner-xbox.jpg';
import giftBannerApple from '@/assets/gift-banner-apple.jpg';
import giftBannerMix from '@/assets/gift-banner-mix.jpg';
import giftBannerDepot from '@/assets/gift-banner-depot.jpg';
import giftBannerSteam from '@/assets/gift-banner-steam.jpg';
import { HomeShowcases } from '@/components/product-showcase';
import { ReviewsPanel, ReviewsTab } from '@/components/reviews-panel';
import { business, catalog, defaultFacts, giftAmounts, giftBrands, getProduct, products, money, mailTo, filterProducts, phoneLink, shopSearch, loadCatalogFromDatabase, loadProductsFromDatabase, loadReviews, loadStoreFacts, mergeCatalog, placeContactMessage, placeEnquiry, whatsappTo, type CatalogGroup, type Product, type StoreFacts } from '@/lib/store';
import { useShopping } from '@/components/shopping-context';

export function Brand() { return <Link to="/" className="brand" aria-label="GAME PLAY home"><img src="/favicon.png" alt="" width={52} height={52} /><span className="brand-lockup"><span className="brand-name">GAME PLAY</span><span className="brand-tag">Gaming store</span></span></Link>; }

export function Storefront({ page = 'home', initialCategory = 'All', initialSub = '', initialQuery = '', initialDeals = false, productId }: { page?: 'home' | 'shop' | 'contact' | 'categories' | 'about' | 'product'; initialCategory?: string; initialSub?: string; initialQuery?: string; initialDeals?: boolean; productId?: number }) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [subcategory, setSubcategory] = useState(initialSub);
  const [deals, setDeals] = useState(initialDeals);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [listed, setListed] = useState(products);
  const [groups, setGroups] = useState(catalog);
  const [facts, setFacts] = useState<StoreFacts>(defaultFacts);
  const [reviewStats, setReviewStats] = useState({ rating: business.rating, count: business.reviews });
  const {cart, setCart, favorites, setFavorites, wishOnly, setWishOnly} = useShopping();
  const navigate = useNavigate();
  const [cartOpen, setCartOpen] = useState(false);
  const [reviewsOpen, setReviewsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const directions = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${facts.name} ${facts.address}`)}`;
  const askStore = (text: string) => whatsappTo(facts.whatsappNumber, text);
  useEffect(() => { setCategory(initialCategory); setSubcategory(initialSub); setQuery(initialQuery); setDeals(initialDeals); }, [initialCategory, initialSub, initialQuery, initialDeals]);
  useEffect(() => {
    let cancel = false;
    loadProductsFromDatabase().then(rows => { if (!cancel && rows) setListed(rows); });
    loadCatalogFromDatabase().then(rows => { if (!cancel) setGroups(mergeCatalog(rows)); });
    loadStoreFacts().then(rows => { if (!cancel && rows) setFacts(rows); });
    loadReviews().then(rows => { if (!cancel) setReviewStats({ rating: rows.rating, count: rows.count }); });
    return () => { cancel = true; };
  }, []);
  useEffect(() => {
    if (!cartOpen) return;
    const before = document.body.style.overflow; document.body.style.overflow = 'hidden';
    const close = (e: KeyboardEvent) => { if (e.key === 'Escape') setCartOpen(false); };
    window.addEventListener('keydown', close);
    return () => { document.body.style.overflow = before; window.removeEventListener('keydown', close); };
  }, [cartOpen]);
  const count = Object.values(cart).reduce((s, n) => s + n, 0);
  const add = (id: number) => { setCart(prev => ({ ...prev, [id]: (prev[id] ?? 0) + 1 })); setCartOpen(true); };
  const toggleFavorite = (id: number) => setFavorites(prev => prev.includes(id) ? prev.filter(n => n !== id) : [...prev, id]);
  const visible = filterProducts(category, query, deals, subcategory, listed).filter(p => !wishOnly || favorites.includes(p.id));
  const gridItems = page === 'home' && !wishOnly ? visible.slice(0, 8) : visible;
  const listedTotal = listed.reduce((sum, item) => sum + item.price * (cart[item.id] ?? 0), 0);
  const activeGroup = groups.find(group => group.name === category);
  const detail = page === 'product' && productId != null ? getProduct(productId, listed) : null;
  const searchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (page === 'shop' || page === 'product') navigate({ to: '/shop', search: shopSearch(category, subcategory, query, deals) });
    else if (query.trim()) navigate({ to: '/shop', search: shopSearch('All', '', query, false) });
    if (page !== 'product') document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
  };
  const enquire = () => {
    const lines = listed.flatMap(p => { const quantity = cart[p.id] ?? 0; return quantity > 0 ? [{ product: p, quantity }] : []; });
    const text = `Hi GAME PLAY! Please confirm availability and current prices for:\n${lines.map(line => `${line.quantity} × ${line.product.name}`).join('\n')}${buyerName.trim() ? `\nName: ${buyerName.trim()}` : ''}${buyerPhone.trim() ? `\nPhone: ${buyerPhone.trim()}` : ''}`;
    if (buyerName.trim() && buyerPhone.trim()) void placeEnquiry(buyerName.trim(), buyerPhone.trim(), lines.map(line => ({ product_id: line.product.id, quantity: line.quantity }))).catch(() => undefined);
    window.open(askStore(text), '_blank', 'noopener,noreferrer');
  };
  return <>
    <header className="store-container main-header"><Brand /><form className="search-form" onSubmit={searchSubmit}><input aria-label="Search products" placeholder="Search for consoles, games, accessories..." value={query} onChange={e => setQuery(e.target.value)} /><Button type="submit" variant="shop" size="icon" aria-label="Submit search"><Search /></Button></form><div className="header-actions"><Button variant="ghost" className="header-action px-1" title="Wishlist" onClick={() => { setWishOnly(!wishOnly); if (page !== 'home' && page !== 'shop') navigate({ to: '/shop', search: shopSearch() }); else document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' }); }}><span className="cart-icon"><Heart size={23} className={wishOnly ? 'text-success' : ''} />{favorites.length > 0 && <span className="count-badge">{favorites.length}</span>}</span><span className="header-action-text text-xs">Wishlist</span></Button><Button variant="ghost" className="header-action cart-action px-1" aria-label={`Open shopping cart, ${count} items`} onClick={() => setCartOpen(true)}><span className="cart-icon"><ShoppingCart size={23} />{count > 0 && <span className="count-badge">{count}</span>}</span><span className="header-action-text text-left"><span className="block text-[10px] text-muted-foreground">Shopping cart</span><strong className="text-xs">{money(listedTotal)}</strong></span></Button></div></header>
    <nav className="store-nav"><div className="store-container nav-inner"><Link className={`nav-link${page === 'home' ? ' is-active' : ''}`} to="/">Home</Link><Link className={`nav-link${page === 'shop' ? ' is-active' : ''}`} to="/shop" search={shopSearch()}>Products</Link><div className="nav-categories"><Button variant="ghost" className={`category-menu rounded-none px-0 hover:bg-transparent hover:text-primary${page === 'categories' ? ' text-primary' : ''}`} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}><Menu /> Categories <ChevronDown className="ml-2" /></Button></div><Link className={`nav-link${page === 'about' ? ' is-active' : ''}`} to="/about">About Us</Link><Link className={`nav-link${page === 'contact' ? ' is-active' : ''}`} to="/contact">Contact Us</Link><div className="nav-extra ml-auto flex shrink-0 items-center gap-3 text-[11px]"><a className="nav-extra-link" href={phoneLink(facts.phone)}><Headphones size={16} /> {facts.phone}</a><a className="nav-whatsapp" href={askStore('Hi GAME PLAY! I would like to ask about your products.')} target="_blank" rel="noreferrer" aria-label="Chat on WhatsApp"><MessageCircle size={16} /> WhatsApp</a></div></div>{menuOpen && <><button type="button" className="mega-backdrop" aria-label="Close categories" onClick={() => setMenuOpen(false)} /><div className="mega-menu">{groups.map(group => <div className={`mega-group${openGroup === group.name ? ' is-open' : ''}`} key={group.name}><div className="mega-head"><Link to="/shop" search={shopSearch(group.name)} onClick={() => setMenuOpen(false)}>{group.name}</Link>{group.subcategories.length > 0 && <button type="button" className="mega-toggle" aria-expanded={openGroup === group.name} onClick={() => setOpenGroup(openGroup === group.name ? null : group.name)}><ChevronDown size={16} /></button>}</div><div className="mega-subs">{group.subcategories.map(sub => <Link key={sub} to="/shop" search={shopSearch(group.name, sub)} onClick={() => setMenuOpen(false)}>{sub}</Link>)}</div></div>)}<Link className="mega-all" to="/categories" onClick={() => setMenuOpen(false)}>View all categories</Link></div></>}</nav>
    <main>
      {page === 'home' && <><div className="store-container home-top"><Hero /><Benefits /><section className="section scroll-reveal"><SectionHeading title="Shop by Category" link="Explore all categories" to="/categories" /><div className="category-grid">{groups.map(c => <Link key={c.name} to="/shop" search={shopSearch(c.name)} className="category-tile">{c.image ? <img src={c.image} alt="" width={180} height={100} loading="lazy" /> : <span className="catalog-mark">{c.name.slice(0, 1)}</span>}<strong>{c.name}</strong><span>{c.label}</span></Link>)}</div></section><div className="promo-grid scroll-reveal"><Promo image={gamesBanner} eyebrow="A NEW WORLD AWAITS" title={<>Epic games.<br />Endless adventures.</>} category="Games" /><Promo image={accessoriesBanner} eyebrow="GEAR UP. GAME ON." title={<>Your setup.<br />Only better.</>} category="All" /></div></div><HomeShowcases products={listed} /><GiftCards ask={askStore} /><WhatsHot products={listed} /></>}
      {page === 'shop' && category === 'Gift Cards' && <GiftCards subcategory={subcategory} ask={askStore} flush />}{(page === 'home' || page === 'shop') && <section id="products" className="section store-container scroll-reveal">{page === 'shop' && <Breadcrumb category={category} subcategory={subcategory} />}<div className="section-heading"><h2>{wishOnly ? 'Your Wishlist' : page === 'shop' ? deals ? 'Special Offers' : category === 'All' ? 'Products' : subcategory ? `${category} ${subcategory}` : category : 'Featured Products'}</h2><div className="catalog-tools"><Button variant={category === 'All' && !subcategory ? 'dark' : 'ghost'} size="sm" onClick={() => { if (page === 'shop') { navigate({ to: '/shop', search: shopSearch('All', '', query, deals) }); return; } setCategory('All'); setSubcategory(''); }}>All Products</Button>{groups.map(group => <Button key={group.name} variant={category === group.name ? 'dark' : 'ghost'} size="sm" onClick={() => { if (page === 'shop' || group.name === 'Gift Cards') { navigate({ to: '/shop', search: shopSearch(group.name, '', query, deals) }); return; } setCategory(group.name); setSubcategory(''); }}>{group.name}</Button>)}</div></div>{activeGroup && activeGroup.subcategories.length > 0 && <div className="catalog-tools sub-tools">{activeGroup.subcategories.map(sub => <Button key={sub} variant={subcategory === sub ? 'dark' : 'ghost'} size="sm" onClick={() => { const next = subcategory === sub ? '' : sub; if (page === 'shop') { navigate({ to: '/shop', search: shopSearch(category, next, query, deals) }); return; } setSubcategory(next); }}>{sub}</Button>)}</div>}{page === 'shop' && <div className="mb-5 flex items-center justify-between gap-3"><span className="text-xs text-muted-foreground">{visible.length} products</span><label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={deals} onChange={e => navigate({ to: '/shop', search: shopSearch(category, subcategory, query, e.target.checked) })} /> Special offers only</label></div>}{wishOnly && <Button size="sm" variant="outline" className="mb-4" onClick={() => setWishOnly(false)}>Show all products <X /></Button>}{gridItems.length ? <div className="product-grid">{gridItems.map(p => <ProductCard key={p.id} product={p} saved={favorites.includes(p.id)} onFavorite={() => toggleFavorite(p.id)} onAdd={() => add(p.id)} />)}</div> : category === 'Gift Cards' ? <GiftSkus brand={subcategory} ask={askStore} /> : <div className="py-16 text-center text-muted-foreground"><Search className="mx-auto mb-4" /><h3 className="font-bold">No products in {subcategory ? `${category} ${subcategory}` : category === 'All' ? 'this view' : category} yet</h3><p className="mx-auto mt-2 max-w-md text-xs">Ask the store what is available, or browse the rest of the catalog.</p><Button variant="link" onClick={() => { setWishOnly(false); if (page === 'shop') { navigate({ to: '/shop', search: shopSearch() }); return; } setQuery(''); setCategory('All'); setSubcategory(''); setDeals(false); }}>Browse all products</Button></div>}<p className="mt-5 text-[10px] text-muted-foreground">Sample catalog & indicative prices. Contact the store to confirm current stock, specifications and pricing.</p>{page === 'home' && <div className="mt-6 text-center"><Button variant="outline" asChild><Link to="/shop" search={shopSearch()}>View All Products <ArrowRight /></Link></Button></div>}</section>}
      {page === 'product' && <ProductDetail product={detail} saved={detail ? favorites.includes(detail.id) : false} onFavorite={() => detail && toggleFavorite(detail.id)} onAdd={() => detail && add(detail.id)} ask={askStore} />}
      {page === 'categories' && <CategoryDirectory groups={groups} />}
      {page === 'about' && <AboutSection facts={facts} reviewStats={reviewStats} />}
      {page === 'home' && <div className="store-container"><div className="brand-band"><span>PlayStation.</span><span className="italic">XBOX</span><span>NINTENDO</span><span className="font-sans text-xl">logitech G</span><span>HYPERX</span><span>RAZER</span></div></div>}
      <ContactSection full={page === 'contact'} facts={facts} directions={directions} ask={askStore} onOpenReviews={() => setReviewsOpen(true)} reviewStats={reviewStats} />
    </main>
    <Footer groups={groups} facts={facts} directions={directions} ask={askStore} onOpenReviews={() => setReviewsOpen(true)} />
    {!reviewsOpen && <ReviewsTab onOpen={() => setReviewsOpen(true)} />}
    <Button asChild variant="shop" className="floating-contact" title="Chat with GAME PLAY"><a href={askStore('Hi GAME PLAY! I would like to ask about your products.')} target="_blank" rel="noreferrer" aria-label="Chat on WhatsApp"><MessageCircle size={24} /></a></Button>
    <ReviewsPanel open={reviewsOpen} onClose={() => setReviewsOpen(false)} mapsUrl={directions} />
    {cartOpen && <div className="drawer-backdrop" onClick={() => setCartOpen(false)}><section className="cart-drawer" role="dialog" aria-modal="true" aria-label="Shopping cart" onClick={e => e.stopPropagation()}><div className="flex items-center justify-between"><h2 className="text-xl font-extrabold">Your Cart <span className="text-muted-foreground">({count})</span></h2><Button variant="ghost" size="icon" autoFocus aria-label="Close cart" onClick={() => setCartOpen(false)}><X /></Button></div>{count === 0 ? <div className="py-20 text-center"><ShoppingBag className="mx-auto mb-4 text-muted-foreground" size={40} /><h3 className="font-bold">Your next adventure is waiting.</h3><p className="my-3 text-xs text-muted-foreground">Your shopping cart is empty.</p><Button variant="shop" onClick={() => setCartOpen(false)}>Continue Shopping <ArrowRight /></Button></div> : <>{listed.filter(p => cart[p.id]).map(p => <div key={p.id} className="cart-row"><img src={p.image} alt={p.name} /><div className="min-w-0"><h3 className="text-xs font-bold">{p.name}</h3><p className="my-2 text-xs">{money(p.price)}</p><div className="flex items-center gap-2"><Button variant="outline" size="icon" aria-label={`Decrease ${p.name} quantity`} onClick={() => setCart(prev => ({...prev,[p.id]:Math.max(0,(prev[p.id] ?? 0)-1)}))}><Minus /></Button><span>{cart[p.id]}</span><Button variant="outline" size="icon" aria-label={`Increase ${p.name} quantity`} onClick={() => setCart(prev => ({...prev,[p.id]:(prev[p.id] ?? 0)+1}))}><Plus /></Button></div></div><Button variant="ghost" size="icon" aria-label={`Remove ${p.name}`} onClick={() => setCart(prev => ({...prev,[p.id]:0}))}><Trash2 /></Button></div>)}<div className="my-6 flex justify-between font-bold"><span>Estimated Total</span><span>{money(listedTotal)}</span></div><div className="cart-buyer"><input aria-label="Your name" placeholder="Your name" value={buyerName} onChange={e => setBuyerName(e.target.value)} /><input aria-label="Your phone" placeholder="Your phone" value={buyerPhone} onChange={e => setBuyerPhone(e.target.value)} /></div><Button variant="shop" className="mt-3 w-full" onClick={enquire}>Enquire on WhatsApp <ArrowUpRight /></Button><p className="mt-3 text-xs leading-relaxed text-muted-foreground">Add your name and phone so the store can see this enquiry. No payment is taken here.</p></>}</section></div>}
  </>;
}

function SectionHeading({title,link,to}:{title:string;link?:string;to?:'/'|'/categories'|'/about'|'/contact'}) { return <div className="section-heading"><h2>{title}</h2>{link && (to ? <Link className="section-link" to={to}>{link} <ArrowRight size={14} /></Link> : <Link className="section-link" to="/shop" search={shopSearch()}>{link} <ArrowRight size={14} /></Link>)}</div>; }
function Breadcrumb({category,subcategory}:{category:string;subcategory:string}) { return <nav className="crumbs" aria-label="Breadcrumb"><Link to="/">Home</Link><span aria-hidden="true">/</span>{category === 'All' ? <span>Products</span> : <Link to="/shop" search={shopSearch()}>Products</Link>}{category !== 'All' && <><span aria-hidden="true">/</span><Link to="/categories">Categories</Link><span aria-hidden="true">/</span>{subcategory ? <Link to="/shop" search={shopSearch(category)}>{category}</Link> : <span>{category}</span>}</>}{subcategory && <><span aria-hidden="true">/</span><span>{subcategory}</span></>}</nav>; }
function CategoryDirectory({ groups }: { groups: CatalogGroup[] }) { return <section className="section store-container"><nav className="crumbs" aria-label="Breadcrumb"><Link to="/">Home</Link><span aria-hidden="true">/</span><span>Categories</span></nav><SectionHeading title="Categories" /><div className="catalog-board">{groups.map(group => <article className="catalog-card" key={group.name}>{group.image ? <img src={group.image} alt="" width={180} height={120} /> : <span className="catalog-mark">{group.name.slice(0, 2)}</span>}<div><h3>{group.name}</h3><p>{group.label}</p><Link className="catalog-view" to="/shop" search={shopSearch(group.name)}>View {group.name} products</Link>{group.subcategories.length > 0 && <div className="sub-list">{group.subcategories.map(sub => <Link key={sub} to="/shop" search={shopSearch(group.name, sub)}>{sub}</Link>)}</div>}</div></article>)}</div></section>; }
function AboutSection({ facts, reviewStats }: { facts: StoreFacts; reviewStats: { rating: number; count: number } }) {
  return <section className="section store-container about-page">
    <nav className="crumbs" aria-label="Breadcrumb"><Link to="/">Home</Link><span aria-hidden="true">/</span><span>About Us</span></nav>
    <SectionHeading title="About Us" />
    <div className="about-copy">
      <article className="about-block">
        <h3>Get to Know Us</h3>
        <p>{facts.name} has been serving gamers in Lahore with consoles, games, accessories and gift cards. With our Bahria Town store and this online catalogue, our mission is to earn your trust through clear prices, honest advice and friendly support — before, during and after every purchase.</p>
        <p>Competitive pricing matters, but great service matters more. We keep a knowledgeable team ready to help you choose the right setup, confirm stock and make sure you leave happy — whether you shop in person or enquire online.</p>
      </article>
      <article className="about-block">
        <h3>What We Do</h3>
        <p>Our approach is simple: make gaming easy to shop. Find what you need, ask about availability, and get top-tier service from real people who play. We continually improve how we help customers across Pakistan — from PlayStation and Xbox gear to Nintendo, mobiles, laptops and digital gift cards — at fair, sample prices you confirm with the store.</p>
        <p>Visit us at {facts.address}. Rated {reviewStats.rating}/5 from {reviewStats.count} reviews. Store hours close at {facts.closingTime} — call {facts.phone} to confirm today’s opening times.</p>
      </article>
      <article className="about-block">
        <h3>Principles Over Profits</h3>
        <p>We build long-term relationships with players, not one-off sales. That means recommending what actually fits your budget and games — even when a cheaper or different option is the better call. You come first in every recommendation, WhatsApp reply and in-store conversation.</p>
      </article>
      <article className="about-block">
        <h3>What Can We Do For You?</h3>
        <ul className="about-list">
          <li><strong>Customer support.</strong> Ask about stock, editions, gift cards or setup help anytime — by call, WhatsApp or in store. We’re here before, during and after your purchase.</li>
          <li><strong>Fair value.</strong> Sample catalogue prices online; the store confirms the final price so you always know what you’re paying.</li>
          <li><strong>Personal help.</strong> No bots for the important stuff. Our team helps you compare consoles, controllers, games and accessories so you can buy with confidence.</li>
        </ul>
      </article>
      <article className="about-block" id="refund-exchange">
        <h3>Refund &amp; Exchange Policy</h3>
        <p>GAME PLAY accepts refunds and exchanges for eligible purchases made at our physical store in Bahria Town or through online / WhatsApp enquiries completed with the store. Policy highlights:</p>
        <ul className="about-list">
          <li><strong>Store &amp; online.</strong> The same refund and exchange options apply whether you buy in person or complete an order after an online enquiry.</li>
          <li><strong>Contact us first.</strong> Call {facts.phone} or message us on WhatsApp to start a refund or exchange. Bring your receipt, invoice or order details.</li>
          <li><strong>Unused &amp; original condition.</strong> Products should be unused, complete with original packaging, accessories, seals and tags where applicable.</li>
          <li><strong>Time window.</strong> Request a refund or exchange within a reasonable period after purchase (confirm the exact window with the store when you buy).</li>
          <li><strong>Digital gift cards.</strong> Once a digital code or gift card has been revealed, delivered or activated, it generally cannot be refunded or exchanged.</li>
          <li><strong>Faulty items.</strong> Defective products may be exchanged or refunded after the store checks the item. Manufacturer warranty terms may also apply.</li>
          <li><strong>Final say.</strong> Eligibility is confirmed by GAME PLAY staff. Some clearance, opened software or special-order items may be non-returnable — ask before you pay.</li>
        </ul>
      </article>
      <p className="gift-note">Orders on this website are WhatsApp enquiries. Stock, prices and refund or exchange terms are confirmed by the store before you pay.</p>
      <div className="about-actions">
        <Button asChild variant="dark"><Link to="/contact">Contact Us <ArrowRight /></Link></Button>
        <Button asChild variant="outline"><a href={phoneLink(facts.phone)}>Call {facts.phone}</a></Button>
      </div>
    </div>
  </section>;
}
const giftBannerSlides = [
  { image: giftBannerXbox, alt: 'Xbox gift cards', category: 'Gift Cards', sub: 'Xbox', width: 1024, height: 254 },
  { image: giftBannerApple, alt: 'Apple gift cards', category: 'Gift Cards', sub: 'Apple', width: 1024, height: 256 },
  { image: giftBannerMix, alt: 'Gift cards at GAME PLAY', category: 'Gift Cards', width: 1024, height: 256 },
  { image: giftBannerDepot, alt: 'Premium digital gift cards', category: 'Gift Cards', width: 1024, height: 256 },
  { image: giftBannerSteam, alt: 'Steam gift cards', category: 'Gift Cards', sub: 'Steam', width: 1024, height: 256 },
] as const;
function GiftCards({ subcategory = '', flush = false }: { subcategory?: string; ask: (text: string) => string; flush?: boolean }) {
  return <section className={`section store-container gift-section${flush ? ' is-flush' : ''}`} aria-label="Gift Cards">
    <BannerCarousel slides={giftBannerSlides} />
    <SectionHeading title="Gift Cards" />
    <div className="gift-brand-grid">{giftBrands.map(brand => <Link key={brand.name} className={`gift-brand${subcategory === brand.name ? ' is-active' : ''}`} to="/shop" search={shopSearch('Gift Cards', brand.name)} aria-label={`${brand.name} Gift Card`}><img src={brand.image} alt="" />{brand.name === 'Nintendo eShop' && <span className="gift-overlay">Nintendo eShop</span>}</Link>)}</div>
    <p className="gift-note">Sample prices in PKR. GAME PLAY confirms the card and the price on WhatsApp.</p>
  </section>;
}
function GiftSkus({ brand, ask }: { brand: string; ask: (text: string) => string }) {
  const card = giftBrands.find(item => item.name === brand);
  if (!brand || !card) return <p className="py-6 text-sm text-muted-foreground">Choose a gift card brand above to see every card value.</p>;
  return <div className="gift-shop-grid">{giftAmounts.map(amount => <a key={amount} className="gift-sku" href={ask(`Hi GAME PLAY! I would like a ${brand} gift card for ${money(amount)}.`)} target="_blank" rel="noreferrer"><span className="gift-face"><img src={card.image} alt="" /><span className="gift-ribbon">{money(amount)}</span>{brand === 'Nintendo eShop' && <span className="gift-overlay">Nintendo eShop</span>}</span><h3>{brand} Gift Card {money(amount)}</h3><p className="gift-price">{money(amount)}</p><p className="gift-status">Ask the store</p></a>)}</div>;
}
function WhatsHot({ products: picksSource }: { products: Product[] }) {
  const picks = [1, 2, 7].map(id => picksSource.find(p => p.id === id)).filter((p): p is Product => Boolean(p));
  return <section className="section store-container" aria-label="What's Hot"><SectionHeading title="What's Hot" /><div className="hot-grid">{picks.map(p => <article className="hot-card" key={p.id}><p className="hot-kicker">{p.category}</p><h3>{p.name}</h3><img src={p.image} alt={p.name} width={320} height={220} /><Button asChild variant="banner" size="sm" className="hot-pill"><Link to="/shop" search={shopSearch(p.group ?? p.category, p.subcategory ?? '')}>Shop from {money(p.price)}</Link></Button></article>)}</div></section>;
}
type BannerSlide = { image: string; alt: string; category: string; sub?: string; width?: number; height?: number };
function BannerCarousel({ slides, className = 'hero' }: { slides: readonly BannerSlide[]; className?: string }) {
  const [slide, setSlide] = useState(0);
  useEffect(() => {
    const id = window.setTimeout(() => setSlide(currentSlide => (currentSlide + 1) % slides.length), 3000);
    return () => window.clearTimeout(id);
  }, [slide, slides.length]);
  const current = slides[slide];
  if (!current) return null;
  return <section className={className} aria-roledescription="carousel">{slides.map((item, index) => <img key={item.image} src={item.image} alt="" aria-hidden="true" className={`banner-image${index === slide ? ' is-active' : ''}`} width={item.width ?? 1024} height={item.height ?? 384} fetchPriority={index === 0 ? 'high' : 'low'} />)}<Link className="hero-link" to="/shop" search={shopSearch(current.category, current.sub ?? '')} aria-label={current.alt} /><div className="slide-dots" aria-hidden="true">{slides.map((_, i) => <span key={i} className={`slide-dot ${i === slide ? 'active' : ''}`} />)}</div><div className="slide-arrows"><Button variant="banner" size="icon" aria-label="Previous banner" onClick={() => setSlide((slide + slides.length - 1) % slides.length)}><ChevronLeft /></Button><Button variant="banner" size="icon" aria-label="Next banner" onClick={() => setSlide((slide + 1) % slides.length)}><ChevronRight /></Button></div></section>;
}
function Hero() {
  return <BannerCarousel className="hero home-hero" slides={[
    { image: homeBannerFc27, alt: 'EA Sports FC 27, shop now', category: 'Games', width: 1024, height: 384 },
    { image: homeBannerAce, alt: 'Ace Combat 8, order now', category: 'Games', width: 1024, height: 384 },
    { image: homeBannerWolverine, alt: 'Marvel Wolverine, shop now', category: 'Games', width: 1024, height: 384 },
    { image: homeBannerGta6, alt: 'Grand Theft Auto VI, coming 19 November 2026', category: 'Games', width: 1024, height: 384 },
  ]} />;
}
function Benefits() { return <div className="benefits">{[{icon:ShieldCheck,title:'Shop with Confidence',copy:'Quality gaming essentials'},{icon:Gamepad2,title:'Everything Gaming',copy:'Consoles, games & accessories'},{icon:Headphones,title:'Expert Advice',copy:'Real gamers. Real support.'},{icon:MapPin,title:'Visit Our Store',copy:'Bahria Town, Lahore'}].map(b=><div className="benefit" key={b.title}><b.icon /><div><strong>{b.title}</strong><span>{b.copy}</span></div></div>)}</div>; }
function Promo({image,eyebrow,title,category}:{image:string;eyebrow:string;title:React.ReactNode;category:string}) { return <section className="promo-banner"><img src={image} className="banner-image" alt={category==='Games'?'Samurai adventure gaming artwork':'Gaming headset, mouse and keyboard'} width={1152} height={576} loading="lazy" /><div className="promo-copy"><span className="eyebrow text-[9px]">{eyebrow}</span><h2>{title}</h2><Button asChild variant="banner" size="sm"><Link to="/shop" search={shopSearch(category)}>Shop Now <ArrowRight /></Link></Button></div></section>; }
function ProductCard({product:p,saved,onFavorite,onAdd}:{product:Product;saved:boolean;onFavorite:()=>void;onAdd:()=>void}) { return <article className="product-card">{p.badge && <span className="product-badge">{p.badge}</span>}<Button variant="ghost" size="icon" className={`product-heart${saved ? ' is-saved' : ''}`} aria-label={`${saved?'Remove':'Save'} ${p.name} ${saved?'from':'to'} wishlist`} onClick={onFavorite}><Heart className="product-heart-icon" fill={saved ? 'currentColor' : 'none'} /></Button><Link to="/product/$productId" params={{ productId: String(p.id) }} className="block" aria-label={`View ${p.name}`}><img className="product-picture" src={p.image} alt={p.name} width={240} height={180} loading="lazy" /></Link><div className="mt-3"><p className="product-category">{p.group ? `${p.group}${p.subcategory ? ` / ${p.subcategory}` : ''}` : p.category}</p><h3><Link to="/product/$productId" params={{ productId: String(p.id) }} className="text-xs font-bold hover:text-success">{p.name}</Link></h3><div className="price-line"><span className="price">{money(p.price)}</span>{p.oldPrice && <span className="old-price">{money(p.oldPrice)}</span>}</div><Button variant="outline" size="sm" className="w-full" onClick={onAdd}><Plus size={13} /> Add to Cart</Button></div></article>; }
function ProductDetail({ product, saved, onFavorite, onAdd, ask }: { product: Product | null; saved: boolean; onFavorite: () => void; onAdd: () => void; ask: (text: string) => string }) {
  if (!product) {
    return <section className="section store-container"><nav className="crumbs" aria-label="Breadcrumb"><Link to="/">Home</Link><span aria-hidden="true">/</span><Link to="/shop" search={shopSearch()}>Products</Link><span aria-hidden="true">/</span><span>Not found</span></nav><div className="py-16 text-center text-muted-foreground"><h2 className="text-2xl font-extrabold text-foreground">Product not found</h2><p className="mx-auto mt-3 max-w-md text-sm">This item is not in the catalog right now. Browse the shop or ask GAME PLAY what is available.</p><Button asChild variant="shop" className="mt-6"><Link to="/shop" search={shopSearch()}>Browse products <ArrowRight /></Link></Button></div></section>;
  }
  const group = product.group ?? product.category;
  const stockKnown = typeof product.stock === 'number' && product.stock > 0;
  const stockLabel = stockKnown ? `${product.stock} left in stock` : 'Stock — ask the store';
  return <section className="section store-container product-detail" aria-label={product.name}>
    <nav className="crumbs" aria-label="Breadcrumb"><Link to="/">Home</Link><span aria-hidden="true">/</span><Link to="/shop" search={shopSearch()}>Products</Link><span aria-hidden="true">/</span><Link to="/shop" search={shopSearch(group, product.subcategory ?? '')}>{group}</Link><span aria-hidden="true">/</span><span>{product.name}</span></nav>
    <div className="product-detail-grid">
      <div className="product-detail-media">{product.badge && <span className="product-badge">{product.badge}</span>}<img src={product.image} alt={product.name} width={640} height={480} /></div>
      <div className="product-detail-copy">
        <p className="product-category">{product.group ? `${product.group}${product.subcategory ? ` / ${product.subcategory}` : ''}` : product.category}</p>
        <h1>{product.name}</h1>
        <div className="price-line product-detail-price"><span className="price">{money(product.price)}</span>{product.oldPrice && <span className="old-price">{money(product.oldPrice)}</span>}</div>
        <p className={`product-detail-stock${stockKnown ? ' is-available' : ''}`}>{stockLabel}</p>
        {product.description ? <p className="product-detail-desc">{product.description}</p> : <p className="product-detail-desc is-muted">No written description yet. Ask GAME PLAY about available editions, specifications, warranty and the latest price.</p>}
        <ul className="product-detail-facts">
          <li><strong>Category</strong><span>{product.category}</span></li>
          {product.group && <li><strong>Brand</strong><span>{product.group}</span></li>}
          {product.subcategory && <li><strong>Type</strong><span>{product.subcategory}</span></li>}
          <li><strong>Stock left</strong><span>{stockKnown ? product.stock : 'Ask the store'}</span></li>
          <li><strong>Price</strong><span>{money(product.price)}{product.oldPrice ? ` (was ${money(product.oldPrice)})` : ''}</span></li>
        </ul>
        <div className="product-detail-actions">
          <Button variant="shop" onClick={onAdd}><ShoppingCart /> Add to Cart</Button>
          <Button variant="outline" onClick={onFavorite} className={saved ? 'product-heart is-saved' : ''}><Heart className="product-heart-icon" fill={saved ? 'currentColor' : 'none'} /> {saved ? 'Saved' : 'Wishlist'}</Button>
          <Button asChild variant="dark"><a href={ask(`Hi GAME PLAY! I would like to ask about ${product.name} (${money(product.price)}).`)} target="_blank" rel="noreferrer">Ask on WhatsApp <ArrowUpRight /></a></Button>
        </div>
        <p className="gift-note">Sample catalog and indicative prices. GAME PLAY confirms stock, editions and the final price before you pay.</p>
      </div>
    </div>
  </section>;
}
function ContactSection({ full, facts, directions, ask, onOpenReviews, reviewStats }: { full: boolean; facts: StoreFacts; directions: string; ask: (text: string) => string; onOpenReviews: () => void; reviewStats: { rating: number; count: number } }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [formNotice, setFormNotice] = useState('');
  const [formError, setFormError] = useState('');
  const buildMessage = () => [
    'Hi GAME PLAY! I have a question from the website.',
    name.trim() ? `Name: ${name.trim()}` : '',
    email.trim() ? `Email: ${email.trim()}` : '',
    phone.trim() ? `Phone: ${phone.trim()}` : '',
    '',
    message.trim() || 'Please get back to me about stock, prices or store details.',
  ].filter(Boolean).join('\n');
  const saveMessage = async () => {
    const text = message.trim();
    if (!text) throw new Error('Write your question first.');
    await placeContactMessage(name.trim(), email.trim(), phone.trim(), text);
  };
  const sendWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setFormError('');
    setFormNotice('');
    try {
      await saveMessage();
      setFormNotice('Message saved for GAME PLAY. Opening WhatsApp…');
      window.open(ask(buildMessage()), '_blank', 'noopener,noreferrer');
      setMessage('');
    } catch (reason) {
      setFormError(reason instanceof Error ? reason.message : 'Could not save the message.');
    } finally {
      setSending(false);
    }
  };
  const sendEmail = async () => {
    setSending(true);
    setFormError('');
    setFormNotice('');
    try {
      await saveMessage();
      setFormNotice('Message saved for GAME PLAY. Opening your email app…');
      const subject = name.trim() ? `GAME PLAY enquiry from ${name.trim()}` : 'GAME PLAY website enquiry';
      window.location.href = mailTo(business.email, subject, buildMessage());
      setMessage('');
    } catch (reason) {
      setFormError(reason instanceof Error ? reason.message : 'Could not save the message.');
    } finally {
      setSending(false);
    }
  };
  const visitBlock = <>
    <SectionHeading title={full ? 'Visit GAME PLAY' : 'Your Local Gaming Destination'} />
    <div className="contact-grid">
      <div>
        <span className="eyebrow text-success">GAME PLAY · LAHORE</span>
        <h3 className="mt-3 text-2xl font-extrabold">Great games. Even better company.</h3>
        <div className="mt-5 flex items-center gap-3">
          <div className="flex gap-0.5 text-rating">{[1, 2, 3, 4, 5].map(s => <Star key={s} size={15} fill="currentColor" />)}</div>
          <strong>{reviewStats.rating}/5</strong>
          <button type="button" className="text-xs text-muted-foreground underline" onClick={onOpenReviews}>{reviewStats.count} customer reviews</button>
        </div>
        <div className="contact-detail"><MapPin /><div><strong>Find us</strong><p>{facts.address}</p></div></div>
        <div className="contact-detail"><Phone /><div><strong>Let's talk gaming</strong><p><a href={phoneLink(facts.phone)}>{facts.phone}</a></p></div></div>
        <div className="contact-detail"><MessageCircle /><div><strong>WhatsApp</strong><p><a href={ask('Hi GAME PLAY!')} target="_blank" rel="noreferrer">Chat on WhatsApp</a></p></div></div>
        <div className="contact-detail"><Clock3 /><div><strong className="text-success">Open · Closes at {facts.closingTime}</strong><p className="text-muted-foreground">Call to confirm today's opening hours.</p></div></div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button asChild variant="dark" size="sm"><a href={directions} target="_blank" rel="noreferrer">Get Directions <ArrowUpRight /></a></Button>
          <Button asChild variant="outline" size="sm"><a href={phoneLink(facts.phone)}>Call the Store <Phone /></a></Button>
          <Button asChild variant="shop" size="sm"><a href={ask('Hi GAME PLAY! I have a question.')} target="_blank" rel="noreferrer"><MessageCircle /> WhatsApp</a></Button>
        </div>
      </div>
      <iframe title="GAME PLAY location in Bahria Town Lahore" src={`https://maps.google.com/maps?q=${encodeURIComponent(facts.address)}&z=15&output=embed`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
    </div>
  </>;
  return <section id="contact" className="section store-container scroll-reveal">
    {full && <>
      <nav className="crumbs" aria-label="Breadcrumb"><Link to="/">Home</Link><span aria-hidden="true">/</span><span>Contact Us</span></nav>
      <div className="contact-form-panel is-first">
        <div className="section-heading"><h2>Send a message</h2></div>
        <p className="contact-form-lead">Ask about stock, prices, gift cards or anything else. Send on WhatsApp for the fastest reply, or open your email app.</p>
        <form className="contact-form" onSubmit={event => void sendWhatsApp(event)}>
          <label><span>Name</span><input name="name" autoComplete="name" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} disabled={sending} /></label>
          <label><span>Email</span><input name="email" type="email" autoComplete="email" placeholder="you@email.com" value={email} onChange={e => setEmail(e.target.value)} disabled={sending} /></label>
          <label><span>Phone</span><input name="phone" type="tel" autoComplete="tel" placeholder="03XX XXXXXXX" value={phone} onChange={e => setPhone(e.target.value)} disabled={sending} /></label>
          <label className="contact-form-message"><span>Your question</span><textarea name="message" rows={5} required placeholder="Ask about a product, gift card, store hours or anything else..." value={message} onChange={e => setMessage(e.target.value)} disabled={sending} /></label>
          <div className="contact-form-actions">
            <Button type="submit" variant="shop" disabled={sending}><MessageCircle /> {sending ? 'Saving…' : 'Send on WhatsApp'}</Button>
            <Button type="button" variant="outline" disabled={sending} onClick={() => void sendEmail()}>Send by Email <ArrowUpRight /></Button>
          </div>
          {formNotice && <p className="contact-form-ok">{formNotice}</p>}
          {formError && <p className="contact-form-error">{formError}</p>}
          <p className="gift-note">Your message is saved in the GAME PLAY admin panel. WhatsApp or email can still open so you can follow up with the store.</p>
        </form>
      </div>
      <div className="mt-8 border-t border-border pt-6">
        <h3 className="mb-2 text-lg font-bold">Customer Reviews</h3>
        <p className="mb-4 text-sm text-muted-foreground">Rated {reviewStats.rating} out of 5 by {reviewStats.count} Google reviews for GAME PLAY Bahria.</p>
        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="shop" onClick={onOpenReviews}>Read reviews</Button>
          <Button asChild variant="outline"><a href={directions} target="_blank" rel="noreferrer">Open Google Maps <ArrowUpRight /></a></Button>
        </div>
      </div>
      <div className="contact-visit-last">{visitBlock}</div>
    </>}
    {!full && visitBlock}
  </section>;
}
function Footer({ groups, facts, directions, ask, onOpenReviews }: { groups: CatalogGroup[]; facts: StoreFacts; directions: string; ask: (text: string) => string; onOpenReviews: () => void }) { return <footer className="footer"><div className="store-container footer-grid"><div><Brand /><p className="mt-5 max-w-xs">Your destination for consoles, games and gaming essentials. Built for players. Right here in Lahore.</p><a href={directions} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1">Find our store <ArrowUpRight size={12} /></a></div><div><h3>Shop GAME PLAY</h3>{groups.map(group => <Link className="block" key={group.name} to="/shop" search={shopSearch(group.name)}>{group.name}</Link>)}</div><div><h3>Explore</h3><Link className="block" to="/">Home</Link><Link className="block" to="/shop" search={shopSearch()}>Products</Link><Link className="block" to="/categories">Categories</Link><Link className="block" to="/shop" search={shopSearch('All', '', '', true)}>Special Offers</Link><Link className="block" to="/about">About Us</Link><Link className="block" to="/contact">Contact Us</Link><button type="button" className="block" onClick={onOpenReviews}>Customer Reviews</button></div><div><h3>Get in Touch</h3><p>{facts.address}</p><a className="mt-3 block" href={phoneLink(facts.phone)}>{facts.phone}</a><p>Closes at {facts.closingTime}</p><a className="mt-3 flex items-center gap-2" href={ask('Hi GAME PLAY!')} target="_blank" rel="noreferrer"><MessageCircle size={16} /> Chat on WhatsApp</a></div></div><div className="footer-bottom"><div className="store-container flex flex-wrap justify-between gap-3"><span>© {new Date().getFullYear()} GAME PLAY. All rights reserved.</span><span>Made for the love of gaming.</span></div></div></footer>; }