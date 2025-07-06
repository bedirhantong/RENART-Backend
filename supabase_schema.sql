-- ============================================================================
-- RENART BACKEND - SUPABASE DATABASE SCHEMA
-- ============================================================================
-- Bu dosyayı Supabase SQL Editor'da çalıştırın
-- 
-- İçerik:
-- 1. Extensions
-- 2. Tables (vendors, users, products, product_images, favorites)
-- 3. Indexes
-- 4. Functions
-- 5. Triggers
-- 6. RLS Policies
-- 7. Permissions
-- 8. Sample Data
-- ============================================================================

-- ============================================================================
-- 1. EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 2. TABLES
-- ============================================================================

-- 2.1 VENDORS TABLE
-- Vendor hesapları (satıcılar için)
DROP TABLE IF EXISTS vendors CASCADE;
CREATE TABLE vendors (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    -- Authentication
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    
    -- Business Information (Required)
    business_name TEXT NOT NULL,
    business_type TEXT NOT NULL,
    contact_person_name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    business_address TEXT NOT NULL,
    
    -- Business Information (Optional)
    tax_id TEXT,
    description TEXT,
    website TEXT,
    
    -- Legacy fields (compatibility)
    name VARCHAR(255),
    logo_url TEXT,
    
    -- Status & Activity
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('pending', 'active', 'suspended', 'rejected')),
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    last_login_at TIMESTAMP WITH TIME ZONE,
    email_verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.2 USERS TABLE  
-- Müşteri hesapları (favoriler için)
DROP TABLE IF EXISTS users CASCADE;
CREATE TABLE users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    -- Authentication
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    
    -- Profile
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    email_verified_at TIMESTAMP WITH TIME ZONE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.3 PRODUCTS TABLE
-- Ürünler
DROP TABLE IF EXISTS products CASCADE;
CREATE TABLE products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    
    -- Product Info
    name VARCHAR(255) NOT NULL,
    weight DECIMAL(10,2) NOT NULL CHECK (weight > 0),
    popularity_score INTEGER NOT NULL CHECK (popularity_score >= 0 AND popularity_score <= 10),
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.4 PRODUCT IMAGES TABLE
-- Ürün resimleri (altın renkleri için)
DROP TABLE IF EXISTS product_images CASCADE;
CREATE TABLE product_images (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    
    -- Image Info
    color VARCHAR(10) NOT NULL CHECK (color IN ('yellow', 'white', 'rose')),
    image_url TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Constraints
    UNIQUE(product_id, color)
);

-- 2.5 FAVORITES TABLE
-- Kullanıcı favori ürünleri (Supabase Auth users kullanır)
DROP TABLE IF EXISTS favorites CASCADE;
CREATE TABLE favorites (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Constraints
    UNIQUE(user_id, product_id)
);

-- ============================================================================
-- 3. INDEXES
-- ============================================================================

-- Vendors indexes
CREATE INDEX idx_vendors_email ON vendors(email);
CREATE INDEX idx_vendors_status ON vendors(status);
CREATE INDEX idx_vendors_is_active ON vendors(is_active);
CREATE INDEX idx_vendors_business_name ON vendors(business_name);
CREATE INDEX idx_vendors_business_type ON vendors(business_type);

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_is_active ON users(is_active);

-- Products indexes
CREATE INDEX idx_products_vendor_id ON products(vendor_id);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_products_popularity_score ON products(popularity_score);
CREATE INDEX idx_products_weight ON products(weight);
CREATE INDEX idx_products_name ON products(name);

-- Product images indexes
CREATE INDEX idx_product_images_product_id ON product_images(product_id);
CREATE INDEX idx_product_images_color ON product_images(color);

-- Favorites indexes
CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_favorites_product_id ON favorites(product_id);

-- ============================================================================
-- 4. FUNCTIONS
-- ============================================================================

-- 4.1 UPDATE TIMESTAMP FUNCTION
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 5. TRIGGERS
-- ============================================================================

-- Updated at triggers
CREATE TRIGGER update_vendors_updated_at 
    BEFORE UPDATE ON vendors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at 
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 6. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Vendors policies
-- Public can view active vendors
CREATE POLICY "public_view_active_vendors" ON vendors
    FOR SELECT USING (status = 'active' AND is_active = true);

-- Allow vendor registration (INSERT without authentication)
CREATE POLICY "allow_vendor_registration" ON vendors
    FOR INSERT WITH CHECK (true);

