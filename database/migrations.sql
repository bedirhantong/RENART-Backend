-- RENART Database Schema
-- Run this script in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create vendors table
CREATE TABLE IF NOT EXISTS vendors (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    logo_url TEXT,
    email VARCHAR(255) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    weight DECIMAL(10,2) NOT NULL CHECK (weight > 0),
    popularity_score INTEGER NOT NULL CHECK (popularity_score >= 0 AND popularity_score <= 10),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create product_images table
CREATE TABLE IF NOT EXISTS product_images (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    color VARCHAR(10) NOT NULL CHECK (color IN ('yellow', 'white', 'rose')),
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(product_id, color)
);

-- Create favorites table
CREATE TABLE IF NOT EXISTS favorites (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, product_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_vendor_id ON products(vendor_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_popularity_score ON products(popularity_score);
CREATE INDEX IF NOT EXISTS idx_products_weight ON products(weight);
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_color ON product_images(color);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_product_id ON favorites(product_id);
CREATE INDEX IF NOT EXISTS idx_vendors_email ON vendors(email);
CREATE INDEX IF NOT EXISTS idx_vendors_is_active ON vendors(is_active);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON vendors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Vendors can only see/edit their own data
CREATE POLICY "Vendors can view own data" ON vendors
    FOR SELECT USING (auth.jwt() ->> 'email' = email);

CREATE POLICY "Vendors can update own data" ON vendors
    FOR UPDATE USING (auth.jwt() ->> 'email' = email);

-- Products: vendors can manage their own, public can view active products
CREATE POLICY "Public can view active products" ON products
    FOR SELECT USING (is_active = true);

CREATE POLICY "Vendors can view own products" ON products
    FOR SELECT USING (
        vendor_id IN (
            SELECT id FROM vendors WHERE email = auth.jwt() ->> 'email'
        )
    );

CREATE POLICY "Vendors can insert own products" ON products
    FOR INSERT WITH CHECK (
        vendor_id IN (
            SELECT id FROM vendors WHERE email = auth.jwt() ->> 'email'
        )
    );

CREATE POLICY "Vendors can update own products" ON products
    FOR UPDATE USING (
        vendor_id IN (
            SELECT id FROM vendors WHERE email = auth.jwt() ->> 'email'
        )
    );

-- Product images: follow product permissions
CREATE POLICY "Public can view product images for active products" ON product_images
    FOR SELECT USING (
        product_id IN (
            SELECT id FROM products WHERE is_active = true
        )
    );

CREATE POLICY "Vendors can view own product images" ON product_images
    FOR SELECT USING (
        product_id IN (
            SELECT p.id FROM products p
            JOIN vendors v ON p.vendor_id = v.id
            WHERE v.email = auth.jwt() ->> 'email'
        )
    );

CREATE POLICY "Vendors can insert own product images" ON product_images
    FOR INSERT WITH CHECK (
        product_id IN (
            SELECT p.id FROM products p
            JOIN vendors v ON p.vendor_id = v.id
            WHERE v.email = auth.jwt() ->> 'email'
        )
    );

CREATE POLICY "Vendors can update own product images" ON product_images
    FOR UPDATE USING (
        product_id IN (
            SELECT p.id FROM products p
            JOIN vendors v ON p.vendor_id = v.id
            WHERE v.email = auth.jwt() ->> 'email'
        )
    );

CREATE POLICY "Vendors can delete own product images" ON product_images
    FOR DELETE USING (
        product_id IN (
            SELECT p.id FROM products p
            JOIN vendors v ON p.vendor_id = v.id
            WHERE v.email = auth.jwt() ->> 'email'
        )
    );

-- Favorites: users can only manage their own
CREATE POLICY "Users can view own favorites" ON favorites
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites" ON favorites
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites" ON favorites
    FOR DELETE USING (auth.uid() = user_id);

-- Insert sample data
INSERT INTO vendors (name, description, email) VALUES 
('RENART', 'Premium jewelry store specializing in gold products', 'vendor@renart.com')
ON CONFLICT (email) DO NOTHING;

-- Note: You'll need to insert your actual vendor email that matches your Supabase auth user
-- Replace 'vendor@renart.com' with the actual email of your vendor account

-- Grant necessary permissions for the service role
-- This allows the API to read all data when using service role key
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;
