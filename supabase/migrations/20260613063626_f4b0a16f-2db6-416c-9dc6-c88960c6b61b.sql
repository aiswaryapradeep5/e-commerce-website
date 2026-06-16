
-- Categories
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories are publicly readable" ON public.categories FOR SELECT USING (true);

-- Products
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  price_cents int NOT NULL CHECK (price_cents >= 0),
  image_url text,
  rating numeric(2,1) NOT NULL DEFAULT 4.5 CHECK (rating >= 0 AND rating <= 5),
  stock int NOT NULL DEFAULT 100,
  is_featured boolean NOT NULL DEFAULT false,
  is_new boolean NOT NULL DEFAULT false,
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX products_category_idx ON public.products(category_id);
CREATE INDEX products_price_idx ON public.products(price_cents);
CREATE INDEX products_created_idx ON public.products(created_at DESC);
CREATE INDEX products_name_trgm_idx ON public.products USING gin (to_tsvector('english', name || ' ' || description));
GRANT SELECT ON public.products TO anon, authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Products are publicly readable" ON public.products FOR SELECT USING (true);

-- Profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles readable by owner" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Profiles updatable by owner" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Profiles insertable by owner" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (new.id, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Orders
CREATE TYPE public.order_status AS ENUM ('pending', 'paid', 'shipped', 'cancelled');

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.order_status NOT NULL DEFAULT 'pending',
  total_cents int NOT NULL CHECK (total_cents >= 0),
  ship_name text NOT NULL,
  ship_email text NOT NULL,
  ship_address text NOT NULL,
  ship_city text NOT NULL,
  ship_postal text NOT NULL,
  ship_country text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX orders_user_idx ON public.orders(user_id, created_at DESC);
GRANT SELECT, INSERT ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Orders readable by owner" ON public.orders FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Orders insertable by owner" ON public.orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Order items
CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity int NOT NULL CHECK (quantity > 0),
  unit_price_cents int NOT NULL CHECK (unit_price_cents >= 0),
  product_name text NOT NULL
);
CREATE INDEX order_items_order_idx ON public.order_items(order_id);
GRANT SELECT, INSERT ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Order items readable by owner" ON public.order_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()));
CREATE POLICY "Order items insertable by owner" ON public.order_items FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()));

-- Seed categories
INSERT INTO public.categories (slug, name, sort_order) VALUES
  ('electronics', 'Electronics', 1),
  ('apparel', 'Apparel', 2),
  ('home', 'Home', 3),
  ('accessories', 'Accessories', 4),
  ('outdoor', 'Outdoor', 5),
  ('stationery', 'Stationery', 6);

