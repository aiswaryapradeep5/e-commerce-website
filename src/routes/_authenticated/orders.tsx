import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect } from "react";
import { z } from "zod";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { toast } from "sonner";
import { listMyOrders } from "@/lib/orders.functions";
import { formatPrice } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";

const searchSchema = z.object({
  placed: fallback(z.string().optional(), undefined),
});

export const Route = createFileRoute("/_authenticated/orders")({
  validateSearch: zodValidator(searchSchema),
  head: () => ({ meta: [{ title: "Your Orders — Axiom Store" }] }),
  component: OrdersPage,
});

function OrdersPage() {
  const { placed } = Route.useSearch();
  const fetchOrders = useServerFn(listMyOrders);

  const qo = queryOptions({
    queryKey: ["orders"],
    queryFn: () => fetchOrders(),
  });

  const { data: orders } = useSuspenseQuery(qo);

  useEffect(() => {
    if (placed) toast.success("Thanks! Your order has been recorded.");
  }, [placed]);

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-5xl uppercase">Orders</h1>
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            toast("Signed out");
          }}
          className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-primary"
        >
          Sign out
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="mt-10 border border-dashed border-border p-16 text-center font-mono text-sm uppercase tracking-wider text-muted-foreground">
          No orders yet.{" "}
          <Link to="/shop" className="text-primary">
            Start shopping →
          </Link>
        </div>
      ) : (
        <ul className="mt-10 space-y-6">
          {orders.map((o) => (
            <li key={o.id} className="border border-border bg-surface p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    Order · {o.id.slice(0, 8)}
                  </p>
                  <p className="mt-1 font-display text-2xl uppercase">
                    {new Date(o.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {o.status}
                  </p>
                  <p className="mt-1 font-mono text-lg">{formatPrice(o.total_cents)}</p>
                </div>
              </div>
              <ul className="mt-4 divide-y divide-border border-t border-border">
                {o.order_items.map((it, i) => (
                  <li key={i} className="flex justify-between py-2 text-sm">
                    <span className="uppercase">
                      {it.product_name}{" "}
                      <span className="font-mono text-xs text-muted-foreground">
                        × {it.quantity}
                      </span>
                    </span>
                    <span className="font-mono">
                      {formatPrice(it.unit_price_cents * it.quantity)}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                Ships to {o.ship_city}, {o.ship_country}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
