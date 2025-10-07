export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      batches: {
        Row: {
          batch_number: string | null
          created_at: string | null
          created_by: string | null
          expiration_date: string | null
          id: string
          product_name: string
          quantity: number
          status: string | null
          style: Database["public"]["Enums"]["product_style"] | null
          supplier_batch_ref: string | null
          tenant_id: string | null
          total_cost: number | null
        }
        Insert: {
          batch_number?: string | null
          created_at?: string | null
          created_by?: string | null
          expiration_date?: string | null
          id?: string
          product_name: string
          quantity: number
          status?: string | null
          style?: Database["public"]["Enums"]["product_style"] | null
          supplier_batch_ref?: string | null
          tenant_id?: string | null
          total_cost?: number | null
        }
        Update: {
          batch_number?: string | null
          created_at?: string | null
          created_by?: string | null
          expiration_date?: string | null
          id?: string
          product_name?: string
          quantity?: number
          status?: string | null
          style?: Database["public"]["Enums"]["product_style"] | null
          supplier_batch_ref?: string | null
          tenant_id?: string | null
          total_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "batches_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batches_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      batches_materials: {
        Row: {
          batch_id: string | null
          id: string
          material_id: string | null
          qty_used: number | null
        }
        Insert: {
          batch_id?: string | null
          id?: string
          material_id?: string | null
          qty_used?: number | null
        }
        Update: {
          batch_id?: string | null
          id?: string
          material_id?: string | null
          qty_used?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "batches_materials_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batches_materials_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
        ]
      }
      bill_of_materials: {
        Row: {
          id: string
          material_id: string | null
          product_id: string | null
          quantity_required: number
          tenant_id: string | null
        }
        Insert: {
          id?: string
          material_id?: string | null
          product_id?: string | null
          quantity_required: number
          tenant_id?: string | null
        }
        Update: {
          id?: string
          material_id?: string | null
          product_id?: string | null
          quantity_required?: number
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bill_of_materials_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bill_of_materials_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bill_of_materials_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      consignment_items: {
        Row: {
          consignment_id: string
          created_at: string | null
          id: string
          product_name: string
          quantity: number
          remaining: number
          sold: number
        }
        Insert: {
          consignment_id: string
          created_at?: string | null
          id?: string
          product_name: string
          quantity?: number
          remaining?: number
          sold?: number
        }
        Update: {
          consignment_id?: string
          created_at?: string | null
          id?: string
          product_name?: string
          quantity?: number
          remaining?: number
          sold?: number
        }
        Relationships: [
          {
            foreignKeyName: "consignment_items_consignment_id_fkey"
            columns: ["consignment_id"]
            isOneToOne: false
            referencedRelation: "consignments"
            referencedColumns: ["id"]
          },
        ]
      }
      consignments: {
        Row: {
          created_at: string | null
          id: string
          partner_id: string | null
          status: string | null
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          partner_id?: string | null
          status?: string | null
          tenant_id?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          partner_id?: string | null
          status?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "consignments_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consignments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          contact: string | null
          created_at: string | null
          id: string
          name: string
          tenant_id: string | null
          type: string | null
        }
        Insert: {
          contact?: string | null
          created_at?: string | null
          id?: string
          name: string
          tenant_id?: string | null
          type?: string | null
        }
        Update: {
          contact?: string | null
          created_at?: string | null
          id?: string
          name?: string
          tenant_id?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string | null
          event_type: string | null
          id: string
          payload: Json | null
          tenant_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_type?: string | null
          id?: string
          payload?: Json | null
          tenant_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string | null
          id?: string
          payload?: Json | null
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory: {
        Row: {
          color: string | null
          id: string
          inventory_type: Database["public"]["Enums"]["inventory_type"] | null
          location: string | null
          max_stock: number | null
          min_stock: number | null
          product_id: string | null
          product_style: Database["public"]["Enums"]["product_style"] | null
          quantity: number | null
          size: string | null
          tenant_id: string | null
          updated_at: string | null
          warehouse_section: string | null
        }
        Insert: {
          color?: string | null
          id?: string
          inventory_type?: Database["public"]["Enums"]["inventory_type"] | null
          location?: string | null
          max_stock?: number | null
          min_stock?: number | null
          product_id?: string | null
          product_style?: Database["public"]["Enums"]["product_style"] | null
          quantity?: number | null
          size?: string | null
          tenant_id?: string | null
          updated_at?: string | null
          warehouse_section?: string | null
        }
        Update: {
          color?: string | null
          id?: string
          inventory_type?: Database["public"]["Enums"]["inventory_type"] | null
          location?: string | null
          max_stock?: number | null
          min_stock?: number | null
          product_id?: string | null
          product_style?: Database["public"]["Enums"]["product_style"] | null
          quantity?: number | null
          size?: string | null
          tenant_id?: string | null
          updated_at?: string | null
          warehouse_section?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          inventory_id: string | null
          movement_type: Database["public"]["Enums"]["movement_type"]
          notes: string | null
          product_id: string | null
          quantity: number
          quantity_after: number | null
          quantity_before: number | null
          reference_id: string | null
          reference_type: string | null
          tenant_id: string | null
          variant_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          inventory_id?: string | null
          movement_type: Database["public"]["Enums"]["movement_type"]
          notes?: string | null
          product_id?: string | null
          quantity: number
          quantity_after?: number | null
          quantity_before?: number | null
          reference_id?: string | null
          reference_type?: string | null
          tenant_id?: string | null
          variant_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          inventory_id?: string | null
          movement_type?: Database["public"]["Enums"]["movement_type"]
          notes?: string | null
          product_id?: string | null
          quantity?: number
          quantity_after?: number | null
          quantity_before?: number | null
          reference_id?: string | null
          reference_type?: string | null
          tenant_id?: string | null
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "v_finished_products_stock"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "v_low_stock_alerts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "v_raw_materials_stock"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      keywords: {
        Row: {
          id: string
          mapping: Json | null
          tenant_id: string | null
          term: string | null
        }
        Insert: {
          id?: string
          mapping?: Json | null
          tenant_id?: string | null
          term?: string | null
        }
        Update: {
          id?: string
          mapping?: Json | null
          tenant_id?: string | null
          term?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "keywords_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      materials: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          material_type: Database["public"]["Enums"]["material_type"] | null
          min_stock: number | null
          name: string
          shirt_style: Database["public"]["Enums"]["product_style"] | null
          stock: number | null
          tenant_id: string | null
          unit: string | null
          unit_cost: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          material_type?: Database["public"]["Enums"]["material_type"] | null
          min_stock?: number | null
          name: string
          shirt_style?: Database["public"]["Enums"]["product_style"] | null
          stock?: number | null
          tenant_id?: string | null
          unit?: string | null
          unit_cost?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          material_type?: Database["public"]["Enums"]["material_type"] | null
          min_stock?: number | null
          name?: string
          shirt_style?: Database["public"]["Enums"]["product_style"] | null
          stock?: number | null
          tenant_id?: string | null
          unit?: string | null
          unit_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "materials_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          additional_cost: number | null
          color: string
          created_at: string | null
          id: string
          product_id: string | null
          size: string
          sku_variant: string
          style: Database["public"]["Enums"]["product_style"]
          tenant_id: string | null
        }
        Insert: {
          additional_cost?: number | null
          color: string
          created_at?: string | null
          id?: string
          product_id?: string | null
          size: string
          sku_variant: string
          style: Database["public"]["Enums"]["product_style"]
          tenant_id?: string | null
        }
        Update: {
          additional_cost?: number | null
          color?: string
          created_at?: string | null
          id?: string
          product_id?: string | null
          size?: string
          sku_variant?: string
          style?: Database["public"]["Enums"]["product_style"]
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          base_cost: number | null
          category: string | null
          created_at: string | null
          id: string
          name: string
          sale_price: number
          sku: string | null
          style: Database["public"]["Enums"]["product_style"] | null
          tenant_id: string | null
        }
        Insert: {
          base_cost?: number | null
          category?: string | null
          created_at?: string | null
          id?: string
          name: string
          sale_price: number
          sku?: string | null
          style?: Database["public"]["Enums"]["product_style"] | null
          tenant_id?: string | null
        }
        Update: {
          base_cost?: number | null
          category?: string | null
          created_at?: string | null
          id?: string
          name?: string
          sale_price?: number
          sku?: string | null
          style?: Database["public"]["Enums"]["product_style"] | null
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          name: string | null
          tenant_id: string | null
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          name?: string | null
          tenant_id?: string | null
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          name?: string | null
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          created_at: string | null
          created_by: string | null
          customer_id: string | null
          id: string
          tenant_id: string | null
          total: number | null
          type: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          id?: string
          tenant_id?: string | null
          total?: number | null
          type?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          id?: string
          tenant_id?: string | null
          total?: number | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_items: {
        Row: {
          color: string | null
          id: string
          product_id: string | null
          qty: number | null
          sale_id: string | null
          size: string | null
          unit_price: number | null
        }
        Insert: {
          color?: string | null
          id?: string
          product_id?: string | null
          qty?: number | null
          sale_id?: string | null
          size?: string | null
          unit_price?: number | null
        }
        Update: {
          color?: string | null
          id?: string
          product_id?: string | null
          qty?: number | null
          sale_id?: string | null
          size?: string | null
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      seasonality: {
        Row: {
          id: string
          notes: string | null
          period: string | null
          sales_count: number | null
          tenant_id: string | null
        }
        Insert: {
          id?: string
          notes?: string | null
          period?: string | null
          sales_count?: number | null
          tenant_id?: string | null
        }
        Update: {
          id?: string
          notes?: string | null
          period?: string | null
          sales_count?: number | null
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seasonality_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          id: string
          key: string | null
          tenant_id: string | null
          value: string | null
        }
        Insert: {
          id?: string
          key?: string | null
          tenant_id?: string | null
          value?: string | null
        }
        Update: {
          id?: string
          key?: string | null
          tenant_id?: string | null
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number | null
          category: string | null
          date: string | null
          id: string
          notes: string | null
          related_sale_id: string | null
          tenant_id: string | null
          type: string | null
        }
        Insert: {
          amount?: number | null
          category?: string | null
          date?: string | null
          id?: string
          notes?: string | null
          related_sale_id?: string | null
          tenant_id?: string | null
          type?: string | null
        }
        Update: {
          amount?: number | null
          category?: string | null
          date?: string | null
          id?: string
          notes?: string | null
          related_sale_id?: string | null
          tenant_id?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_related_sale_id_fkey"
            columns: ["related_sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          name: string | null
          role: string | null
          tenant_id: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string | null
          role?: string | null
          tenant_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string | null
          role?: string | null
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_finished_products_stock: {
        Row: {
          color: string | null
          id: string | null
          location: string | null
          min_stock: number | null
          product_id: string | null
          product_name: string | null
          product_style: Database["public"]["Enums"]["product_style"] | null
          quantity: number | null
          sale_price: number | null
          size: string | null
          stock_status: string | null
          tenant_id: string | null
          total_value: number | null
          warehouse_section: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      v_low_stock_alerts: {
        Row: {
          color: string | null
          id: string | null
          inventory_type: Database["public"]["Enums"]["inventory_type"] | null
          location: string | null
          min_stock: number | null
          product_name: string | null
          product_style: Database["public"]["Enums"]["product_style"] | null
          quantity: number | null
          size: string | null
          tenant_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      v_raw_materials_stock: {
        Row: {
          color: string | null
          id: string | null
          location: string | null
          min_stock: number | null
          product_id: string | null
          product_name: string | null
          product_style: Database["public"]["Enums"]["product_style"] | null
          quantity: number | null
          size: string | null
          stock_status: string | null
          tenant_id: string | null
          warehouse_section: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      generate_batch_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_tenant_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_my_tenant_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      inventory_type: "raw_material" | "finished_product"
      material_type: "blank_shirt" | "ink" | "packaging" | "supply"
      movement_type:
        | "purchase"
        | "production"
        | "sale"
        | "consignment_out"
        | "consignment_return"
        | "adjustment"
        | "loss"
        | "transfer"
      product_style: "T-Shirt" | "Oversized"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      inventory_type: ["raw_material", "finished_product"],
      material_type: ["blank_shirt", "ink", "packaging", "supply"],
      movement_type: [
        "purchase",
        "production",
        "sale",
        "consignment_out",
        "consignment_return",
        "adjustment",
        "loss",
        "transfer",
      ],
      product_style: ["T-Shirt", "Oversized"],
    },
  },
} as const
