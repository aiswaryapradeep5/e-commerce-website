import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { listFeatured } from "@/lib/catalog.functions";
import { ProductCard } from "@/components/product-card";

const featuredQO = queryOptions({
  queryKey: ["featured"],
  queryFn: () => listFeatured(),
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Axiom Store — Precision Essentials" },
      {
        name: "description",
        content:
          "Curated catalog of precision-made electronics, apparel, home goods, and accessories. Built for durability.",
      },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(featuredQO),
  component: Index,
  errorComponent: ({ error }) => (
    <div className="p-12 text-center text-destructive">{error.message}</div>
  ),
  notFoundComponent: () => <div className="p-12 text-center">Not found.</div>,
});

function Index() {
  const { data: featured } = useSuspenseQuery(featuredQO);

  return (
    <>
      <header className="grid grid-cols-12 gap-8 border-b border-border px-6 py-20 lg:py-28">
        <div className="col-span-12 animate-reveal lg:col-span-8">
          <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            System 01 / Collection
          </p>
          <h1 className="mt-6 text-balance font-display text-6xl uppercase leading-[0.85] sm:text-7xl lg:text-[9rem]">
            Precision <br />
            <span className="text-primary">Essentials</span>
          </h1>
          <p className="mt-8 max-w-[48ch] text-pretty text-lg leading-relaxed text-muted-foreground">
            Objects for the systematic life. Curated tools for home, work, and movement, selected
            for durability and technical honesty.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              to="/shop"
              className="inline-flex items-center bg-foreground px-6 py-3 font-mono text-xs uppercase tracking-widest text-background transition-colors hover:bg-primary"
            >
              Shop the Catalog
            </Link>
            <Link
              to="/shop"
              className="inline-flex items-center border border-border px-6 py-3 font-mono text-xs uppercase tracking-widest transition-colors hover:border-foreground"
            >
              New Arrivals
            </Link>
          </div>
        </div>
        <div className="col-span-12 animate-reveal lg:col-span-4 [animation-delay:120ms]">
          <div className="relative aspect-[4/5] overflow-hidden bg-surface">
            {featured[0]?.image_url && (
              <img
                src={featured[0].image_url}
                alt={featured[0].name}
                className="size-full object-cover"
              />
            )}
            <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-background/80 mix-blend-difference">
                  Featured
                </p>
                <p className="mt-1 font-display text-2xl uppercase text-background mix-blend-difference">
                  {featured[0]?.name}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Index 01
              </p>
              <h2 className="mt-2 font-display text-4xl uppercase">Featured Objects</h2>
            </div>
            <Link
              to="/shop"
              className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-primary"
            >
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-x-6 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
