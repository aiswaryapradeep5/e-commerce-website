import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const itemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).max(99),
});

const checkoutSchema = z.object({
  items: z.array(itemSchema).min(1).max(50),
  shipping: z.object({
    name: z.string().trim().min(1).max(120),
    email: z.string().trim().email().max(255),
    address: z.string().trim().min(1).max(255),
    city: z.string().trim().min(1).max(120),
    postal: z.string().trim().min(1).max(20),
    country: z.string().trim().min(2).max(60),
  }),
});

export const createOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => checkoutSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Re-fetch prices server-side so the client cannot tamper with totals.
    const ids = data.items.map((i) => i.productId);
    const { data: products, error: pErr } = await supabase
      .from("products")
      .select("id, name, price_cents, stock")
      .in("id", ids);
    if (pErr) throw new Error(pErr.message);
    if (!products || products.length !== ids.length) {
      throw new Error("Some products are no longer available");
    }

    let total = 0;
    const enriched = data.items.map((it) => {
      const p = products.find((x) => x.id === it.productId)!;
      if (it.quantity > p.stock) throw new Error(`Insufficient stock for ${p.name}`);
      total += p.price_cents * it.quantity;
      return {
        product_id: p.id,
        product_name: p.name,
        quantity: it.quantity,
        unit_price_cents: p.price_cents,
      };
    });

    const { data: order, error: oErr } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        status: "paid",
        total_cents: total,
        ship_name: data.shipping.name,
        ship_email: data.shipping.email,
        ship_address: data.shipping.address,
        ship_city: data.shipping.city,
        ship_postal: data.shipping.postal,
        ship_country: data.shipping.country,
      })
      .select("id")
      .single();
    if (oErr || !order) throw new Error(oErr?.message ?? "Failed to create order");

    const { error: iErr } = await supabase
      .from("order_items")
      .insert(enriched.map((e) => ({ ...e, order_id: order.id })));
    if (iErr) throw new Error(iErr.message);

    return { orderId: order.id, totalCents: total };
  });

export const listMyOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("orders")
      .select(
        "id, status, total_cents, created_at, ship_city, ship_country, order_items(quantity, product_name, unit_price_cents)",
      )
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });
