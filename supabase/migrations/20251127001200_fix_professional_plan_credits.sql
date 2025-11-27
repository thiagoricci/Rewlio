-- Fix Professional plan credits: $10 should give 500 credits, not 1000
UPDATE public.stripe_products
SET credits = 500
WHERE name = 'Professional' AND price_cents = 1000;