export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15";
  };
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      arrival_checks: {
        Row: {
          checked_at: string;
          checked_by: string;
          condition: Database["public"]["Enums"]["arrival_condition"];
          id: string;
          notes: string | null;
          package_id: string;
          shipment_id: string;
        };
        Insert: {
          checked_at?: string;
          checked_by: string;
          condition: Database["public"]["Enums"]["arrival_condition"];
          id?: string;
          notes?: string | null;
          package_id: string;
          shipment_id: string;
        };
        Update: {
          checked_at?: string;
          checked_by?: string;
          condition?: Database["public"]["Enums"]["arrival_condition"];
          id?: string;
          notes?: string | null;
          package_id?: string;
          shipment_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "arrival_checks_checked_by_fkey";
            columns: ["checked_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "arrival_checks_package_id_fkey";
            columns: ["package_id"];
            isOneToOne: false;
            referencedRelation: "packages";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "arrival_checks_shipment_id_fkey";
            columns: ["shipment_id"];
            isOneToOne: false;
            referencedRelation: "shipments";
            referencedColumns: ["id"];
          },
        ];
      };
      audit_logs: {
        Row: {
          action: string;
          actor_id: string | null;
          created_at: string;
          entity_id: string | null;
          entity_type: string;
          id: string;
          metadata: Json | null;
        };
        Insert: {
          action: string;
          actor_id?: string | null;
          created_at?: string;
          entity_id?: string | null;
          entity_type: string;
          id?: string;
          metadata?: Json | null;
        };
        Update: {
          action?: string;
          actor_id?: string | null;
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string;
          id?: string;
          metadata?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      business_counters: {
        Row: {
          last_value: number;
          scope: string;
          updated_at: string;
        };
        Insert: {
          last_value?: number;
          scope: string;
          updated_at?: string;
        };
        Update: {
          last_value?: number;
          scope?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      closing_packages: {
        Row: {
          actual_weight_snapshot_kg: number | null;
          chargeable_weight_snapshot_kg: number | null;
          closing_id: string;
          created_at: string;
          customer_id_snapshot: string | null;
          id: string;
          is_active: boolean;
          package_id: string;
          shipping_fee_snapshot_idr: number | null;
        };
        Insert: {
          actual_weight_snapshot_kg?: number | null;
          chargeable_weight_snapshot_kg?: number | null;
          closing_id: string;
          created_at?: string;
          customer_id_snapshot?: string | null;
          id?: string;
          is_active?: boolean;
          package_id: string;
          shipping_fee_snapshot_idr?: number | null;
        };
        Update: {
          actual_weight_snapshot_kg?: number | null;
          chargeable_weight_snapshot_kg?: number | null;
          closing_id?: string;
          created_at?: string;
          customer_id_snapshot?: string | null;
          id?: string;
          is_active?: boolean;
          package_id?: string;
          shipping_fee_snapshot_idr?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "closing_packages_closing_id_fkey";
            columns: ["closing_id"];
            isOneToOne: false;
            referencedRelation: "closings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "closing_packages_customer_id_snapshot_fkey";
            columns: ["customer_id_snapshot"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "closing_packages_package_id_fkey";
            columns: ["package_id"];
            isOneToOne: false;
            referencedRelation: "packages";
            referencedColumns: ["id"];
          },
        ];
      };
      closings: {
        Row: {
          cancellation_reason: string | null;
          closing_date: string;
          code: string;
          created_at: string;
          created_by: string;
          finalized_at: string | null;
          finalized_by: string | null;
          id: string;
          notes: string | null;
          package_count: number;
          status: Database["public"]["Enums"]["closing_status"];
          total_actual_weight_kg: number;
          total_amount_idr: number;
          total_chargeable_weight_kg: number;
          updated_at: string;
        };
        Insert: {
          cancellation_reason?: string | null;
          closing_date: string;
          code: string;
          created_at?: string;
          created_by: string;
          finalized_at?: string | null;
          finalized_by?: string | null;
          id?: string;
          notes?: string | null;
          package_count?: number;
          status?: Database["public"]["Enums"]["closing_status"];
          total_actual_weight_kg?: number;
          total_amount_idr?: number;
          total_chargeable_weight_kg?: number;
          updated_at?: string;
        };
        Update: {
          cancellation_reason?: string | null;
          closing_date?: string;
          code?: string;
          created_at?: string;
          created_by?: string;
          finalized_at?: string | null;
          finalized_by?: string | null;
          id?: string;
          notes?: string | null;
          package_count?: number;
          status?: Database["public"]["Enums"]["closing_status"];
          total_actual_weight_kg?: number;
          total_amount_idr?: number;
          total_chargeable_weight_kg?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "closings_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "closings_finalized_by_fkey";
            columns: ["finalized_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      customers: {
        Row: {
          address: string | null;
          code: string;
          created_at: string;
          id: string;
          is_active: boolean;
          name: string;
          normalized_name: string | null;
          notes: string | null;
          phone: string | null;
          updated_at: string;
        };
        Insert: {
          address?: string | null;
          code: string;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name: string;
          normalized_name?: string | null;
          notes?: string | null;
          phone?: string | null;
          updated_at?: string;
        };
        Update: {
          address?: string | null;
          code?: string;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name?: string;
          normalized_name?: string | null;
          notes?: string | null;
          phone?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      expenses: {
        Row: {
          amount_idr: number;
          category: Database["public"]["Enums"]["expense_category"];
          closing_id: string | null;
          created_at: string;
          created_by: string;
          description: string;
          expense_date: string;
          id: string;
          notes: string | null;
          shipment_id: string | null;
          updated_at: string;
        };
        Insert: {
          amount_idr: number;
          category: Database["public"]["Enums"]["expense_category"];
          closing_id?: string | null;
          created_at?: string;
          created_by: string;
          description: string;
          expense_date: string;
          id?: string;
          notes?: string | null;
          shipment_id?: string | null;
          updated_at?: string;
        };
        Update: {
          amount_idr?: number;
          category?: Database["public"]["Enums"]["expense_category"];
          closing_id?: string | null;
          created_at?: string;
          created_by?: string;
          description?: string;
          expense_date?: string;
          id?: string;
          notes?: string | null;
          shipment_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "expenses_closing_id_fkey";
            columns: ["closing_id"];
            isOneToOne: false;
            referencedRelation: "closings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "expenses_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "expenses_shipment_id_fkey";
            columns: ["shipment_id"];
            isOneToOne: false;
            referencedRelation: "shipments";
            referencedColumns: ["id"];
          },
        ];
      };
      invoice_items: {
        Row: {
          amount_idr: number;
          created_at: string;
          description: string | null;
          id: string;
          invoice_id: string;
          package_id: string;
        };
        Insert: {
          amount_idr: number;
          created_at?: string;
          description?: string | null;
          id?: string;
          invoice_id: string;
          package_id: string;
        };
        Update: {
          amount_idr?: number;
          created_at?: string;
          description?: string | null;
          id?: string;
          invoice_id?: string;
          package_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey";
            columns: ["invoice_id"];
            isOneToOne: false;
            referencedRelation: "invoices";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invoice_items_package_id_fkey";
            columns: ["package_id"];
            isOneToOne: false;
            referencedRelation: "packages";
            referencedColumns: ["id"];
          },
        ];
      };
      invoices: {
        Row: {
          balance_idr: number;
          closing_id: string;
          code: string;
          created_at: string;
          customer_id: string;
          id: string;
          notes: string | null;
          paid_idr: number;
          status: Database["public"]["Enums"]["invoice_status"];
          total_idr: number;
          updated_at: string;
        };
        Insert: {
          balance_idr: number;
          closing_id: string;
          code: string;
          created_at?: string;
          customer_id: string;
          id?: string;
          notes?: string | null;
          paid_idr?: number;
          status?: Database["public"]["Enums"]["invoice_status"];
          total_idr: number;
          updated_at?: string;
        };
        Update: {
          balance_idr?: number;
          closing_id?: string;
          code?: string;
          created_at?: string;
          customer_id?: string;
          id?: string;
          notes?: string | null;
          paid_idr?: number;
          status?: Database["public"]["Enums"]["invoice_status"];
          total_idr?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "invoices_closing_id_fkey";
            columns: ["closing_id"];
            isOneToOne: false;
            referencedRelation: "closings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invoices_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
        ];
      };
      login_rate_limits: {
        Row: {
          attempts: number;
          blocked_until: string | null;
          identifier_hash: string;
          window_started_at: string;
        };
        Insert: {
          attempts?: number;
          blocked_until?: string | null;
          identifier_hash: string;
          window_started_at?: string;
        };
        Update: {
          attempts?: number;
          blocked_until?: string | null;
          identifier_hash?: string;
          window_started_at?: string;
        };
        Relationships: [];
      };
      package_attachments: {
        Row: {
          created_at: string;
          id: string;
          mime_type: string | null;
          original_filename: string | null;
          package_id: string;
          size_bytes: number | null;
          storage_path: string;
          type: Database["public"]["Enums"]["package_attachment_type"];
          uploaded_by: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          mime_type?: string | null;
          original_filename?: string | null;
          package_id: string;
          size_bytes?: number | null;
          storage_path: string;
          type: Database["public"]["Enums"]["package_attachment_type"];
          uploaded_by: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          mime_type?: string | null;
          original_filename?: string | null;
          package_id?: string;
          size_bytes?: number | null;
          storage_path?: string;
          type?: Database["public"]["Enums"]["package_attachment_type"];
          uploaded_by?: string;
        };
        Relationships: [
          {
            foreignKeyName: "package_attachments_package_id_fkey";
            columns: ["package_id"];
            isOneToOne: false;
            referencedRelation: "packages";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "package_attachments_uploaded_by_fkey";
            columns: ["uploaded_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      package_status_history: {
        Row: {
          actor_id: string;
          created_at: string;
          from_status: Database["public"]["Enums"]["package_status"] | null;
          id: string;
          package_id: string;
          reason: string | null;
          to_status: Database["public"]["Enums"]["package_status"];
        };
        Insert: {
          actor_id: string;
          created_at?: string;
          from_status?: Database["public"]["Enums"]["package_status"] | null;
          id?: string;
          package_id: string;
          reason?: string | null;
          to_status: Database["public"]["Enums"]["package_status"];
        };
        Update: {
          actor_id?: string;
          created_at?: string;
          from_status?: Database["public"]["Enums"]["package_status"] | null;
          id?: string;
          package_id?: string;
          reason?: string | null;
          to_status?: Database["public"]["Enums"]["package_status"];
        };
        Relationships: [
          {
            foreignKeyName: "package_status_history_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "package_status_history_package_id_fkey";
            columns: ["package_id"];
            isOneToOne: false;
            referencedRelation: "packages";
            referencedColumns: ["id"];
          },
        ];
      };
      packages: {
        Row: {
          actual_weight_kg: number | null;
          charge_type: Database["public"]["Enums"]["package_charge_type"];
          chargeable_weight_kg: number | null;
          courier: string | null;
          created_at: string;
          created_by: string;
          customer_id: string | null;
          duplicate_override: boolean;
          duplicate_override_reason: string | null;
          height_cm: number | null;
          id: string;
          length_cm: number | null;
          normalized_tracking_number: string;
          notes: string | null;
          package_code: string;
          pricing_snapshot: Json | null;
          rate_config_id: string | null;
          received_at: string;
          received_date: string;
          received_time: string | null;
          shipping_fee_idr: number;
          status: Database["public"]["Enums"]["package_status"];
          storage_location: string | null;
          tracking_number: string;
          updated_at: string;
          updated_by: string;
          volumetric_weight_kg: number | null;
          width_cm: number | null;
        };
        Insert: {
          actual_weight_kg?: number | null;
          charge_type: Database["public"]["Enums"]["package_charge_type"];
          chargeable_weight_kg?: number | null;
          courier?: string | null;
          created_at?: string;
          created_by: string;
          customer_id?: string | null;
          duplicate_override?: boolean;
          duplicate_override_reason?: string | null;
          height_cm?: number | null;
          id?: string;
          length_cm?: number | null;
          normalized_tracking_number: string;
          notes?: string | null;
          package_code: string;
          pricing_snapshot?: Json | null;
          rate_config_id?: string | null;
          received_at: string;
          received_date: string;
          received_time?: string | null;
          shipping_fee_idr?: number;
          status?: Database["public"]["Enums"]["package_status"];
          storage_location?: string | null;
          tracking_number: string;
          updated_at?: string;
          updated_by: string;
          volumetric_weight_kg?: number | null;
          width_cm?: number | null;
        };
        Update: {
          actual_weight_kg?: number | null;
          charge_type?: Database["public"]["Enums"]["package_charge_type"];
          chargeable_weight_kg?: number | null;
          courier?: string | null;
          created_at?: string;
          created_by?: string;
          customer_id?: string | null;
          duplicate_override?: boolean;
          duplicate_override_reason?: string | null;
          height_cm?: number | null;
          id?: string;
          length_cm?: number | null;
          normalized_tracking_number?: string;
          notes?: string | null;
          package_code?: string;
          pricing_snapshot?: Json | null;
          rate_config_id?: string | null;
          received_at?: string;
          received_date?: string;
          received_time?: string | null;
          shipping_fee_idr?: number;
          status?: Database["public"]["Enums"]["package_status"];
          storage_location?: string | null;
          tracking_number?: string;
          updated_at?: string;
          updated_by?: string;
          volumetric_weight_kg?: number | null;
          width_cm?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "packages_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "packages_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "packages_rate_config_id_fkey";
            columns: ["rate_config_id"];
            isOneToOne: false;
            referencedRelation: "rate_configs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "packages_updated_by_fkey";
            columns: ["updated_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      payments: {
        Row: {
          amount_idr: number;
          created_at: string;
          created_by: string;
          id: string;
          idempotency_key: string;
          invoice_id: string;
          method: Database["public"]["Enums"]["payment_method"];
          notes: string | null;
          paid_at: string;
          reference: string | null;
        };
        Insert: {
          amount_idr: number;
          created_at?: string;
          created_by: string;
          id?: string;
          idempotency_key: string;
          invoice_id: string;
          method: Database["public"]["Enums"]["payment_method"];
          notes?: string | null;
          paid_at: string;
          reference?: string | null;
        };
        Update: {
          amount_idr?: number;
          created_at?: string;
          created_by?: string;
          id?: string;
          idempotency_key?: string;
          invoice_id?: string;
          method?: Database["public"]["Enums"]["payment_method"];
          notes?: string | null;
          paid_at?: string;
          reference?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "payments_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payments_invoice_id_fkey";
            columns: ["invoice_id"];
            isOneToOne: false;
            referencedRelation: "invoices";
            referencedColumns: ["id"];
          },
        ];
      };
      pickup_packages: {
        Row: {
          package_id: string;
          pickup_id: string;
        };
        Insert: {
          package_id: string;
          pickup_id: string;
        };
        Update: {
          package_id?: string;
          pickup_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pickup_packages_package_id_fkey";
            columns: ["package_id"];
            isOneToOne: true;
            referencedRelation: "packages";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pickup_packages_pickup_id_fkey";
            columns: ["pickup_id"];
            isOneToOne: false;
            referencedRelation: "pickups";
            referencedColumns: ["id"];
          },
        ];
      };
      pickups: {
        Row: {
          created_at: string;
          created_by: string;
          customer_id: string;
          id: string;
          idempotency_key: string;
          notes: string | null;
          picked_up_at: string;
          recipient_name: string | null;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          customer_id: string;
          id?: string;
          idempotency_key: string;
          notes?: string | null;
          picked_up_at: string;
          recipient_name?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          customer_id?: string;
          id?: string;
          idempotency_key?: string;
          notes?: string | null;
          picked_up_at?: string;
          recipient_name?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "pickups_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pickups_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          id: string;
          is_active: boolean;
          name: string;
          role: Database["public"]["Enums"]["internal_user_role"];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id: string;
          is_active?: boolean;
          name: string;
          role: Database["public"]["Enums"]["internal_user_role"];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name?: string;
          role?: Database["public"]["Enums"]["internal_user_role"];
          updated_at?: string;
        };
        Relationships: [];
      };
      rate_configs: {
        Row: {
          created_at: string;
          id: string;
          is_active: boolean;
          minimum_charge_idr: number | null;
          name: string;
          notes: string | null;
          rate_per_kg_idr: number | null;
          rounding_step_kg: number | null;
          updated_at: string;
          valid_from: string | null;
          valid_until: string | null;
          volumetric_divisor: number | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          minimum_charge_idr?: number | null;
          name: string;
          notes?: string | null;
          rate_per_kg_idr?: number | null;
          rounding_step_kg?: number | null;
          updated_at?: string;
          valid_from?: string | null;
          valid_until?: string | null;
          volumetric_divisor?: number | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          minimum_charge_idr?: number | null;
          name?: string;
          notes?: string | null;
          rate_per_kg_idr?: number | null;
          rounding_step_kg?: number | null;
          updated_at?: string;
          valid_from?: string | null;
          valid_until?: string | null;
          volumetric_divisor?: number | null;
        };
        Relationships: [];
      };
      shipment_closings: {
        Row: {
          closing_id: string;
          created_at: string;
          shipment_id: string;
        };
        Insert: {
          closing_id: string;
          created_at?: string;
          shipment_id: string;
        };
        Update: {
          closing_id?: string;
          created_at?: string;
          shipment_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "shipment_closings_closing_id_fkey";
            columns: ["closing_id"];
            isOneToOne: true;
            referencedRelation: "closings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "shipment_closings_shipment_id_fkey";
            columns: ["shipment_id"];
            isOneToOne: false;
            referencedRelation: "shipments";
            referencedColumns: ["id"];
          },
        ];
      };
      shipments: {
        Row: {
          actual_arrival_at: string | null;
          code: string;
          created_at: string;
          created_by: string;
          departure_at: string | null;
          estimated_arrival_at: string | null;
          id: string;
          notes: string | null;
          status: Database["public"]["Enums"]["shipment_status"];
          updated_at: string;
          vessel_name: string | null;
        };
        Insert: {
          actual_arrival_at?: string | null;
          code: string;
          created_at?: string;
          created_by: string;
          departure_at?: string | null;
          estimated_arrival_at?: string | null;
          id?: string;
          notes?: string | null;
          status?: Database["public"]["Enums"]["shipment_status"];
          updated_at?: string;
          vessel_name?: string | null;
        };
        Update: {
          actual_arrival_at?: string | null;
          code?: string;
          created_at?: string;
          created_by?: string;
          departure_at?: string | null;
          estimated_arrival_at?: string | null;
          id?: string;
          notes?: string | null;
          status?: Database["public"]["Enums"]["shipment_status"];
          updated_at?: string;
          vessel_name?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "shipments_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      system_settings: {
        Row: {
          key: string;
          updated_at: string;
          updated_by: string | null;
          value: Json;
        };
        Insert: {
          key: string;
          updated_at?: string;
          updated_by?: string | null;
          value: Json;
        };
        Update: {
          key?: string;
          updated_at?: string;
          updated_by?: string | null;
          value?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "system_settings_updated_by_fkey";
            columns: ["updated_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      cancel_closing: {
        Args: { p_actor_id: string; p_closing_id: string; p_reason: string };
        Returns: string;
      };
      complete_pickup: {
        Args: {
          p_actor_id: string;
          p_customer_id: string;
          p_idempotency_key: string;
          p_notes: string;
          p_package_ids: string[];
          p_picked_up_at: string;
          p_recipient_name: string;
        };
        Returns: string;
      };
      depart_shipment: {
        Args: {
          p_actor_id: string;
          p_departure_at: string;
          p_shipment_id: string;
        };
        Returns: string;
      };
      finalize_closing: {
        Args: { p_actor_id: string; p_closing_id: string };
        Returns: string;
      };
      next_business_code: {
        Args: { p_date?: string; p_prefix: string; p_scope: string };
        Returns: string;
      };
      reconcile_shipment: {
        Args: {
          p_actor_id: string;
          p_confirm_missing: boolean;
          p_shipment_id: string;
        };
        Returns: string;
      };
      record_payment: {
        Args: {
          p_actor_id: string;
          p_amount: number;
          p_idempotency_key: string;
          p_invoice_id: string;
          p_method: Database["public"]["Enums"]["payment_method"];
          p_notes: string;
          p_paid_at: string;
          p_reference: string;
        };
        Returns: string;
      };
      search_customer_suggestions: {
        Args: { p_limit?: number; p_query: string };
        Returns: {
          code: string;
          id: string;
          name: string;
          similarity_score: number;
        }[];
      };
    };
    Enums: {
      arrival_condition: "OK" | "DAMAGED";
      closing_status:
        | "DRAFT"
        | "FINALIZED"
        | "IN_SHIPMENT"
        | "ARRIVED"
        | "COMPLETED"
        | "CANCELLED";
      expense_category:
        | "SEA_FREIGHT"
        | "TRANSPORT"
        | "PACKAGING"
        | "SALARY"
        | "RENT"
        | "OPERATIONS"
        | "OTHER";
      internal_user_role: "ADMIN" | "STAFF_SIDOARJO" | "STAFF_MERAUKE";
      invoice_status: "UNPAID" | "PARTIAL" | "PAID" | "VOID";
      package_attachment_type: "RECEIVED" | "ARRIVAL" | "DAMAGED" | "OTHER";
      package_charge_type: "WEIGHT" | "VOLUMETRIC" | "FIXED" | "MANUAL";
      package_status:
        | "WAITING_CLOSING"
        | "READY_TO_SHIP"
        | "IN_TRANSIT"
        | "ARRIVED_MERAUKE"
        | "READY_FOR_PICKUP"
        | "COMPLETED"
        | "HOLD"
        | "DAMAGED"
        | "MISSING";
      payment_method: "CASH" | "BANK_TRANSFER" | "OTHER";
      shipment_status:
        | "DRAFT"
        | "READY"
        | "DEPARTED"
        | "ARRIVED"
        | "RECONCILED"
        | "COMPLETED"
        | "CANCELLED";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null;
          avif_autodetection: boolean | null;
          created_at: string | null;
          file_size_limit: number | null;
          id: string;
          name: string;
          owner: string | null;
          owner_id: string | null;
          public: boolean | null;
          type: Database["storage"]["Enums"]["buckettype"];
          updated_at: string | null;
        };
        Insert: {
          allowed_mime_types?: string[] | null;
          avif_autodetection?: boolean | null;
          created_at?: string | null;
          file_size_limit?: number | null;
          id: string;
          name: string;
          owner?: string | null;
          owner_id?: string | null;
          public?: boolean | null;
          type?: Database["storage"]["Enums"]["buckettype"];
          updated_at?: string | null;
        };
        Update: {
          allowed_mime_types?: string[] | null;
          avif_autodetection?: boolean | null;
          created_at?: string | null;
          file_size_limit?: number | null;
          id?: string;
          name?: string;
          owner?: string | null;
          owner_id?: string | null;
          public?: boolean | null;
          type?: Database["storage"]["Enums"]["buckettype"];
          updated_at?: string | null;
        };
        Relationships: [];
      };
      buckets_analytics: {
        Row: {
          created_at: string;
          deleted_at: string | null;
          format: string;
          id: string;
          name: string;
          type: Database["storage"]["Enums"]["buckettype"];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          deleted_at?: string | null;
          format?: string;
          id?: string;
          name: string;
          type?: Database["storage"]["Enums"]["buckettype"];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          deleted_at?: string | null;
          format?: string;
          id?: string;
          name?: string;
          type?: Database["storage"]["Enums"]["buckettype"];
          updated_at?: string;
        };
        Relationships: [];
      };
      buckets_vectors: {
        Row: {
          created_at: string;
          id: string;
          type: Database["storage"]["Enums"]["buckettype"];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id: string;
          type?: Database["storage"]["Enums"]["buckettype"];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          type?: Database["storage"]["Enums"]["buckettype"];
          updated_at?: string;
        };
        Relationships: [];
      };
      migrations: {
        Row: {
          executed_at: string | null;
          hash: string;
          id: number;
          name: string;
        };
        Insert: {
          executed_at?: string | null;
          hash: string;
          id: number;
          name: string;
        };
        Update: {
          executed_at?: string | null;
          hash?: string;
          id?: number;
          name?: string;
        };
        Relationships: [];
      };
      objects: {
        Row: {
          bucket_id: string | null;
          created_at: string | null;
          id: string;
          last_accessed_at: string | null;
          metadata: Json | null;
          name: string | null;
          owner: string | null;
          owner_id: string | null;
          path_tokens: string[] | null;
          updated_at: string | null;
          user_metadata: Json | null;
          version: string | null;
        };
        Insert: {
          bucket_id?: string | null;
          created_at?: string | null;
          id?: string;
          last_accessed_at?: string | null;
          metadata?: Json | null;
          name?: string | null;
          owner?: string | null;
          owner_id?: string | null;
          path_tokens?: string[] | null;
          updated_at?: string | null;
          user_metadata?: Json | null;
          version?: string | null;
        };
        Update: {
          bucket_id?: string | null;
          created_at?: string | null;
          id?: string;
          last_accessed_at?: string | null;
          metadata?: Json | null;
          name?: string | null;
          owner?: string | null;
          owner_id?: string | null;
          path_tokens?: string[] | null;
          updated_at?: string | null;
          user_metadata?: Json | null;
          version?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "objects_bucketId_fkey";
            columns: ["bucket_id"];
            isOneToOne: false;
            referencedRelation: "buckets";
            referencedColumns: ["id"];
          },
        ];
      };
      s3_multipart_uploads: {
        Row: {
          bucket_id: string;
          created_at: string;
          id: string;
          in_progress_size: number;
          key: string;
          metadata: Json | null;
          owner_id: string | null;
          upload_signature: string;
          user_metadata: Json | null;
          version: string;
        };
        Insert: {
          bucket_id: string;
          created_at?: string;
          id: string;
          in_progress_size?: number;
          key: string;
          metadata?: Json | null;
          owner_id?: string | null;
          upload_signature: string;
          user_metadata?: Json | null;
          version: string;
        };
        Update: {
          bucket_id?: string;
          created_at?: string;
          id?: string;
          in_progress_size?: number;
          key?: string;
          metadata?: Json | null;
          owner_id?: string | null;
          upload_signature?: string;
          user_metadata?: Json | null;
          version?: string;
        };
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_bucket_id_fkey";
            columns: ["bucket_id"];
            isOneToOne: false;
            referencedRelation: "buckets";
            referencedColumns: ["id"];
          },
        ];
      };
      s3_multipart_uploads_parts: {
        Row: {
          bucket_id: string;
          created_at: string;
          etag: string;
          id: string;
          key: string;
          owner_id: string | null;
          part_number: number;
          size: number;
          upload_id: string;
          version: string;
        };
        Insert: {
          bucket_id: string;
          created_at?: string;
          etag: string;
          id?: string;
          key: string;
          owner_id?: string | null;
          part_number: number;
          size?: number;
          upload_id: string;
          version: string;
        };
        Update: {
          bucket_id?: string;
          created_at?: string;
          etag?: string;
          id?: string;
          key?: string;
          owner_id?: string | null;
          part_number?: number;
          size?: number;
          upload_id?: string;
          version?: string;
        };
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_parts_bucket_id_fkey";
            columns: ["bucket_id"];
            isOneToOne: false;
            referencedRelation: "buckets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "s3_multipart_uploads_parts_upload_id_fkey";
            columns: ["upload_id"];
            isOneToOne: false;
            referencedRelation: "s3_multipart_uploads";
            referencedColumns: ["id"];
          },
        ];
      };
      vector_indexes: {
        Row: {
          bucket_id: string;
          created_at: string;
          data_type: string;
          dimension: number;
          distance_metric: string;
          id: string;
          metadata_configuration: Json | null;
          name: string;
          updated_at: string;
        };
        Insert: {
          bucket_id: string;
          created_at?: string;
          data_type: string;
          dimension: number;
          distance_metric: string;
          id?: string;
          metadata_configuration?: Json | null;
          name: string;
          updated_at?: string;
        };
        Update: {
          bucket_id?: string;
          created_at?: string;
          data_type?: string;
          dimension?: number;
          distance_metric?: string;
          id?: string;
          metadata_configuration?: Json | null;
          name?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "vector_indexes_bucket_id_fkey";
            columns: ["bucket_id"];
            isOneToOne: false;
            referencedRelation: "buckets_vectors";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      allow_any_operation: {
        Args: { expected_operations: string[] };
        Returns: boolean;
      };
      allow_only_operation: {
        Args: { expected_operation: string };
        Returns: boolean;
      };
      can_insert_object: {
        Args: { bucketid: string; metadata: Json; name: string; owner: string };
        Returns: undefined;
      };
      extension: { Args: { name: string }; Returns: string };
      filename: { Args: { name: string }; Returns: string };
      foldername: { Args: { name: string }; Returns: string[] };
      get_common_prefix: {
        Args: { p_delimiter: string; p_key: string; p_prefix: string };
        Returns: string;
      };
      get_size_by_bucket: {
        Args: never;
        Returns: {
          bucket_id: string;
          size: number;
        }[];
      };
      list_multipart_uploads_with_delimiter: {
        Args: {
          bucket_id: string;
          delimiter_param: string;
          max_keys?: number;
          next_key_token?: string;
          next_upload_token?: string;
          prefix_param: string;
        };
        Returns: {
          created_at: string;
          id: string;
          key: string;
        }[];
      };
      list_objects_with_delimiter: {
        Args: {
          _bucket_id: string;
          delimiter_param: string;
          max_keys?: number;
          next_token?: string;
          prefix_param: string;
          sort_order?: string;
          start_after?: string;
        };
        Returns: {
          created_at: string;
          id: string;
          last_accessed_at: string;
          metadata: Json;
          name: string;
          updated_at: string;
        }[];
      };
      operation: { Args: never; Returns: string };
      search: {
        Args: {
          bucketname: string;
          levels?: number;
          limits?: number;
          offsets?: number;
          prefix: string;
          search?: string;
          sortcolumn?: string;
          sortorder?: string;
        };
        Returns: {
          created_at: string;
          id: string;
          last_accessed_at: string;
          metadata: Json;
          name: string;
          updated_at: string;
        }[];
      };
      search_by_timestamp: {
        Args: {
          p_bucket_id: string;
          p_level: number;
          p_limit: number;
          p_prefix: string;
          p_sort_column: string;
          p_sort_column_after: string;
          p_sort_order: string;
          p_start_after: string;
        };
        Returns: {
          created_at: string;
          id: string;
          key: string;
          last_accessed_at: string;
          metadata: Json;
          name: string;
          updated_at: string;
        }[];
      };
      search_v2: {
        Args: {
          bucket_name: string;
          levels?: number;
          limits?: number;
          prefix: string;
          sort_column?: string;
          sort_column_after?: string;
          sort_order?: string;
          start_after?: string;
        };
        Returns: {
          created_at: string;
          id: string;
          key: string;
          last_accessed_at: string;
          metadata: Json;
          name: string;
          updated_at: string;
        }[];
      };
    };
    Enums: {
      buckettype: "STANDARD" | "ANALYTICS" | "VECTOR";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      arrival_condition: ["OK", "DAMAGED"],
      closing_status: [
        "DRAFT",
        "FINALIZED",
        "IN_SHIPMENT",
        "ARRIVED",
        "COMPLETED",
        "CANCELLED",
      ],
      expense_category: [
        "SEA_FREIGHT",
        "TRANSPORT",
        "PACKAGING",
        "SALARY",
        "RENT",
        "OPERATIONS",
        "OTHER",
      ],
      internal_user_role: ["ADMIN", "STAFF_SIDOARJO", "STAFF_MERAUKE"],
      invoice_status: ["UNPAID", "PARTIAL", "PAID", "VOID"],
      package_attachment_type: ["RECEIVED", "ARRIVAL", "DAMAGED", "OTHER"],
      package_charge_type: ["WEIGHT", "VOLUMETRIC", "FIXED", "MANUAL"],
      package_status: [
        "WAITING_CLOSING",
        "READY_TO_SHIP",
        "IN_TRANSIT",
        "ARRIVED_MERAUKE",
        "READY_FOR_PICKUP",
        "COMPLETED",
        "HOLD",
        "DAMAGED",
        "MISSING",
      ],
      payment_method: ["CASH", "BANK_TRANSFER", "OTHER"],
      shipment_status: [
        "DRAFT",
        "READY",
        "DEPARTED",
        "ARRIVED",
        "RECONCILED",
        "COMPLETED",
        "CANCELLED",
      ],
    },
  },
  storage: {
    Enums: {
      buckettype: ["STANDARD", "ANALYTICS", "VECTOR"],
    },
  },
} as const;
