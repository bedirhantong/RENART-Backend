-- Geçici çözüm: Favorites tablosunu Supabase Auth users ile çalışacak şekilde düzelt
-- Bu script'i Supabase SQL Editor'da çalıştırın

-- Önce mevcut favorites tablosunu sil
DROP TABLE IF EXISTS favorites CASCADE;

-- Yeni favorites tablosunu Supabase Auth users ile oluştur
CREATE TABLE favorites (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Constraints
    UNIQUE(user_id, product_id)
);

-- Index'leri tekrar oluştur
CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_favorites_product_id ON favorites(product_id);

-- Bunu çalıştırdıktan sonra favoriler sistemi çalışacak
