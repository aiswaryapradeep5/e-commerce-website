export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border bg-surface">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="font-display text-2xl uppercase tracking-tight">Axiom Store</div>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
            Objects for the systematic life. Curated tools for home, work, and movement, selected
            for durability and technical honesty.
          </p>
        </div>
        <div>
          <h4 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Shop
          </h4>
          <ul className="mt-4 space-y-2 text-sm">
            <li>All Objects</li>
            <li>New Arrivals</li>
            <li>Featured</li>
          </ul>
        </div>
        <div>
          <h4 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Support
          </h4>
          <ul className="mt-4 space-y-2 text-sm">
            <li>Shipping</li>
            <li>Returns</li>
            <li>Contact</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          <span>© {new Date().getFullYear()} Axiom Store</span>
          <span>Built on Lovable Cloud</span>
        </div>
      </div>
    </footer>
  );
}
