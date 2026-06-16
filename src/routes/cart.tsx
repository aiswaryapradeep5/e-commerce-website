import { createFileRoute, Link } from "@tanstack/react-router";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import { Trash2 } from "lucide-react";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Cart — Axiom Store" },
      { name: "description", content: "Review the objects in your cart." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { items, subtotalCents, setQty, remove } = useCart();

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h1 className="font-display text-5xl uppercase">Cart is empty</h1>
        <p className="mt-4 text-muted-foreground">Start browsing the catalog to add objects.</p>
        <Link
          to="/shop"
          className="mt-8 inline-flex items-center bg-foreground px-6 py-3 font-mono text-xs uppercase tracking-widest text-background hover:bg-primary"
        >
          Browse Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="font-display text-5xl uppercase">Your Cart</h1>

      <div className="mt-10 grid grid-cols-12 gap-10">
        <ul className="col-span-12 divide-y divide-border border-y border-border lg:col-span-8">
          {items.map((it) => (
            <li key={it.productId} className="grid grid-cols-12 gap-4 py-6">
              <div className="col-span-3 aspect-square overflow-hidden bg-surface sm:col-span-2">
                {it.imageUrl && (
                  <img src={it.imageUrl} alt={it.name} className="size-full object-cover" />
                )}
              </div>
              <div className="col-span-9 flex flex-col justify-between sm:col-span-10 sm:flex-row sm:items-center">
                <div className="min-w-0">
                  <Link
                    to="/product/$slug"
                    params={{ slug: it.slug }}
                    className="text-sm font-medium uppercase hover:text-primary"
                  >
                    {it.name}
                  </Link>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    {formatPrice(it.priceCents)} each
                  </p>
                </div>
                <div className="mt-4 flex items-center gap-4 sm:mt-0">
                  <div className="flex items-center border border-input">
                    <button onClick={() => setQty(it.productId, it.quantity - 1)} className="px-3 py-1.5 font-mono">−</button>
                    <span className="w-8 text-center font-mono text-sm">{it.quantity}</span>
                    <button onClick={() => setQty(it.productId, it.quantity + 1)} className="px-3 py-1.5 font-mono">+</button>
                  </div>
                  <span className="w-24 text-right font-mono text-sm">
                    {formatPrice(it.priceCents * it.quantity)}
                  </span>
                  <button
                    onClick={() => remove(it.productId)}
                    aria-label="Remove"
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="col-span-12 lg:col-span-4">
          <div className="border border-border bg-surface p-6">
            <h2 className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              Summary
            </h2>
            <dl className="mt-6 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="font-mono">{formatPrice(subtotalCents)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Shipping</dt>
                <dd className="font-mono">Calculated next</dd>
              </div>
              <div className="flex justify-between border-t border-border pt-3 text-base font-medium">
                <dt>Total</dt>
                <dd className="font-mono">{formatPrice(subtotalCents)}</dd>
              </div>
            </dl>
            <Link
              to="/checkout"
              className="mt-6 flex w-full items-center justify-center bg-foreground px-6 py-3 font-mono text-xs uppercase tracking-widest text-background hover:bg-primary"
            >
              Proceed to Checkout
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
