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
      commission_statements: {
        Row: {
          closed_at: string | null
          closed_by: string | null
          commission_amount: number
          commission_rate: number
          created_at: string | null
          created_by: string | null
          id: string
          net_amount: number
          notes: string | null
          payment_date: string | null
          payment_proof_url: string | null
          period_end: string
          period_start: string
          representative_id: string
          status: string
          tenant_id: string
          total_sales: number
        }
        Insert: {
          closed_at?: string | null
          closed_by?: string | null
          commission_amount?: number
          commission_rate?: number
          created_at?: string | null
          created_by?: string | null
          id?: string
          net_amount?: number
          notes?: string | null
          payment_date?: string | null
          payment_proof_url?: string | null
          period_end: string
          period_start: string
          representative_id: string
          status?: string
          tenant_id?: string
          total_sales?: number
        }
        Update: {
          closed_at?: string | null
          closed_by?: string | null
          commission_amount?: number
          commission_rate?: number
          created_at?: string | null
          created_by?: string | null
          id?: string
          net_amount?: number
          notes?: string | null
          payment_date?: string | null
          payment_proof_url?: string | null
          period_end?: string
          period_start?: string
          representative_id?: string
          status?: string
          tenant_id?: string
          total_sales?: number
        }
        Relationships: [
          {
            foreignKeyName: "commission_statements_representative_id_fkey"
            columns: ["representative_id"]
            isOneToOne: false
            referencedRelation: "customers"
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
          unit_price: number | null
          used_as_payment: number | null
        }
        Insert: {
          consignment_id: string
          created_at?: string | null
          id?: string
          product_name: string
          quantity?: number
          remaining?: number
          sold?: number
          unit_price?: number | null
          used_as_payment?: number | null
        }
        Update: {
          consignment_id?: string
          created_at?: string | null
          id?: string
          product_name?: string
          quantity?: number
          remaining?: number
          sold?: number
          unit_price?: number | null
          used_as_payment?: number | null
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
          payment_type: string | null
          status: string | null
          stock_payment_value: number | null
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          partner_id?: string | null
          payment_type?: string | null
          status?: string | null
          stock_payment_value?: number | null
          tenant_id?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          partner_id?: string | null
          payment_type?: string | null
          status?: string | null
          stock_payment_value?: number | null
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
      event_stock_allocations: {
        Row: {
          allocated_at: string | null
          allocated_by: string | null
          counted_return: number | null
          divergence: number | null
          divergence_notes: string | null
          event_id: string
          id: string
          inventory_id: string
          quantity_allocated: number
          quantity_returned: number
          quantity_sold: number
          return_confirmed_at: string | null
          return_confirmed_by: string | null
        }
        Insert: {
          allocated_at?: string | null
          allocated_by?: string | null
          counted_return?: number | null
          divergence?: number | null
          divergence_notes?: string | null
          event_id: string
          id?: string
          inventory_id: string
          quantity_allocated: number
          quantity_returned?: number
          quantity_sold?: number
          return_confirmed_at?: string | null
          return_confirmed_by?: string | null
        }
        Update: {
          allocated_at?: string | null
          allocated_by?: string | null
          counted_return?: number | null
          divergence?: number | null
          divergence_notes?: string | null
          event_id?: string
          id?: string
          inventory_id?: string
          quantity_allocated?: number
          quantity_returned?: number
          quantity_sold?: number
          return_confirmed_at?: string | null
          return_confirmed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_stock_allocations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events_stock"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_stock_allocations_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_stock_allocations_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "v_finished_products_stock"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_stock_allocations_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "v_inventory_availability"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_stock_allocations_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "v_low_stock_alerts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_stock_allocations_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "v_raw_materials_stock"
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
      events_stock: {
        Row: {
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          end_date: string | null
          id: string
          location: string | null
          name: string
          notes: string | null
          start_date: string
          status: string
          tenant_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          end_date?: string | null
          id?: string
          location?: string | null
          name: string
          notes?: string | null
          start_date: string
          status?: string
          tenant_id?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          end_date?: string | null
          id?: string
          location?: string | null
          name?: string
          notes?: string | null
          start_date?: string
          status?: string
          tenant_id?: string
        }
        Relationships: []
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
          store_id: string | null
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
          store_id?: string | null
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
          store_id?: string | null
          tenant_id?: string | null
          updated_at?: string | null
          warehouse_section?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "v_inventory_availability"
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
      price_tables: {
        Row: {
          channel: Database["public"]["Enums"]["sales_channel"]
          created_at: string | null
          id: string
          min_quantity: number | null
          price: number
          tenant_id: string | null
          updated_at: string | null
          variant_id: string | null
        }
        Insert: {
          channel: Database["public"]["Enums"]["sales_channel"]
          created_at?: string | null
          id?: string
          min_quantity?: number | null
          price: number
          tenant_id?: string | null
          updated_at?: string | null
          variant_id?: string | null
        }
        Update: {
          channel?: Database["public"]["Enums"]["sales_channel"]
          created_at?: string | null
          id?: string
          min_quantity?: number | null
          price?: number
          tenant_id?: string | null
          updated_at?: string | null
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "price_tables_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
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
          stamp_id: string | null
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
          stamp_id?: string | null
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
          stamp_id?: string | null
          style?: Database["public"]["Enums"]["product_style"] | null
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_stamp_id_fkey"
            columns: ["stamp_id"]
            isOneToOne: false
            referencedRelation: "stamps"
            referencedColumns: ["id"]
          },
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
          channel: Database["public"]["Enums"]["sales_channel"] | null
          commission_rate: number | null
          created_at: string | null
          created_by: string | null
          customer_id: string | null
          id: string
          notes: string | null
          payment_method: string | null
          tenant_id: string | null
          total: number | null
        }
        Insert: {
          channel?: Database["public"]["Enums"]["sales_channel"] | null
          commission_rate?: number | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          tenant_id?: string | null
          total?: number | null
        }
        Update: {
          channel?: Database["public"]["Enums"]["sales_channel"] | null
          commission_rate?: number | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          tenant_id?: string | null
          total?: number | null
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
      stamps: {
        Row: {
          category: string | null
          code: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          code?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          tenant_id?: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          code?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      stock_reservations: {
        Row: {
          created_at: string | null
          expires_at: string
          fulfilled_at: string | null
          id: string
          inventory_id: string
          notes: string | null
          quantity: number
          reference_id: string | null
          reference_type: string | null
          reserved_at: string | null
          reserved_by: string | null
          status: string | null
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          fulfilled_at?: string | null
          id?: string
          inventory_id: string
          notes?: string | null
          quantity: number
          reference_id?: string | null
          reference_type?: string | null
          reserved_at?: string | null
          reserved_by?: string | null
          status?: string | null
          tenant_id?: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          fulfilled_at?: string | null
          id?: string
          inventory_id?: string
          notes?: string | null
          quantity?: number
          reference_id?: string | null
          reference_type?: string | null
          reserved_at?: string | null
          reserved_by?: string | null
          status?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_reservations_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_reservations_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "v_finished_products_stock"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_reservations_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "v_inventory_availability"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_reservations_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "v_low_stock_alerts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_reservations_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "v_raw_materials_stock"
            referencedColumns: ["id"]
          },
        ]
      }
      store_transfers: {
        Row: {
          completed_at: string | null
          completed_by: string | null
          created_at: string | null
          from_store_id: string | null
          id: string
          initiated_by: string | null
          inventory_id: string
          notes: string | null
          quantity: number
          status: string | null
          tenant_id: string
          to_store_id: string
        }
        Insert: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          from_store_id?: string | null
          id?: string
          initiated_by?: string | null
          inventory_id: string
          notes?: string | null
          quantity: number
          status?: string | null
          tenant_id?: string
          to_store_id: string
        }
        Update: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          from_store_id?: string | null
          id?: string
          initiated_by?: string | null
          inventory_id?: string
          notes?: string | null
          quantity?: number
          status?: string | null
          tenant_id?: string
          to_store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_transfers_from_store_id_fkey"
            columns: ["from_store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_transfers_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_transfers_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "v_finished_products_stock"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_transfers_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "v_inventory_availability"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_transfers_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "v_low_stock_alerts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_transfers_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "v_raw_materials_stock"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_transfers_to_store_id_fkey"
            columns: ["to_store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          address: string | null
          code: string
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          phone: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          code: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          phone?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          code?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          phone?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: []
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
          cash_impact: boolean | null
          category: string | null
          date: string | null
          dre_category: string | null
          event_id: string | null
          id: string
          notes: string | null
          related_sale_id: string | null
          tenant_id: string | null
          type: string | null
        }
        Insert: {
          amount?: number | null
          cash_impact?: boolean | null
          category?: string | null
          date?: string | null
          dre_category?: string | null
          event_id?: string | null
          id?: string
          notes?: string | null
          related_sale_id?: string | null
          tenant_id?: string | null
          type?: string | null
        }
        Update: {
          amount?: number | null
          cash_impact?: boolean | null
          category?: string | null
          date?: string | null
          dre_category?: string | null
          event_id?: string | null
          id?: string
          notes?: string | null
          related_sale_id?: string | null
          tenant_id?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events_stock"
            referencedColumns: ["id"]
          },
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
      v_consolidated_inventory: {
        Row: {
          color: string | null
          inventory_type: Database["public"]["Enums"]["inventory_type"] | null
          max_stock: number | null
          min_stock: number | null
          product_id: string | null
          product_style: Database["public"]["Enums"]["product_style"] | null
          size: string | null
          stores_count: number | null
          tenant_id: string | null
          total_available: number | null
          total_quantity: number | null
          total_reserved: number | null
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
      v_inventory_availability: {
        Row: {
          available_quantity: number | null
          color: string | null
          id: string | null
          inventory_type: Database["public"]["Enums"]["inventory_type"] | null
          location: string | null
          max_stock: number | null
          min_stock: number | null
          product_id: string | null
          product_style: Database["public"]["Enums"]["product_style"] | null
          quantity: number | null
          reserved_quantity: number | null
          size: string | null
          store_code: string | null
          store_id: string | null
          store_name: string | null
          tenant_id: string | null
          updated_at: string | null
          warehouse_section: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
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
      allocate_stock_to_event: {
        Args: { p_event_id: string; p_inventory_id: string; p_quantity: number }
        Returns: string
      }
      expire_stock_reservations: { Args: never; Returns: undefined }
      generate_batch_number: { Args: never; Returns: string }
      get_available_stock: { Args: { p_inventory_id: string }; Returns: number }
      get_current_tenant_id: { Args: never; Returns: string }
      get_my_tenant_id: { Args: never; Returns: string }
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
      return_event_stock: {
        Args: { p_allocation_id: string; p_quantity_returned: number }
        Returns: undefined
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
      sales_channel: "online" | "wholesale" | "event" | "store" | "consignment"
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
      sales_channel: ["online", "wholesale", "event", "store", "consignment"],
    },
  },
} as const