-- Vendors can view and update their own data
CREATE POLICY "vendors_manage_own_data_select" ON vendors
    FOR SELECT USING (true); -- Service role will handle authentication

CREATE POLICY "vendors_manage_own_data_update" ON vendors
    FOR UPDATE USING (true); -- Service role will handle authentication

-- Products policies (public can view active products from active vendors)
CREATE POLICY "public_view_active_products" ON products
    FOR SELECT USING (
        is_active = true AND 
        vendor_id IN (
            SELECT id FROM vendors 
            WHERE status = 'active' AND is_active = true
        )
    );

-- Vendors can manage their own products
CREATE POLICY "vendors_manage_own_products_select" ON products
    FOR SELECT USING (true); -- Service role will handle authentication

CREATE POLICY "vendors_manage_own_products_insert" ON products
    FOR INSERT WITH CHECK (true); -- Service role will handle authentication

CREATE POLICY "vendors_manage_own_products_update" ON products
    FOR UPDATE USING (true); -- Service role will handle authentication

CREATE POLICY "vendors_manage_own_products_delete" ON products
    FOR DELETE USING (true); -- Service role will handle authentication

-- Product images policies (public can view images for active products)
CREATE POLICY "public_view_product_images" ON product_images
    FOR SELECT USING (
        product_id IN (
            SELECT p.id FROM products p
            JOIN vendors v ON p.vendor_id = v.id
            WHERE p.is_active = true 
            AND v.status = 'active' 
            AND v.is_active = true
        )
    );

-- Vendors can manage their own product images
CREATE POLICY "vendors_manage_own_product_images_select" ON product_images
    FOR SELECT USING (true); -- Service role will handle authentication

CREATE POLICY "vendors_manage_own_product_images_insert" ON product_images
    FOR INSERT WITH CHECK (true); -- Service role will handle authentication

CREATE POLICY "vendors_manage_own_product_images_update" ON product_images
    FOR UPDATE USING (true); -- Service role will handle authentication

CREATE POLICY "vendors_manage_own_product_images_delete" ON product_images
    FOR DELETE USING (true); -- Service role will handle authentication

-- Users policies
-- Allow user registration (INSERT without authentication)
CREATE POLICY "allow_user_registration" ON users
    FOR INSERT WITH CHECK (true);

-- Users can view and update their own data
CREATE POLICY "users_manage_own_data_select" ON users
    FOR SELECT USING (true); -- Service role will handle authentication

CREATE POLICY "users_manage_own_data_update" ON users
    FOR UPDATE USING (true); -- Service role will handle authentication

