import { Link } from "@tanstack/react-router";
import { ShoppingBag, User } from "lucide-react";
import { useCart } from "@/lib/cart";

export function SiteHeader() {
  const { count } = useCart();
  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="font-display text-2xl uppercase tracking-tight">
          Axiom Store
        </Link>
        <div className="hidden gap-8 text-sm font-medium uppercase tracking-wider md:flex">
          <Link to="/" className="transition-colors hover:text-primary [&.active]:text-primary" activeOptions={{ exact: true }}>
            Home
          </Link>
          <Link to="/shop" className="transition-colors hover:text-primary [&.active]:text-primary">
            Shop
          </Link>
          <Link to="/orders" className="transition-colors hover:text-primary [&.active]:text-primary">
            Orders
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/auth"
            className="hidden items-center gap-2 rounded-sm border border-border px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest text-muted-foreground transition-colors hover:border-foreground hover:text-foreground sm:flex"
          >
            <User className="size-3.5" />
            Account
          </Link>
          <Link
            to="/cart"
            className="flex items-center gap-2 bg-foreground px-3 py-2 font-mono text-[11px] uppercase tracking-widest text-background transition-colors hover:bg-primary"
          >
            <ShoppingBag className="size-3.5" />
            Cart ({count})
          </Link>
        </div>
      </div>
    </nav>
  );
}
