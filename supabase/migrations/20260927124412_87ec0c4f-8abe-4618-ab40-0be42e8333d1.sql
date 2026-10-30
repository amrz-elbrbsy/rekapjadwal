
CREATE TABLE public.technicians (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'AKTIF',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.project_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  sort_order int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'AKTIF',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.incentive_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_type_id uuid NOT NULL REFERENCES public.project_types(id) ON DELETE CASCADE,
  price numeric(14,2) NOT NULL DEFAULT 0,
  effective_date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'AKTIF',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_number text NOT NULL UNIQUE,
  project_date date NOT NULL,
  customer_name text NOT NULL,
  project_type_id uuid NOT NULL REFERENCES public.project_types(id),
  qty numeric(14,4) NOT NULL,
  unit text NOT NULL DEFAULT 'PCS',
  incentive_price_snapshot numeric(14,2) NOT NULL DEFAULT 0,
  total_incentive numeric(16,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'SELESAI',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX projects_date_idx ON public.projects(project_date);
CREATE INDEX projects_type_idx ON public.projects(project_type_id);

CREATE TABLE public.project_technicians (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  technician_id uuid NOT NULL REFERENCES public.technicians(id),
  allocated_qty numeric(14,4) NOT NULL DEFAULT 0,
  incentive_amount numeric(16,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, technician_id)
);

CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  entity text NOT NULL,
  entity_id uuid,
  old_value jsonb,
  new_value jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.technicians TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_types TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.incentive_prices TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_technicians TO anon, authenticated;
GRANT SELECT, INSERT ON public.audit_logs TO anon, authenticated;
GRANT ALL ON public.technicians, public.project_types, public.incentive_prices, public.projects, public.project_technicians, public.audit_logs TO service_role;

ALTER TABLE public.technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incentive_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public manage technicians" ON public.technicians FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "public manage project_types" ON public.project_types FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "public manage incentive_prices" ON public.incentive_prices FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "public manage projects" ON public.projects FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "public manage project_technicians" ON public.project_technicians FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "public read audit_logs" ON public.audit_logs FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public insert audit_logs" ON public.audit_logs FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER t_tech_upd BEFORE UPDATE ON public.technicians FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER t_type_upd BEFORE UPDATE ON public.project_types FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER t_price_upd BEFORE UPDATE ON public.incentive_prices FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER t_proj_upd BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Business rule: total = qty * harga ; per teknisi = (qty / jumlah teknisi) * harga
CREATE OR REPLACE FUNCTION public.save_project(
  p_id uuid,
  p_project_date date,
  p_customer_name text,
  p_project_type_id uuid,
  p_qty numeric,
  p_unit text,
  p_status text,
  p_notes text,
  p_technician_ids uuid[]
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ids uuid[];
  v_count int;
  v_price numeric;
  v_total numeric;
  v_alloc numeric;
  v_id uuid;
  v_number text;
  v_tech uuid;
BEGIN
  IF p_qty IS NULL OR p_qty <= 0 THEN RAISE EXCEPTION 'Qty harus lebih dari 0.'; END IF;
  SELECT ARRAY(SELECT DISTINCT unnest(COALESCE(p_technician_ids, ARRAY[]::uuid[]))) INTO v_ids;
  v_count := COALESCE(array_length(v_ids, 1), 0);
  IF v_count = 0 THEN RAISE EXCEPTION 'Teknisi belum dipilih.'; END IF;

  SELECT price INTO v_price FROM incentive_prices
   WHERE project_type_id = p_project_type_id AND status = 'AKTIF'
     AND effective_date <= p_project_date
   ORDER BY effective_date DESC, created_at DESC LIMIT 1;
  IF v_price IS NULL THEN
    SELECT price INTO v_price FROM incentive_prices
     WHERE project_type_id = p_project_type_id AND status = 'AKTIF'
     ORDER BY effective_date DESC, created_at DESC LIMIT 1;
  END IF;
  IF v_price IS NULL THEN RAISE EXCEPTION 'Harga insentif belum tersedia.'; END IF;

  v_total := ROUND(p_qty * v_price, 2);
  v_alloc := ROUND(p_qty / v_count, 4);

  IF p_id IS NULL THEN
    v_number := 'PRJ-' || to_char(now(), 'YYYYMMDD') || '-' || lpad((floor(random()*100000))::int::text, 5, '0');
    INSERT INTO projects (project_number, project_date, customer_name, project_type_id, qty, unit,
      incentive_price_snapshot, total_incentive, status, notes)
    VALUES (v_number, p_project_date, p_customer_name, p_project_type_id, p_qty, COALESCE(p_unit,'PCS'),
      v_price, v_total, COALESCE(p_status,'SELESAI'), p_notes)
    RETURNING id INTO v_id;
    INSERT INTO audit_logs(action, entity, entity_id, new_value)
    VALUES ('CREATE PROJECT','projects',v_id, jsonb_build_object('customer',p_customer_name,'qty',p_qty,'total',v_total));
  ELSE
    UPDATE projects SET project_date = p_project_date, customer_name = p_customer_name,
      project_type_id = p_project_type_id, qty = p_qty, unit = COALESCE(p_unit,'PCS'),
      incentive_price_snapshot = v_price, total_incentive = v_total,
      status = COALESCE(p_status,'SELESAI'), notes = p_notes
    WHERE id = p_id RETURNING id INTO v_id;
    IF v_id IS NULL THEN RAISE EXCEPTION 'Project tidak ditemukan.'; END IF;
    DELETE FROM project_technicians WHERE project_id = v_id;
    INSERT INTO audit_logs(action, entity, entity_id, new_value)
    VALUES ('UPDATE PROJECT','projects',v_id, jsonb_build_object('customer',p_customer_name,'qty',p_qty,'total',v_total));
  END IF;

  FOREACH v_tech IN ARRAY v_ids LOOP
    INSERT INTO project_technicians(project_id, technician_id, allocated_qty, incentive_amount)
    VALUES (v_id, v_tech, v_alloc, ROUND(v_alloc * v_price, 2));
  END LOOP;

  RETURN v_id;
END; $$;

GRANT EXECUTE ON FUNCTION public.save_project(uuid,date,text,uuid,numeric,text,text,text,uuid[]) TO anon, authenticated;

INSERT INTO public.technicians (name) VALUES
 ('AMIR'),('SUKMA'),('IQBAL'),('RIDWAN'),('ASEP'),('AFAN'),('ARMAN'),('FERY'),('AWANG'),('YANTO');

INSERT INTO public.project_types (name, code, sort_order) VALUES
 ('UKUR','UKUR',1),
 ('PASANG RAIL','RAIL',2),
 ('PASANG MANUAL ROLLERBLIND','MANUAL',3),
 ('PASANG ZIPBLIND / EXTREME EXTERIOR / MANUAL ZIPBLIND','ZIPBLIND',4),
 ('PASANG MOTOR ROLLERBLIND/EXTERIOR','MOTOR',5),
 ('SALAH UKUR','SALAH_UKUR',6);

INSERT INTO public.incentive_prices (project_type_id, price, effective_date)
SELECT id, v.price, DATE '2026-01-01' FROM public.project_types pt
JOIN (VALUES ('UKUR',500),('RAIL',3000),('MANUAL',5000),('ZIPBLIND',50000),('MOTOR',15000),('SALAH_UKUR',30000)) AS v(code, price)
ON v.code = pt.code;
