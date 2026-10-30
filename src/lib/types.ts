export type Status = "DRAFT" | "SELESAI" | "DIBATALKAN";

export interface Technician {
  id: string;
  name: string;
  status: string;
  created_at?: string;
}

export interface ProjectType {
  id: string;
  name: string;
  code: string;
  sort_order: number;
  status: string;
}

// New data structures for ZIPBLIND – Rekap Jadwal Teknisi

export interface Product {
  id: string;
  project_id: string;
  product_name: string;
  set_qty: number;
}

export interface ProjectPhoto {
  id: string;
  project_id: string;
  photo_url: string;
  thumbnail_url?: string;
  caption?: string;
}

// Retained core interfaces (technicians, project types)
export interface Technician {
  id: string;
  name: string;
  status: string;
  created_at?: string;
}

export interface ProjectType {
  id: string;
  name: string;
  code: string;
  sort_order: number;
  status: string;
}

// Removed IncentivePrice and incentive fields from ProjectTechnician & Project.
export interface ProjectTechnician {
  id: string;
  project_id: string;
  technician_id: string;
  allocated_qty: number;
  technician?: { id: string; name: string } | null;
}

export interface Project {
  id: string;
  project_number: string;
  project_date: string;
  customer_name: string;
  project_type_id: string;
  qty: number; // total sets (calculated from product entries)
  unit: string;
  status: Status;
  notes: string | null;
  created_at: string;
  updated_at: string;
  project_type?: ProjectType | null;
  technicians?: ProjectTechnician[];
  products?: Product[];
  photos?: ProjectPhoto[];
  is_public?: boolean;
}
