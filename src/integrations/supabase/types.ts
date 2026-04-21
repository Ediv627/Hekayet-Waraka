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
    PostgrestVersion: "14.1";
  };
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string;
          display_order: number;
          has_offer: boolean;
          id: string;
          image_url: string | null;
          name: string;
        };
        Insert: {
          created_at?: string;
          display_order?: number;
          has_offer?: boolean;
          id?: string;
          image_url?: string | null;
          name: string;
        };
        Update: {
          created_at?: string;
          display_order?: number;
          has_offer?: boolean;
          id?: string;
          image_url?: string | null;
          name?: string;
        };
        Relationships: [];
      };
      delivery_fees: {
        Row: {
          created_at: string;
          fee: number;
          governorate: string;
          id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          fee?: number;
          governorate: string;
          id?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          fee?: number;
          governorate?: string;
          id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      delivery_sub_areas: {
        Row: {
          area_name: string;
          created_at: string;
          fee: number;
          governorate: string;
          id: string;
          updated_at: string;
        };
        Insert: {
          area_name: string;
          created_at?: string;
          fee?: number;
          governorate: string;
          id?: string;
          updated_at?: string;
        };
        Update: {
          area_name?: string;
          created_at?: string;
          fee?: number;
          governorate?: string;
          id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      order_items: {
        Row: {
          created_at: string;
          id: string;
          order_id: string;
          product_discount: number | null;
          product_id: string | null;
          product_name: string;
          product_price: number;
          quantity: number;
        };
        Insert: {
          created_at?: string;
          id?: string;
          order_id: string;
          product_discount?: number | null;
          product_id?: string | null;
          product_name: string;
          product_price: number;
          quantity?: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          order_id?: string;
          product_discount?: number | null;
          product_id?: string | null;
          product_name?: string;
          product_price?: number;
          quantity?: number;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      orders: {
        Row: {
          city: string;
          created_at: string;
          customer_name: string;
          customer_phone: string;
          delivery_fee: number;
          full_address: string;
          governorate: string;
          id: string;
          notes: string | null;
          payment_method: string;
          status: Database["public"]["Enums"]["order_status"];
          subtotal: number;
          total: number;
          transfer_image_url: string | null;
          updated_at: string;
        };
        Insert: {
          city: string;
          created_at?: string;
          customer_name: string;
          customer_phone: string;
          delivery_fee?: number;
          full_address: string;
          governorate: string;
          id?: string;
          notes?: string | null;
          payment_method: string;
          status?: Database["public"]["Enums"]["order_status"];
          subtotal?: number;
          total?: number;
          transfer_image_url?: string | null;
          updated_at?: string;
        };
        Update: {
          city?: string;
          created_at?: string;
          customer_name?: string;
          customer_phone?: string;
          delivery_fee?: number;
          full_address?: string;
          governorate?: string;
          id?: string;
          notes?: string | null;
          payment_method?: string;
          status?: Database["public"]["Enums"]["order_status"];
          subtotal?: number;
          total?: number;
          transfer_image_url?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      product_images: {
        Row: {
          created_at: string;
          display_order: number;
          id: string;
          image_url: string;
          product_id: string;
        };
        Insert: {
          created_at?: string;
          display_order?: number;
          id?: string;
          image_url: string;
          product_id: string;
        };
        Update: {
          created_at?: string;
          display_order?: number;
          id?: string;
          image_url?: string;
          product_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      product_variants: {
        Row: {
          created_at: string;
          display_order: number;
          id: string;
          label: string;
          price: number;
          product_id: string;
        };
        Insert: {
          created_at?: string;
          display_order?: number;
          id?: string;
          label: string;
          price?: number;
          product_id: string;
        };
        Update: {
          created_at?: string;
          display_order?: number;
          id?: string;
          label?: string;
          price?: number;
          product_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          category_id: string | null;
          created_at: string;
          description: string | null;
          discount: number | null;
          id: string;
          image: string | null;
          is_available: boolean;
          name: string;
          price: number;
          stock_count: number | null;
        };
        Insert: {
          category_id?: string | null;
          created_at?: string;
          description?: string | null;
          discount?: number | null;
          id?: string;
          image?: string | null;
          is_available?: boolean;
          name: string;
          price?: number;
          stock_count?: number | null;
        };
        Update: {
          category_id?: string | null;
          created_at?: string;
          description?: string | null;
          discount?: number | null;
          id?: string;
          image?: string | null;
          is_available?: boolean;
          name?: string;
          price?: number;
          stock_count?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      rate_limit_log: {
        Row: {
          created_at: string;
          id: string;
          identifier: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          identifier: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          identifier?: string;
        };
        Relationships: [];
      };
      store_settings: {
        Row: {
          created_at: string;
          id: string;
          key: string;
          updated_at: string;
          value: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          key: string;
          updated_at?: string;
          value: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          key?: string;
          updated_at?: string;
          value?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      app_role: "admin" | "customer";
      order_status:
        | "pending"
        | "confirmed"
        | "processing"
        | "shipped"
        | "delivered"
        | "cancelled";
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
  public: {
    Enums: {
      app_role: ["admin", "customer"],
      order_status: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ],
    },
  },
} as const;
