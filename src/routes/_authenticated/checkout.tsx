import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import { createOrder } from "@/lib/orders.functions";

export const Route = createFileRoute("/_authenticated/checkout")({
  head: () => ({ meta: [{ title: "Checkout — Axiom Store" }] }),
  component: CheckoutPage,
});

const formSchema = z.object({
  name: z.string().trim().min(1, "Required").max(120),
  email: z.string().trim().email("Invalid email").max(255),
  address: z.string().trim().min(1, "Required").max(255),
  city: z.string().trim().min(1, "Required").max(120),
  postal: z.string().trim().min(1, "Required").max(20),
  country: z.string().trim().min(2, "Required").max(60),
});

function CheckoutPage() {
  const { items, subtotalCents, clear } = useCart();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const createOrderFn = useServerFn(createOrder);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: (input: z.infer<typeof formSchema>) =>
      createOrderFn({
        data: {
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
          shipping: input,
        },
      }),
    onSuccess: (res) => {
      clear();
      qc.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Order placed!");
      navigate({ to: "/orders", search: { placed: res.orderId } as never });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Order failed"),
  });

  if (items.length === 0 && !mutation.isPending) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h1 className="font-display text-5xl uppercase">Nothing to check out</h1>
        <Link
          to="/shop"
          className="mt-8 inline-flex bg-foreground px-6 py-3 font-mono text-xs uppercase tracking-widest text-background hover:bg-primary"
        >
          Back to catalog
        </Link>
      </div>
    );
  }

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    const parsed = formSchema.safeParse(data);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => {
        errs[String(i.path[0])] = i.message;
      });
      setErrors(errs);
      return;
    }
    setErrors({});
    mutation.mutate(parsed.data);
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="font-display text-5xl uppercase">Checkout</h1>

      <div className="mt-10 grid grid-cols-12 gap-10">
        <form onSubmit={onSubmit} className="col-span-12 space-y-4 lg:col-span-7">
          <h2 className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            Shipping
          </h2>
          {[
            { name: "name", label: "Full name", type: "text" },
            { name: "email", label: "Email", type: "email" },
            { name: "address", label: "Address", type: "text" },
            { name: "city", label: "City", type: "text" },
            { name: "postal", label: "Postal code", type: "text" },
            { name: "country", label: "Country", type: "text" },
          ].map((f) => (
            <div key={f.name}>
              <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {f.label}
              </label>
              <input
                name={f.name}
                type={f.type}
                required
                className="mt-1 w-full border border-input bg-transparent px-3 py-2"
              />
              {errors[f.name] && (
                <p className="mt-1 text-xs text-destructive">{errors[f.name]}</p>
              )}
            </div>
          ))}

          <button
            type="submit"
            disabled={mutation.isPending}
            className="mt-6 w-full bg-foreground px-6 py-3 font-mono text-xs uppercase tracking-widest text-background hover:bg-primary disabled:opacity-50"
          >
            {mutation.isPending ? "Placing order…" : `Place Order — ${formatPrice(subtotalCents)}`}
          </button>
          <p className="text-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Demo checkout · no payment captured
          </p>
        </form>

        <aside className="col-span-12 lg:col-span-5">
          <div className="border border-border bg-surface p-6">
            <h2 className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              Order
            </h2>
            <ul className="mt-4 divide-y divide-border">
              {items.map((it) => (
                <li key={it.productId} className="flex justify-between py-3 text-sm">
                  <span className="truncate uppercase">
                    {it.name}{" "}
                    <span className="font-mono text-xs text-muted-foreground">× {it.quantity}</span>
                  </span>
                  <span className="font-mono">{formatPrice(it.priceCents * it.quantity)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex justify-between border-t border-border pt-4 text-base font-medium">
              <span>Total</span>
              <span className="font-mono">{formatPrice(subtotalCents)}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
