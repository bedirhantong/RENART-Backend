-- ============================================================================
-- RENART ENGAGEMENT RINGS - DATA INSERTION
-- ============================================================================
-- Bu script RENART vendor'una ait engagement ring ürünlerini ekler
-- Supabase SQL Editor'da çalıştırın
-- ============================================================================

-- Engagement Ring ürünlerini RENART vendor'una ekle
DO $$
DECLARE
    v_vendor_id UUID;
    v_product_ids UUID[];
    v_product_data RECORD;
    v_current_product_id UUID;
BEGIN
    -- RENART vendor ID'sini al
    SELECT id INTO v_vendor_id 
    FROM vendors 
    WHERE email = 'vendor@renart.com' 
    AND status = 'active';
    
    IF v_vendor_id IS NULL THEN
        RAISE EXCEPTION 'RENART vendor not found or not active';
    END IF;
    
    RAISE NOTICE 'Found RENART vendor with ID: %', v_vendor_id;
    
    -- Engagement Ring ürünlerini ekle
    FOR v_product_data IN
        SELECT * FROM (VALUES
            ('Engagement Ring 1', 8, 2.1),  -- 0.85 * 10 = 8.5 ≈ 8
            ('Engagement Ring 2', 5, 3.4),  -- 0.51 * 10 = 5.1 ≈ 5
            ('Engagement Ring 3', 9, 3.8),  -- 0.92 * 10 = 9.2 ≈ 9
            ('Engagement Ring 4', 9, 4.5),  -- 0.88 * 10 = 8.8 ≈ 9
            ('Engagement Ring 5', 8, 2.5),  -- 0.80 * 10 = 8.0 = 8
            ('Engagement Ring 6', 8, 1.8),  -- 0.82 * 10 = 8.2 ≈ 8
            ('Engagement Ring 7', 7, 5.2),  -- 0.70 * 10 = 7.0 = 7
            ('Engagement Ring 8', 9, 3.7)   -- 0.90 * 10 = 9.0 = 9
        ) AS rings(name, popularity_score, weight)
    LOOP
        -- Ürünü ekle
        INSERT INTO products (
            vendor_id, 
            name, 
            weight, 
            popularity_score, 
            is_active, 
            created_at
        )
        VALUES (
            v_vendor_id,
            v_product_data.name,
            v_product_data.weight,
            v_product_data.popularity_score,
            true,
            now()
        )
        RETURNING id INTO v_current_product_id;
        
        RAISE NOTICE 'Created product: % with ID: %', v_product_data.name, v_current_product_id;
        
        -- Ürün resimlerini ekle (3 renk için)
        CASE v_product_data.name
            WHEN 'Engagement Ring 1' THEN
                INSERT INTO product_images (product_id, color, image_url, created_at) VALUES
                (v_current_product_id, 'yellow', 'https://cdn.shopify.com/s/files/1/0484/1429/4167/files/EG085-100P-Y.jpg?v=1696588368', now()),
                (v_current_product_id, 'rose', 'https://cdn.shopify.com/s/files/1/0484/1429/4167/files/EG085-100P-R.jpg?v=1696588406', now()),
                (v_current_product_id, 'white', 'https://cdn.shopify.com/s/files/1/0484/1429/4167/files/EG085-100P-W.jpg?v=1696588402', now());
                
            WHEN 'Engagement Ring 2' THEN
                INSERT INTO product_images (product_id, color, image_url, created_at) VALUES
                (v_current_product_id, 'yellow', 'https://cdn.shopify.com/s/files/1/0484/1429/4167/files/EG012-Y.jpg?v=1707727068', now()),
                (v_current_product_id, 'rose', 'https://cdn.shopify.com/s/files/1/0484/1429/4167/files/EG012-R.jpg?v=1707727068', now()),
                (v_current_product_id, 'white', 'https://cdn.shopify.com/s/files/1/0484/1429/4167/files/EG012-W.jpg?v=1707727068', now());
                
            WHEN 'Engagement Ring 3' THEN
                INSERT INTO product_images (product_id, color, image_url, created_at) VALUES
                (v_current_product_id, 'yellow', 'https://cdn.shopify.com/s/files/1/0484/1429/4167/files/EG020-100P-Y.jpg?v=1683534032', now()),
                (v_current_product_id, 'rose', 'https://cdn.shopify.com/s/files/1/0484/1429/4167/files/EG020-100P-R.jpg?v=1683534032', now()),
                (v_current_product_id, 'white', 'https://cdn.shopify.com/s/files/1/0484/1429/4167/files/EG020-100P-W.jpg?v=1683534032', now());
                
            WHEN 'Engagement Ring 4' THEN
                INSERT INTO product_images (product_id, color, image_url, created_at) VALUES
                (v_current_product_id, 'yellow', 'https://cdn.shopify.com/s/files/1/0484/1429/4167/files/EG022-100P-Y.jpg?v=1683532153', now()),
                (v_current_product_id, 'rose', 'https://cdn.shopify.com/s/files/1/0484/1429/4167/files/EG022-100P-R.jpg?v=1683532153', now()),
                (v_current_product_id, 'white', 'https://cdn.shopify.com/s/files/1/0484/1429/4167/files/EG022-100P-W.jpg?v=1683532153', now());
                
            WHEN 'Engagement Ring 5' THEN
                INSERT INTO product_images (product_id, color, image_url, created_at) VALUES
                (v_current_product_id, 'yellow', 'https://cdn.shopify.com/s/files/1/0484/1429/4167/files/EG074-100P-Y.jpg?v=1696232035', now()),
                (v_current_product_id, 'rose', 'https://cdn.shopify.com/s/files/1/0484/1429/4167/files/EG074-100P-R.jpg?v=1696927124', now()),
                (v_current_product_id, 'white', 'https://cdn.shopify.com/s/files/1/0484/1429/4167/files/EG074-100P-W.jpg?v=1696927124', now());
                
            WHEN 'Engagement Ring 6' THEN
                INSERT INTO product_images (product_id, color, image_url, created_at) VALUES
                (v_current_product_id, 'yellow', 'https://cdn.shopify.com/s/files/1/0484/1429/4167/files/EG075-100P-Y.jpg?v=1696591786', now()),
                (v_current_product_id, 'rose', 'https://cdn.shopify.com/s/files/1/0484/1429/4167/files/EG075-100P-R.jpg?v=1696591802', now()),
                (v_current_product_id, 'white', 'https://cdn.shopify.com/s/files/1/0484/1429/4167/files/EG075-100P-W.jpg?v=1696591798', now());
                
            WHEN 'Engagement Ring 7' THEN
                INSERT INTO product_images (product_id, color, image_url, created_at) VALUES
                (v_current_product_id, 'yellow', 'https://cdn.shopify.com/s/files/1/0484/1429/4167/files/EG094-100P-Y.jpg?v=1696589183', now()),
                (v_current_product_id, 'rose', 'https://cdn.shopify.com/s/files/1/0484/1429/4167/files/EG094-100P-R.jpg?v=1696589214', now()),
                (v_current_product_id, 'white', 'https://cdn.shopify.com/s/files/1/0484/1429/4167/files/EG094-100P-W.jpg?v=1696589210', now());
                
            WHEN 'Engagement Ring 8' THEN
                INSERT INTO product_images (product_id, color, image_url, created_at) VALUES
                (v_current_product_id, 'yellow', 'https://cdn.shopify.com/s/files/1/0484/1429/4167/files/EG115-100P-Y.jpg?v=1696596076', now()),
                (v_current_product_id, 'rose', 'https://cdn.shopify.com/s/files/1/0484/1429/4167/files/EG115-100P-R.jpg?v=1696596151', now()),
                (v_current_product_id, 'white', 'https://cdn.shopify.com/s/files/1/0484/1429/4167/files/EG115-100P-W.jpg?v=1696596147', now());
        END CASE;
        
        RAISE NOTICE 'Added 3 product images for: %', v_product_data.name;
        
    END LOOP;
    
    -- Sonuç bilgisi
    RAISE NOTICE '';
    RAISE NOTICE '✅ Successfully added 8 Engagement Ring products to RENART vendor!';
    RAISE NOTICE '📸 Each product has 3 color variants (yellow, rose, white)';
    RAISE NOTICE '🔢 Total product images added: 24';
    RAISE NOTICE '';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error inserting engagement rings: %', SQLERRM;
