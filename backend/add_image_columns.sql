-- Add e-commerce image gallery columns to products table.
-- Run once in Supabase SQL Editor.

alter table public.products
  add column if not exists primary_image text,
  add column if not exists image_2 text,
  add column if not exists image_3 text;

-- Backfill legacy image column from primary_image where missing
update public.products
set image = primary_image
where (image is null or image = '') and primary_image is not null and primary_image != '';

update public.products
set primary_image = image
where (primary_image is null or primary_image = '') and image is not null and image != '';
