import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { z } from "zod";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { listCategories, listProducts } from "@/lib/catalog.functions";
import { ProductCard } from "@/components/product-card";

const searchSchema = z.object({
  q: fallback(z.string().max(120), "").default(""),
  cat: fallback(z.string().max(60), "").default(""),
  min: fallback(z.number().int().min(0).max(1_000_000).optional(), undefined),
  max: fallback(z.number().int().min(0).max(1_000_000).optional(), undefined),
  rating: fallback(z.number().min(0).max(5).optional(), undefined),
  sort: fallback(z.enum(["newest", "price_asc", "price_desc", "rating"]), "newest").default("newest"),
  page: fallback(z.number().int().min(1).max(500), 1).default(1),
});

type SearchParams = z.infer<typeof searchSchema>;

const categoriesQO = queryOptions({
  queryKey: ["categories"],
  queryFn: () => listCategories(),
});

const productsQO = (s: SearchParams) =>
  queryOptions({
    queryKey: ["products", s],
    queryFn: () =>
      listProducts({
        data: {
          search: s.q,
          categorySlug: s.cat,
          minPrice: s.min,
          maxPrice: s.max,
          minRating: s.rating,
          sort: s.sort,
          page: s.page,
          pageSize: 12,
        },
      }),
  });

export const Route = createFileRoute("/shop")({
  validateSearch: zodValidator(searchSchema),
  head: () => ({
    meta: [
      { title: "Shop — Axiom Store" },
      {
        name: "description",
        content:
          "Browse the full catalog. Filter by category, price, and rating. Search the entire inventory.",
      },
    ],
  }),
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) => {
    context.queryClient.ensureQueryData(categoriesQO);
    context.queryClient.ensureQueryData(productsQO(deps));
  },
  component: ShopPage,
  errorComponent: ({ error }) => (
    <div className="p-12 text-center text-destructive">{error.message}</div>
  ),
  notFoundComponent: () => <div className="p-12 text-center">Not found.</div>,
});

function ShopPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const { data: categories } = useSuspenseQuery(categoriesQO);
  const { data: result } = useSuspenseQuery(productsQO(search));

  const update = (patch: Partial<SearchParams>) =>
    navigate({ search: (prev: SearchParams) => ({ ...prev, ...patch, page: patch.page ?? 1 }) });

  return (
    <div className="grid grid-cols-12">
      <aside className="col-span-12 space-y-10 border-b border-border p-6 lg:col-span-3 lg:min-h-screen lg:border-b-0 lg:border-r">
        <section>
          <h3 className="mb-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Search
          </h3>
          <input
            type="search"
            defaultValue={search.q}
            placeholder="FIND OBJECTS..."
            onChange={(e) => update({ q: e.target.value })}
            className="w-full border-b border-input bg-transparent py-2 font-mono text-sm uppercase tracking-wider outline-none focus:border-primary"
          />
        </section>

        <section>
          <h3 className="mb-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Categories
          </h3>
          <div className="flex flex-col gap-2 text-sm">
            <button
              onClick={() => update({ cat: "" })}
              className={`text-left transition-colors hover:text-primary ${
                search.cat === "" ? "font-semibold text-primary" : ""
              }`}
            >
              All Objects
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => update({ cat: c.slug })}
                className={`text-left transition-colors hover:text-primary ${
                  search.cat === c.slug ? "font-semibold text-primary" : ""
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </section>

        <section>
          <h3 className="mb-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Price (USD)
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              placeholder="Min"
              defaultValue={search.min ? search.min / 100 : ""}
              onBlur={(e) =>
                update({ min: e.target.value ? Math.round(Number(e.target.value) * 100) : undefined })
              }
              className="border border-input bg-transparent px-2 py-1.5 font-mono text-sm"
            />
            <input
              type="number"
              placeholder="Max"
              defaultValue={search.max ? search.max / 100 : ""}
              onBlur={(e) =>
                update({ max: e.target.value ? Math.round(Number(e.target.value) * 100) : undefined })
              }
              className="border border-input bg-transparent px-2 py-1.5 font-mono text-sm"
            />
          </div>
        </section>

        <section>
          <h3 className="mb-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Min rating
          </h3>
          <div className="flex gap-2">
            {[0, 3, 4, 4.5].map((r) => (
              <button
                key={r}
                onClick={() => update({ rating: r === 0 ? undefined : r })}
                className={`border px-3 py-1 font-mono text-xs transition-colors ${
                  (search.rating ?? 0) === r
                    ? "border-foreground bg-foreground text-background"
                    : "border-input hover:border-foreground"
                }`}
              >
                {r === 0 ? "Any" : `${r}+`}
              </button>
            ))}
          </div>
        </section>

        <section>
          <h3 className="mb-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Sort
          </h3>
          <select
            value={search.sort}
            onChange={(e) => update({ sort: e.target.value as SearchParams["sort"] })}
            className="w-full border border-input bg-transparent px-2 py-1.5 font-mono text-xs uppercase tracking-wider"
          >
            <option value="newest">Newest</option>
            <option value="price_asc">Price: Low → High</option>
            <option value="price_desc">Price: High → Low</option>
            <option value="rating">Top Rated</option>
          </select>
        </section>

        <button
          onClick={() =>
            navigate({
              search: {
                q: "",
                cat: "",
                min: undefined,
                max: undefined,
                rating: undefined,
                sort: "newest",
                page: 1,
              },
            })
          }
          className="w-full border border-input py-2 font-mono text-[11px] uppercase tracking-widest hover:border-foreground"
        >
          Reset Filters
        </button>
      </aside>

      <div className="col-span-12 p-6 lg:col-span-9">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-5xl uppercase">Catalog</h1>
            <p className="mt-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Showing {result.products.length} of {result.total} objects
            </p>
          </div>
        </div>

        {result.products.length === 0 ? (
          <div className="border border-dashed border-border p-16 text-center font-mono text-sm uppercase tracking-wider text-muted-foreground">
            No objects match the current filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 xl:grid-cols-3">
            {result.products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}

        <Pagination
          page={search.page}
          totalPages={result.totalPages}
          onPage={(page) => update({ page })}
        />
      </div>
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  onPage,
}: {
  page: number;
  totalPages: number;
  onPage: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  const nums = Array.from({ length: totalPages }, (_, i) => i + 1);
  return (
    <footer className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-8 font-mono text-[11px] uppercase tracking-widest">
      <div className="text-muted-foreground">
        Page {page} of {totalPages}
      </div>
      <div className="flex items-center gap-6">
        <button
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          className="disabled:cursor-not-allowed disabled:opacity-30 hover:text-primary"
        >
          Prev
        </button>
        <div className="flex gap-4">
          {nums.map((n) => (
            <button
              key={n}
              onClick={() => onPage(n)}
              className={
                n === page
                  ? "text-foreground underline decoration-primary decoration-2 underline-offset-4"
                  : "text-muted-foreground hover:text-primary"
              }
            >
              {String(n).padStart(2, "0")}
            </button>
          ))}
        </div>
        <button
          disabled={page >= totalPages}
          onClick={() => onPage(page + 1)}
          className="disabled:cursor-not-allowed disabled:opacity-30 hover:text-primary"
        >
          Next
        </button>
      </div>
    </footer>
  );
}