END $$;

-- Eklenen ürünleri kontrol et
DO $$
DECLARE
    v_vendor_id UUID;
    v_product_count INTEGER;
    v_image_count INTEGER;
BEGIN
    SELECT id INTO v_vendor_id FROM vendors WHERE email = 'vendor@renart.com';
    
    SELECT COUNT(*) INTO v_product_count 
    FROM products 
    WHERE vendor_id = v_vendor_id 
    AND name LIKE 'Engagement Ring%';
    
    SELECT COUNT(*) INTO v_image_count 
    FROM product_images pi
    JOIN products p ON pi.product_id = p.id
    WHERE p.vendor_id = v_vendor_id 
    AND p.name LIKE 'Engagement Ring%';
    
    RAISE NOTICE '';
    RAISE NOTICE '📊 VERIFICATION RESULTS:';
    RAISE NOTICE 'RENART vendor ID: %', v_vendor_id;
    RAISE NOTICE 'Engagement Ring products: %', v_product_count;
    RAISE NOTICE 'Product images: %', v_image_count;
    RAISE NOTICE '';
    
    IF v_product_count = 8 AND v_image_count = 24 THEN
        RAISE NOTICE '🎉 SUCCESS: All engagement rings and images added correctly!';
    ELSE
        RAISE NOTICE '⚠️  WARNING: Expected 8 products and 24 images, but found % products and % images', v_product_count, v_image_count;
    END IF;
    
END $$;

-- ============================================================================
-- ENGAGEMENT RINGS INSERTION COMPLETED
-- ============================================================================
