-- Products Table for Affiliate Cards
-- Use {{product:slug}} in blog posts to embed product cards

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  price TEXT,
  badge TEXT,
  description TEXT,
  features TEXT[], -- Array of feature strings
  image TEXT, -- Amazon product image URL
  affiliate_link TEXT NOT NULL, -- Amazon affiliate URL
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster slug lookups
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Public can view active products
CREATE POLICY "Public can view active products"
  ON products FOR SELECT
  USING (is_active = true);

-- Admin policies (open for now, add auth later)
CREATE POLICY "Admin can view all products"
  ON products FOR SELECT
  USING (true);

CREATE POLICY "Admin can create products"
  ON products FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admin can update products"
  ON products FOR UPDATE
  USING (true);

CREATE POLICY "Admin can delete products"
  ON products FOR DELETE
  USING (true);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_products_updated_at();

-- Add comment for documentation
COMMENT ON TABLE products IS 'Affiliate products for blog post embeds. Use {{product:slug}} in blog content.';
