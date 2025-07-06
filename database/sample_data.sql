-- Sample Data for RENART Database
-- Run this after running migrations.sql

-- First get the vendor ID (you'll need to replace the email with your actual vendor email)
DO $$
DECLARE
    vendor_uuid UUID;
    product_uuid UUID;
BEGIN
    -- Get the vendor ID
    SELECT id INTO vendor_uuid FROM vendors WHERE email = 'vendor@renart.com';
    
    IF vendor_uuid IS NULL THEN
        RAISE EXCEPTION 'Vendor not found. Please update the email in migrations.sql first.';
    END IF;
    
    -- Insert sample products
    
    -- Product 1: Classic Gold Ring
    INSERT INTO products (vendor_id, name, weight, popularity_score, is_active)
    VALUES (vendor_uuid, 'Classic Gold Ring', 15.5, 8, true)
    RETURNING id INTO product_uuid;
    
    -- Add color variants for Product 1
    INSERT INTO product_images (product_id, color, image_url) VALUES
    (product_uuid, 'yellow', 'https://example.com/images/classic-ring-yellow.jpg'),
    (product_uuid, 'white', 'https://example.com/images/classic-ring-white.jpg'),
    (product_uuid, 'rose', 'https://example.com/images/classic-ring-rose.jpg');
    
    -- Product 2: Diamond Pendant
    INSERT INTO products (vendor_id, name, weight, popularity_score, is_active)
    VALUES (vendor_uuid, 'Diamond Pendant', 12.3, 9, true)
    RETURNING id INTO product_uuid;
    
    INSERT INTO product_images (product_id, color, image_url) VALUES
    (product_uuid, 'yellow', 'https://example.com/images/diamond-pendant-yellow.jpg'),
    (product_uuid, 'white', 'https://example.com/images/diamond-pendant-white.jpg');
    
    -- Product 3: Wedding Band
    INSERT INTO products (vendor_id, name, weight, popularity_score, is_active)
    VALUES (vendor_uuid, 'Wedding Band', 8.7, 10, true)
    RETURNING id INTO product_uuid;
    
    INSERT INTO product_images (product_id, color, image_url) VALUES
    (product_uuid, 'yellow', 'https://example.com/images/wedding-band-yellow.jpg'),
    (product_uuid, 'white', 'https://example.com/images/wedding-band-white.jpg'),
    (product_uuid, 'rose', 'https://example.com/images/wedding-band-rose.jpg');
    
    -- Product 4: Gold Bracelet
    INSERT INTO products (vendor_id, name, weight, popularity_score, is_active)
    VALUES (vendor_uuid, 'Gold Bracelet', 25.0, 7, true)
    RETURNING id INTO product_uuid;
    
    INSERT INTO product_images (product_id, color, image_url) VALUES
    (product_uuid, 'yellow', 'https://example.com/images/gold-bracelet-yellow.jpg'),
    (product_uuid, 'rose', 'https://example.com/images/gold-bracelet-rose.jpg');
    
    -- Product 5: Pearl Earrings
    INSERT INTO products (vendor_id, name, weight, popularity_score, is_active)
    VALUES (vendor_uuid, 'Pearl Earrings', 6.2, 6, true)
    RETURNING id INTO product_uuid;
    
    INSERT INTO product_images (product_id, color, image_url) VALUES
    (product_uuid, 'yellow', 'https://example.com/images/pearl-earrings-yellow.jpg'),
    (product_uuid, 'white', 'https://example.com/images/pearl-earrings-white.jpg');
    
    -- Product 6: Luxury Necklace
    INSERT INTO products (vendor_id, name, weight, popularity_score, is_active)
    VALUES (vendor_uuid, 'Luxury Necklace', 35.8, 9, true)
    RETURNING id INTO product_uuid;
    
    INSERT INTO product_images (product_id, color, image_url) VALUES
    (product_uuid, 'yellow', 'https://example.com/images/luxury-necklace-yellow.jpg'),
    (product_uuid, 'white', 'https://example.com/images/luxury-necklace-white.jpg'),
    (product_uuid, 'rose', 'https://example.com/images/luxury-necklace-rose.jpg');
    
    -- Product 7: Gold Chain
    INSERT INTO products (vendor_id, name, weight, popularity_score, is_active)
    VALUES (vendor_uuid, 'Gold Chain', 22.1, 5, true)
    RETURNING id INTO product_uuid;
    
    INSERT INTO product_images (product_id, color, image_url) VALUES
    (product_uuid, 'yellow', 'https://example.com/images/gold-chain-yellow.jpg');
    
    -- Product 8: Anniversary Ring
    INSERT INTO products (vendor_id, name, weight, popularity_score, is_active)
    VALUES (vendor_uuid, 'Anniversary Ring', 18.4, 8, true)
    RETURNING id INTO product_uuid;
    
    INSERT INTO product_images (product_id, color, image_url) VALUES
    (product_uuid, 'white', 'https://example.com/images/anniversary-ring-white.jpg'),
    (product_uuid, 'rose', 'https://example.com/images/anniversary-ring-rose.jpg');
    
    -- Product 9: Gold Cufflinks (inactive for testing)
    INSERT INTO products (vendor_id, name, weight, popularity_score, is_active)
    VALUES (vendor_uuid, 'Gold Cufflinks', 14.0, 4, false)
    RETURNING id INTO product_uuid;
    
    INSERT INTO product_images (product_id, color, image_url) VALUES
    (product_uuid, 'yellow', 'https://example.com/images/gold-cufflinks-yellow.jpg');
    
    -- Product 10: Designer Brooch
    INSERT INTO products (vendor_id, name, weight, popularity_score, is_active)
    VALUES (vendor_uuid, 'Designer Brooch', 11.3, 7, true)
    RETURNING id INTO product_uuid;
    
    INSERT INTO product_images (product_id, color, image_url) VALUES
    (product_uuid, 'yellow', 'https://example.com/images/designer-brooch-yellow.jpg'),
    (product_uuid, 'white', 'https://example.com/images/designer-brooch-white.jpg');
    
    RAISE NOTICE 'Sample data inserted successfully for vendor: %', vendor_uuid;
END $$;
