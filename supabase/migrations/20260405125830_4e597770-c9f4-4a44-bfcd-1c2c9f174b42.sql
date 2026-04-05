
ALTER TABLE public.menu_items
ADD COLUMN available_days text[] NOT NULL DEFAULT ARRAY['Saturday','Sunday','Monday','Tuesday','Wednesday','Thursday','Friday'];
