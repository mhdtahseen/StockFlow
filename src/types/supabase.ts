export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string;
          company_name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_name?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          tenant_id: string;
          role: string;
          full_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          tenant_id: string;
          role?: string;
          full_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          role?: string;
          full_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      catalog_models: {
        Row: {
          id: string;
          brand: string;
          model: string;
          storage: string[];
          ram: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          brand: string;
          model: string;
          storage?: string[];
          ram?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          brand?: string;
          model?: string;
          storage?: string[];
          ram?: string[];
          created_at?: string;
          updated_at?: string;
        };
      };
      catalog_model_colors: {
        Row: {
          id: string;
          model_id: string;
          label: string;
          hex: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          model_id: string;
          label: string;
          hex?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          model_id?: string;
          label?: string;
          hex?: string | null;
          created_at?: string;
        };
      };
      phones: {
        Row: {
          id: string;
          tenant_id: string;
          brand: string;
          model: string;
          storage: string;
          ram: string;
          color: string;
          purchase_price: number;
          sale_price: number | null;
          status: string;
          issue_tags: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          brand: string;
          model: string;
          storage: string;
          ram: string;
          color: string;
          purchase_price: number;
          sale_price?: number | null;
          status?: string;
          issue_tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          brand?: string;
          model?: string;
          storage?: string;
          ram?: string;
          color?: string;
          purchase_price?: number;
          sale_price?: number | null;
          status?: string;
          issue_tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
      };
      ledger: {
        Row: {
          id: string;
          tenant_id: string;
          type: string;
          reference_id: string | null;
          amount: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          type: string;
          reference_id?: string | null;
          amount: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          type?: string;
          reference_id?: string | null;
          amount?: number;
          created_at?: string;
        };
      };
      master_data: {
        Row: {
          id: string;
          tenant_id: string;
          category: string;
          value: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          category: string;
          value: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          category?: string;
          value?: string;
          created_at?: string;
        };
      };
    };
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
