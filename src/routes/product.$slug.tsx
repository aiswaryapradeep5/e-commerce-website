import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { getProductBySlug } from "@/lib/catalog.functions";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/lib/cart";
import { ProductCard } from "@/components/product-card";

const detailQO = (slug: string) =>
  queryOptions({
    queryKey: ["product", slug],
    queryFn: () => getProductBySlug({ data: { slug } }),
  });

export const Route = createFileRoute("/product/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug.replace(/-/g, " ")} — Axiom Store` },
      { name: "description", content: "Product detail and specifications." },
    ],
  }),
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(detailQO(params.slug));
    if (!data) throw notFound();
  },
  component: ProductDetail,
  errorComponent: ({ error }) => (
    <div className="p-12 text-center text-destructive">{error.message}</div>
  ),
  notFoundComponent: () => (
    <div className="p-12 text-center font-mono uppercase">Product not found.</div>
  ),
});

function ProductDetail() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(detailQO(slug));
  const navigate = useNavigate();
  const { add } = useCart();
  const [qty, setQty] = useState(1);

  if (!data) return null;
  const { product, related } = data;

  return (
    <article className="mx-auto max-w-7xl px-6 py-12">
      <div className="grid grid-cols-12 gap-10">
        <div className="col-span-12 lg:col-span-7">
          <div className="aspect-[4/5] overflow-hidden bg-surface">
            {product.image_url && (
              <img src={product.image_url} alt={product.name} className="size-full object-cover" />
            )}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-5">
          <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            {product.category?.name ?? "Object"} · ★ {Number(product.rating).toFixed(1)}
          </p>
          <h1 className="mt-3 font-display text-5xl uppercase leading-none">{product.name}</h1>
          <p className="mt-5 font-mono text-2xl tracking-tight">
            {formatPrice(product.price_cents)}
          </p>
          <p className="mt-8 leading-relaxed text-muted-foreground">{product.description}</p>

          <div className="mt-10 flex items-stretch gap-3">
            <div className="flex items-center border border-input">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="px-4 py-3 font-mono hover:bg-accent"
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="w-10 text-center font-mono">{qty}</span>
              <button
                onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                className="px-4 py-3 font-mono hover:bg-accent"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
            <button
              onClick={() => {
                add(
                  {
                    productId: product.id,
                    slug: product.slug,
                    name: product.name,
                    priceCents: product.price_cents,
                    imageUrl: product.image_url,
                  },
                  qty,
                );
                toast.success(`${product.name} added to cart`);
              }}
              className="flex-1 bg-foreground px-6 py-3 font-mono text-xs uppercase tracking-widest text-background transition-colors hover:bg-primary"
            >
              Add to Cart
            </button>
          </div>

          <button
            onClick={() => {
              add(
                {
                  productId: product.id,
                  slug: product.slug,
                  name: product.name,
                  priceCents: product.price_cents,
                  imageUrl: product.image_url,
                },
                qty,
              );
              navigate({ to: "/checkout" });
            }}
            className="mt-3 w-full border border-foreground px-6 py-3 font-mono text-xs uppercase tracking-widest transition-colors hover:bg-foreground hover:text-background"
          >
            Buy Now
          </button>

          <dl className="mt-12 space-y-3 border-t border-border pt-8 font-mono text-xs uppercase tracking-wider">
            <div className="flex justify-between text-muted-foreground">
              <dt>SKU</dt>
              <dd>{product.slug}</dd>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <dt>In stock</dt>
              <dd>{product.stock} units</dd>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <dt>Shipping</dt>
              <dd>3–5 business days</dd>
            </div>
          </dl>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-24 border-t border-border pt-12">
          <h2 className="mb-8 font-display text-3xl uppercase">You might also like</h2>
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      <div className="mt-12">
        <Link
          to="/shop"
          className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-primary"
        >
          ← Back to catalog
        </Link>
      </div>
    </article>
  );
}