-- Seed products
WITH c AS (SELECT slug, id FROM public.categories)
INSERT INTO public.products (slug, name, description, price_cents, image_url, rating, stock, is_featured, is_new, category_id)
VALUES
  ('system-one-headphones', 'System One Headphones', 'Studio-grade over-ear headphones with titanium drivers and a 40-hour battery.', 34000, 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&q=80', 4.8, 42, true, true, (SELECT id FROM c WHERE slug='electronics')),
  ('field-camera-mk2', 'Field Camera Mk II', 'Compact rangefinder with a sharp 35mm prime and weather sealing.', 129000, 'https://images.unsplash.com/photo-1606986628253-49a1c3acaa49?w=800&q=80', 4.9, 12, true, false, (SELECT id FROM c WHERE slug='electronics')),
  ('mech-keyboard-65', 'Mech Keyboard 65', 'Aluminum tenkeyless mechanical keyboard with hot-swap switches.', 18500, 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80', 4.7, 88, false, true, (SELECT id FROM c WHERE slug='electronics')),
  ('signal-speaker', 'Signal Bookshelf Speaker', 'A pair of compact bookshelf speakers tuned for nearfield listening.', 89000, 'https://images.unsplash.com/photo-1612444530582-fc66183b16f3?w=800&q=80', 4.6, 15, false, false, (SELECT id FROM c WHERE slug='electronics')),
  ('architect-base-layer', 'Architect Base Layer', 'Heavyweight 320gsm organic cotton tee. Boxy fit, raw hem.', 8500, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80', 4.5, 200, true, false, (SELECT id FROM c WHERE slug='apparel')),
  ('utility-shell-jacket', 'Utility Shell Jacket', '3-layer waterproof shell with sealed seams and a hood.', 32000, 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&q=80', 4.7, 60, false, true, (SELECT id FROM c WHERE slug='apparel')),
  ('field-trouser-08', 'Field Trouser 08', 'Cropped tapered trouser in a midweight ripstop. Olive.', 14500, 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800&q=80', 4.4, 110, false, false, (SELECT id FROM c WHERE slug='apparel')),
  ('terrain-runner', 'Terrain Runner', 'All-day trainer with a recycled mesh upper.', 16500, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80', 4.6, 75, true, false, (SELECT id FROM c WHERE slug='apparel')),
  ('laboratory-pitcher', 'Laboratory Pitcher', 'Borosilicate glass pitcher inspired by chemistry glassware.', 12000, 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=800&q=80', 4.8, 80, true, false, (SELECT id FROM c WHERE slug='home')),
  ('linear-task-light', 'Linear Task Light', 'Cantilevered desk lamp in matte anodized aluminum.', 21000, 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&q=80', 4.7, 35, false, true, (SELECT id FROM c WHERE slug='home')),
  ('volume-vase', 'Volume Vase', 'Hand-thrown stoneware vase. Each piece is unique.', 9500, 'https://images.unsplash.com/photo-1612196808214-b7e239e5d5e8?w=800&q=80', 4.5, 50, false, false, (SELECT id FROM c WHERE slug='home')),
  ('stack-storage-bin', 'Stack Storage Bin', 'Powder-coated steel bin, stacks three-high.', 6500, 'https://images.unsplash.com/photo-1567016376408-0226e4d0c1ea?w=800&q=80', 4.3, 220, false, false, (SELECT id FROM c WHERE slug='home')),
  ('titan-vessel-01', 'Titan Vessel 01', 'Single-wall titanium bottle. Light, indestructible.', 8500, 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&q=80', 4.9, 140, true, false, (SELECT id FROM c WHERE slug='accessories')),
  ('iso-chronometer', 'Iso Chronometer', 'Brushed stainless mechanical desk clock.', 14500, 'https://images.unsplash.com/photo-1495856458515-0637185db551?w=800&q=80', 4.6, 30, false, true, (SELECT id FROM c WHERE slug='accessories')),
  ('module-wallet', 'Module Wallet', 'Slim bifold in vegetable-tanned leather.', 7500, 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&q=80', 4.5, 180, false, false, (SELECT id FROM c WHERE slug='accessories')),
  ('aperture-sunglasses', 'Aperture Sunglasses', 'Acetate frames with polarized lenses.', 11500, 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&q=80', 4.7, 95, true, false, (SELECT id FROM c WHERE slug='accessories')),
  ('expedition-pack-30', 'Expedition Pack 30L', 'Roll-top backpack in waxed cotton.', 18500, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80', 4.8, 55, true, false, (SELECT id FROM c WHERE slug='outdoor')),
  ('cinder-thermos', 'Cinder Thermos 1L', 'Double-wall vacuum thermos. 24-hour heat retention.', 5500, 'https://images.unsplash.com/photo-1614642264762-d0a3b8bf3700?w=800&q=80', 4.6, 200, false, false, (SELECT id FROM c WHERE slug='outdoor')),
  ('granite-tent-2', 'Granite Tent 2', 'Two-person freestanding tent. 2.1 kg packed.', 48000, 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&q=80', 4.7, 18, false, true, (SELECT id FROM c WHERE slug='outdoor')),
  ('summit-multi-tool', 'Summit Multi-Tool', '14-function tool in stainless steel.', 6500, 'https://images.unsplash.com/photo-1591375275624-c2b35a9efe7d?w=800&q=80', 4.5, 160, false, false, (SELECT id FROM c WHERE slug='outdoor')),
  ('grid-notebook-a5', 'Grid Notebook A5', 'Smyth-sewn notebook with 160 5mm dot-grid pages.', 2400, 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=800&q=80', 4.8, 500, true, false, (SELECT id FROM c WHERE slug='stationery')),
  ('mark-pen-fine', 'Mark Pen Fine', 'Brass-bodied rollerball with a 0.5mm tip.', 4500, 'https://images.unsplash.com/photo-1583485088034-697b5bc36b92?w=800&q=80', 4.6, 320, false, false, (SELECT id FROM c WHERE slug='stationery')),
  ('archive-folder-set', 'Archive Folder Set', 'Six manila folders with reinforced edges.', 2200, 'https://images.unsplash.com/photo-1568208211648-110ed7d33d50?w=800&q=80', 4.4, 280, false, false, (SELECT id FROM c WHERE slug='stationery')),
  ('desk-tray-monolith', 'Desk Tray Monolith', 'Machined aluminum desk tray.', 8500, 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800&q=80', 4.7, 90, false, true, (SELECT id FROM c WHERE slug='stationery'));
