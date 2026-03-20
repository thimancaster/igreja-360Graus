ALTER TABLE public.churches ADD COLUMN IF NOT EXISTS pix_qr_image_url text;
ALTER TABLE public.churches ADD COLUMN IF NOT EXISTS primary_color text;
ALTER TABLE public.churches ADD COLUMN IF NOT EXISTS secondary_color text;
ALTER TABLE public.churches ADD COLUMN IF NOT EXISTS accent_color text;