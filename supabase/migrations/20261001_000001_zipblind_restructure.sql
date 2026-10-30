-- Migration: ZIPBLIND – Rekap Jadwal Teknisi restructuring
-- Date: 2026-10-01
-- This migration removes incentive‑related columns/functions and adds tables needed for schedule tracking.

-- 1. Revoke and drop the old save_project function (insentif logic)
REVOKE EXECUTE ON FUNCTION public.save_project FROM anon, authenticated;
DROP FUNCTION IF EXISTS public.save_project;

-- 2. Remove incentive‑related columns from projects table
ALTER TABLE public.projects DROP COLUMN IF EXISTS incentive_price_snapshot;
ALTER TABLE public.projects DROP COLUMN IF EXISTS total_incentive;

-- 3. Remove incentive_amount column from project_technicians table
ALTER TABLE public.project_technicians DROP COLUMN IF EXISTS incentive_amount;

-- 4. Add a column to mark public visibility of a project
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false;

-- 5. Create table for product details per project
CREATE TABLE IF NOT EXISTS public.project_products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    product_name text NOT NULL,
    set_qty numeric(14,4) NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- 6. Create table for project photos
CREATE TABLE IF NOT EXISTS public.project_photos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    photo_url text NOT NULL,
    thumbnail_url text,
    caption text,
    uploaded_at timestamptz NOT NULL DEFAULT now()
);

-- 7. Grant appropriate privileges
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_products TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_photos TO anon, authenticated;
GRANT UPDATE ON public.projects (is_public) TO anon, authenticated; -- allow admins to toggle visibility

-- 8. Enable Row Level Security for new tables
ALTER TABLE public.project_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_photos ENABLE ROW LEVEL SECURITY;

-- 9. Policies for new tables (full access for authenticated users, read‑only for anon)
CREATE POLICY "manage project_products" ON public.project_products FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "read project_products" ON public.project_products FOR SELECT TO anon USING (true);

CREATE POLICY "manage project_photos" ON public.project_photos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "read project_photos" ON public.project_photos FOR SELECT TO anon USING (true);

-- 10. Create a view for publicly visible projects (read‑only for anon)
CREATE OR REPLACE VIEW public.public_projects AS
SELECT * FROM public.projects WHERE is_public = true;

-- 11. Policies for public view (already read‑only for anon)
GRANT SELECT ON public.public_projects TO anon, authenticated;

-- 12. Optional: cleanup old incentive_prices table if no longer needed (keep for backup)
-- DROP TABLE IF EXISTS public.incentive_prices CASCADE;   -- Uncomment only after confirming backup.

-- 13. Update triggers: keep existing set_updated_at triggers; no changes needed.

-- End of migration
