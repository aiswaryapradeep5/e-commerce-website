import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

function publicClient() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const listCategories = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const { data, error } = await sb
    .from("categories")
    .select("id, slug, name, sort_order")
    .order("sort_order");
  if (error) throw new Error(error.message);
  return data ?? [];
});

const listInput = z.object({
  search: z.string().trim().max(120).optional().default(""),
  categorySlug: z.string().trim().max(60).optional().default(""),
  minPrice: z.number().int().min(0).max(1_000_000).optional(),
  maxPrice: z.number().int().min(0).max(1_000_000).optional(),
  minRating: z.number().min(0).max(5).optional(),
  sort: z
    .enum(["newest", "price_asc", "price_desc", "rating"])
    .optional()
    .default("newest"),
  page: z.number().int().min(1).max(500).optional().default(1),
  pageSize: z.number().int().min(1).max(48).optional().default(12),
});

export const listProducts = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => listInput.parse(d))
  .handler(async ({ data }) => {
    const sb = publicClient();
    let q = sb
      .from("products")
      .select(
        "id, slug, name, description, price_cents, image_url, rating, stock, is_new, is_featured, category:categories(slug, name)",
        { count: "exact" },
      );

    if (data.search) {
      const s = data.search.replace(/[%_]/g, "");
      q = q.or(`name.ilike.%${s}%,description.ilike.%${s}%`);
    }
    if (data.categorySlug) {
      const { data: cat } = await sb
        .from("categories")
        .select("id")
        .eq("slug", data.categorySlug)
        .maybeSingle();
      if (cat) q = q.eq("category_id", cat.id);
    }
    if (data.minPrice != null) q = q.gte("price_cents", data.minPrice);
    if (data.maxPrice != null) q = q.lte("price_cents", data.maxPrice);
    if (data.minRating != null) q = q.gte("rating", data.minRating);

    switch (data.sort) {
      case "price_asc":
        q = q.order("price_cents", { ascending: true });
        break;
      case "price_desc":
        q = q.order("price_cents", { ascending: false });
        break;
      case "rating":
        q = q.order("rating", { ascending: false });
        break;
      default:
        q = q.order("created_at", { ascending: false });
    }

    const from = (data.page - 1) * data.pageSize;
    const to = from + data.pageSize - 1;
    q = q.range(from, to);

    const { data: rows, error, count } = await q;
    if (error) throw new Error(error.message);
    return {
      products: rows ?? [],
      total: count ?? 0,
      page: data.page,
      pageSize: data.pageSize,
      totalPages: Math.max(1, Math.ceil((count ?? 0) / data.pageSize)),
    };
  });

export const getProductBySlug = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ slug: z.string().trim().min(1).max(120) }).parse(d))
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: product, error } = await sb
      .from("products")
      .select(
        "id, slug, name, description, price_cents, image_url, rating, stock, is_new, is_featured, category:categories(slug, name)",
      )
      .eq("slug", data.slug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!product) return null;

    const { data: related } = await sb
      .from("products")
      .select("id, slug, name, price_cents, image_url, rating")
      .neq("slug", data.slug)
      .limit(4);

    return { product, related: related ?? [] };
  });

export const listFeatured = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const { data, error } = await sb
    .from("products")
    .select("id, slug, name, price_cents, image_url, rating, is_new, category:categories(name)")
    .eq("is_featured", true)
    .limit(6);
  if (error) throw new Error(error.message);
  return data ?? [];
});
