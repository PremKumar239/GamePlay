import { Link } from '@tanstack/react-router';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { money, shopSearch, type Product } from '@/lib/store';

type ShowcaseFilter = {
  label: string;
  group: string;
  sub: string;
  match: (product: Product) => boolean;
};

const isGame = (product: Product) => product.subcategory === 'Games' || product.category === 'Games';
const isSimOrControllerAccessory = (name: string) => /racing wheel|handbrake|shifter|playseat|driving force|steering wheel|wheel stand|pedal|cockpit|silicone cover|silicone case|controller grip|charging dock|storage stand/i.test(name);
export const isShowcaseController = (product: Product) => {
  const name = product.name;
  if (isSimOrControllerAccessory(name)) return false;
  return /dualsense|dualshock|gamepad|joy-?con|fighting stick|fight stick|all-button controller|victrix|\bcontroller\b/i.test(name);
};
const isPs4 = (product: Product) => /ps4|playstation 4|dualshock/i.test(product.name);
const isPs4Controller = (product: Product) => /dualshock|playstation 4|\bps4\b/i.test(product.name) && !/dualsense|playstation 5|\bps5\b/i.test(product.name);

const gameFilters: ShowcaseFilter[] = [
  { label: 'PlayStation 5 Games', group: 'PlayStation', sub: 'Games', match: product => isGame(product) && product.group === 'PlayStation' && !isPs4(product) },
  { label: 'PlayStation 4 Games', group: 'PlayStation', sub: 'Games', match: product => isGame(product) && isPs4(product) },
  { label: 'Nintendo Switch Games', group: 'Nintendo', sub: 'Games', match: product => isGame(product) && product.group === 'Nintendo' },
];

const controllerFilters: ShowcaseFilter[] = [
  { label: 'PS5 Controllers', group: 'PlayStation', sub: 'Controllers', match: product => isShowcaseController(product) && product.group === 'PlayStation' && !isPs4Controller(product) },
  { label: 'Xbox Controllers', group: 'Xbox', sub: 'Controllers', match: product => isShowcaseController(product) && (product.group === 'Xbox' || /xbox/i.test(product.name)) && !/playstation|dualsense|dualshock|\bps5\b|\bps4\b/i.test(product.name) },
  { label: 'PS4 Controllers', group: 'PlayStation', sub: 'Controllers', match: product => isShowcaseController(product) && isPs4Controller(product) },
];

export function HomeShowcases({ products }: { products: Product[] }) {
  return (
    <>
      <Showcase title="Games Section" filters={gameFilters} products={products} viewAll />
      <Showcase title="Controllers Section" filters={controllerFilters} products={products} />
    </>
  );
}

function Showcase({ title, filters, products, viewAll = false }: { title: string; filters: ShowcaseFilter[]; products: Product[]; viewAll?: boolean }) {
  const [filterIndex, setFilterIndex] = useState(0);
  const [index, setIndex] = useState(0);
  const filter = filters[filterIndex] ?? filters[0];
  const items = useMemo(() => (filter ? products.filter(filter.match) : []), [products, filter]);
  const count = items.length;
  const current = count ? items[index % count] : undefined;
  const previous = count > 1 ? items[(index - 1 + count) % count] : undefined;
  const next = count > 1 ? items[(index + 1) % count] : undefined;

  function chooseFilter(nextFilter: number) {
    setFilterIndex(nextFilter);
    setIndex(0);
  }

  function step(direction: number) {
    if (count < 2) return;
    setIndex(value => (value + direction + count) % count);
  }

  if (!filter) return null;

  return (
    <section className="showcase" aria-label={title}>
      <div className="store-container showcase-inner">
        <h2>{title}</h2>
        <div className="showcase-filters" role="tablist" aria-label={`${title} categories`}>
          {filters.map((item, itemIndex) => (
            <button key={item.label} type="button" role="tab" aria-selected={itemIndex === filterIndex} className={itemIndex === filterIndex ? 'is-active' : ''} onClick={() => chooseFilter(itemIndex)}>{item.label}</button>
          ))}
        </div>
        <div className="showcase-stage">
          <div className="showcase-shape" aria-hidden="true" />
          {current ? (
            <div className="showcase-row">
              {previous ? <ProductSlide product={previous} place="side" onSelect={() => step(-1)} /> : <span className="showcase-spacer" />}
              <ProductSlide product={current} place="center" />
              {next ? <ProductSlide product={next} place="side" onSelect={() => step(1)} /> : <span className="showcase-spacer" />}
            </div>
          ) : <p className="showcase-empty">No {filter.label} in the catalog yet.</p>}
        </div>
        {current && (
          <div className="showcase-meta">
            <h3>{current.name}</h3>
            <p>{money(current.price)}</p>
          </div>
        )}
        <div className="showcase-actions">
          <button type="button" className="showcase-arrow" aria-label={`Previous ${title} product`} disabled={count < 2} onClick={() => step(-1)}><ChevronLeft size={18} /></button>
          {current ? <Button asChild variant="shop"><Link to="/product/$productId" params={{ productId: String(current.id) }}>Shop now</Link></Button> : <Button variant="shop" disabled>Shop now</Button>}
          <button type="button" className="showcase-arrow" aria-label={`Next ${title} product`} disabled={count < 2} onClick={() => step(1)}><ChevronRight size={18} /></button>
        </div>
        {viewAll && <Link className="showcase-view" to="/shop" search={shopSearch(filter.group, filter.sub)}>View all</Link>}
      </div>
    </section>
  );
}

function ProductSlide({ product, place, onSelect }: { product: Product; place: 'side' | 'center'; onSelect?: () => void }) {
  const image = <img src={product.image} alt={place === 'center' ? product.name : ''} width={280} height={280} />;
  if (!onSelect) return <div className={`showcase-card is-${place}`}>{image}</div>;
  return <button type="button" className={`showcase-card is-${place}`} aria-label={`Show ${product.name}`} onClick={onSelect}>{image}</button>;
}