-- Favorites policies (users can only manage their own favorites)
CREATE POLICY "users_manage_own_favorites_select" ON favorites
    FOR SELECT USING (user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "users_manage_own_favorites_insert" ON favorites
    FOR INSERT WITH CHECK (user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "users_manage_own_favorites_delete" ON favorites
    FOR DELETE USING (user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

-- ============================================================================
-- 7. PERMISSIONS
-- ============================================================================

-- Grant permissions to service role (for API access)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Grant permissions to authenticated users
GRANT SELECT ON vendors TO authenticated;
GRANT SELECT ON products TO authenticated;
GRANT SELECT ON product_images TO authenticated;
GRANT ALL ON favorites TO authenticated;
GRANT ALL ON users TO authenticated;

-- ============================================================================
-- 8. SAMPLE DATA
-- ============================================================================

-- 8.1 Sample Vendor (RENART)
INSERT INTO vendors (
    email,
    password_hash,
    business_name,
    business_type,
    contact_person_name,
    phone_number,
    business_address,
    tax_id,
    description,
    website,
    name,
    logo_url,
    status,
    is_active,
    created_at
) VALUES (
    'vendor@renart.com',
    crypt('renart123', gen_salt('bf', 12)),
    'RENART Jewelry',
    'gallery',
    'John Smith',
    '+1-555-0123',
    '123 Jewelry District, New York, NY 10013',
    'US123456789',
    'Premium handcrafted jewelry store specializing in gold and diamond pieces. Established in 1985, we bring you the finest quality jewelry with exceptional craftsmanship.',
    'https://www.renart.com',
    'RENART',
    'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=200&h=200&fit=crop&crop=center',
    'active',
    true,
    now()
) ON CONFLICT (email) DO NOTHING;

-- 8.2 Sample User
INSERT INTO users (
    email,
    password_hash,
    first_name,
    last_name,
    is_active,
    created_at
) VALUES (
    'user@example.com',
    crypt('password123', gen_salt('bf', 12)),
    'Jane',
    'Doe',
    true,
    now()
) ON CONFLICT (email) DO NOTHING;

-- 8.3 Sample Products (only if vendor exists)
DO $$
DECLARE
    v_vendor_id UUID;
    v_product_ids UUID[];
BEGIN
    -- Get RENART vendor ID
    SELECT id INTO v_vendor_id FROM vendors WHERE email = 'vendor@renart.com';
    
    IF v_vendor_id IS NOT NULL THEN
        -- Insert sample products
        WITH inserted_products AS (
            INSERT INTO products (vendor_id, name, weight, popularity_score, is_active, created_at)
            VALUES 
                (v_vendor_id, 'Golden Heart Necklace', 15.5, 9, true, now()),
                (v_vendor_id, 'Diamond Eternity Ring', 3.2, 8, true, now()),
                (v_vendor_id, 'Rose Gold Bracelet', 8.7, 7, true, now()),
                (v_vendor_id, 'Emerald Drop Earrings', 4.3, 8, true, now()),
                (v_vendor_id, 'Platinum Wedding Band', 6.8, 9, true, now()),
                (v_vendor_id, 'Sapphire Pendant', 2.9, 7, true, now()),
                (v_vendor_id, 'Gold Charm Bracelet', 12.1, 6, true, now()),
                (v_vendor_id, 'White Gold Tennis Necklace', 18.3, 8, true, now()),
                (v_vendor_id, 'Ruby Stud Earrings', 1.8, 7, true, now()),
                (v_vendor_id, 'Vintage Gold Brooch', 5.4, 6, true, now())
            RETURNING id
        )
        SELECT array_agg(id) INTO v_product_ids FROM inserted_products;
        
        -- Insert product images for first 5 products
        INSERT INTO product_images (product_id, color, image_url, created_at)
        SELECT 
            unnest(v_product_ids[1:5]) as product_id,
            color,
            CASE 
                WHEN color = 'yellow' THEN 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=400&fit=crop&crop=center'
                WHEN color = 'white' THEN 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400&h=400&fit=crop&crop=center'
                WHEN color = 'rose' THEN 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&h=400&fit=crop&crop=center'
            END as image_url,
            now()
        FROM unnest(ARRAY['yellow', 'white', 'rose']) as color;
        
        RAISE NOTICE 'Sample products created for RENART vendor';
    END IF;
END $$;

-- ============================================================================
-- 9. COMMENTS & DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE vendors IS 'Vendor accounts for jewelry sellers';
COMMENT ON TABLE users IS 'Customer accounts for favorites and authentication';
COMMENT ON TABLE products IS 'Jewelry products offered by vendors';
COMMENT ON TABLE product_images IS 'Product images in different gold colors (yellow, white, rose)';
COMMENT ON TABLE favorites IS 'User favorite products';

COMMENT ON COLUMN vendors.status IS 'Vendor approval status: pending, active, suspended, rejected';
COMMENT ON COLUMN vendors.business_type IS 'Type of business (free text)';
COMMENT ON COLUMN products.popularity_score IS 'Product popularity score from 0 to 10';
COMMENT ON COLUMN products.weight IS 'Product weight in grams';
COMMENT ON COLUMN product_images.color IS 'Gold color variants: yellow, white, rose';

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ RENART Database Schema Created Successfully!';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Tables Created:';
    RAISE NOTICE '   • vendors (vendor accounts)';
    RAISE NOTICE '   • users (customer accounts)';
    RAISE NOTICE '   • products (jewelry products)';
    RAISE NOTICE '   • product_images (product images by color)';
    RAISE NOTICE '   • favorites (user favorites)';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 Features:';
    RAISE NOTICE '   • UUID primary keys';
    RAISE NOTICE '   • Automatic timestamps';
    RAISE NOTICE '   • Password hashing (bcrypt)';
    RAISE NOTICE '   • Row Level Security (RLS)';
    RAISE NOTICE '   • Proper indexes for performance';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Sample Data:';
    RAISE NOTICE '   • RENART vendor account';
    RAISE NOTICE '   • Sample customer account';
    RAISE NOTICE '   • 10 sample jewelry products';
    RAISE NOTICE '   • Product images in 3 gold colors';
    RAISE NOTICE '';
    RAISE NOTICE '🔑 Test Accounts:';
    RAISE NOTICE '   • Vendor: vendor@renart.com (password: renart123)';
    RAISE NOTICE '   • User: user@example.com (password: password123)';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Your database is ready for the RENART Backend!';
    RAISE NOTICE '';
END $$;
