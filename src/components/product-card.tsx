import { Link } from "@tanstack/react-router";
import { formatPrice } from "@/lib/format";

type Props = {
  product: {
    slug: string;
    name: string;
    price_cents: number;
    image_url: string | null;
    rating?: number;
    is_new?: boolean;
    category?: { name: string } | null;
  };
};

export function ProductCard({ product }: Props) {
  return (
    <Link
      to="/product/$slug"
      params={{ slug: product.slug }}
      className="group block"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-surface">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            className="size-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.04]"
          />
        ) : (
          <div className="size-full" />
        )}
        {product.is_new && (
          <div className="absolute left-3 top-3 bg-primary px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-primary-foreground">
            New
          </div>
        )}
      </div>
      <div className="mt-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h4 className="truncate text-sm font-medium uppercase">{product.name}</h4>
          {product.category && (
            <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              {product.category.name}
            </p>
          )}
        </div>
        <span className="shrink-0 font-mono text-sm tracking-tight">
          {formatPrice(product.price_cents)}
        </span>
      </div>
    </Link>
  );
}
