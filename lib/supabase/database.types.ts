/**
 * Types for the RecipeNest database (supabase/migrations). Kept in the shape
 * `supabase gen types typescript` produces, so they can be regenerated with:
 *   npx supabase gen types typescript --project-id <id> > lib/supabase/database.types.ts
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Timestamps = { created_at: string; updated_at: string };

export type Database = {
  __InternalSupabase: { PostgrestVersion: "12" };
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          name: string;
          avatar_url: string;
          bio: string;
          location: string;
          role: "user" | "admin";
          status: "active" | "suspended";
        } & Timestamps;
        /** Rows are created by the on_auth_user_created trigger, not by the app. */
        Insert: {
          id: string;
          username: string;
          name: string;
          avatar_url?: string;
          bio?: string;
          location?: string;
        };
        Update: {
          username?: string;
          name?: string;
          avatar_url?: string;
          bio?: string;
          location?: string;
          role?: "user" | "admin";
          status?: "active" | "suspended";
        };
        Relationships: [];
      };
      user_settings: {
        Row: {
          user_id: string;
          diet: string;
          favorite_cuisines: string[];
          default_servings: number;
          meal_plan_reminders: boolean;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          diet?: string;
          favorite_cuisines?: string[];
          default_servings?: number;
          meal_plan_reminders?: boolean;
        };
        Update: {
          diet?: string;
          favorite_cuisines?: string[];
          default_servings?: number;
          meal_plan_reminders?: boolean;
        };
        Relationships: [];
      };
      recipes: {
        Row: {
          id: string;
          slug: string;
          author_id: string;
          title: string;
          description: string;
          image_url: string;
          cuisine: string;
          categories: string[];
          meal_type: string;
          difficulty: "Easy" | "Medium" | "Hard";
          diets: string[];
          prep_minutes: number;
          cook_minutes: number;
          servings: number;
          nutrition: Json;
          tags: string[];
          status: "draft" | "published" | "pending" | "rejected";
        } & Timestamps;
        Insert: {
          id?: string;
          slug: string;
          author_id: string;
          title: string;
          description?: string;
          image_url?: string;
          cuisine: string;
          categories?: string[];
          meal_type: string;
          difficulty: "Easy" | "Medium" | "Hard";
          diets?: string[];
          prep_minutes?: number;
          cook_minutes?: number;
          servings?: number;
          nutrition?: Json;
          tags?: string[];
          status?: "draft" | "published" | "pending" | "rejected";
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["recipes"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "recipes_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      recipe_ingredients: {
        Row: {
          id: string;
          recipe_id: string;
          position: number;
          quantity: number | null;
          unit: string;
          name: string;
          note: string | null;
          aisle: string;
        };
        Insert: {
          id?: string;
          recipe_id: string;
          position: number;
          quantity?: number | null;
          unit?: string;
          name: string;
          note?: string | null;
          aisle: string;
        };
        Update: Partial<Database["public"]["Tables"]["recipe_ingredients"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "recipe_ingredients_recipe_id_fkey";
            columns: ["recipe_id"];
            isOneToOne: false;
            referencedRelation: "recipes";
            referencedColumns: ["id"];
          },
        ];
      };
      recipe_steps: {
        Row: { id: string; recipe_id: string; position: number; text: string; timer_minutes: number | null };
        Insert: { id?: string; recipe_id: string; position: number; text: string; timer_minutes?: number | null };
        Update: Partial<Database["public"]["Tables"]["recipe_steps"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "recipe_steps_recipe_id_fkey";
            columns: ["recipe_id"];
            isOneToOne: false;
            referencedRelation: "recipes";
            referencedColumns: ["id"];
          },
        ];
      };
      favorites: {
        Row: { user_id: string; recipe_slug: string; created_at: string };
        Insert: { user_id: string; recipe_slug: string; created_at?: string };
        Update: { recipe_slug?: string };
        Relationships: [];
      };
      collections: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string;
          cover_url: string | null;
        } & Timestamps;
        Insert: { id?: string; user_id: string; name: string; description?: string; cover_url?: string | null };
        Update: { name?: string; description?: string; cover_url?: string | null; updated_at?: string };
        Relationships: [];
      };
      collection_recipes: {
        Row: { collection_id: string; recipe_slug: string; added_at: string };
        Insert: { collection_id: string; recipe_slug: string; added_at?: string };
        Update: { added_at?: string };
        Relationships: [
          {
            foreignKeyName: "collection_recipes_collection_id_fkey";
            columns: ["collection_id"];
            isOneToOne: false;
            referencedRelation: "collections";
            referencedColumns: ["id"];
          },
        ];
      };
      meal_plan_entries: {
        Row: { user_id: string; day: string; slot: string; recipe_slug: string; servings: number; updated_at: string };
        Insert: { user_id: string; day: string; slot: string; recipe_slug: string; servings: number; updated_at?: string };
        Update: { recipe_slug?: string; servings?: number; updated_at?: string };
        Relationships: [];
      };
      shopping_list_items: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          quantity: number | null;
          unit: string;
          aisle: string;
          checked: boolean;
          sources: string[];
          product_id: string | null;
          product: Json | null;
        } & Timestamps;
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          quantity?: number | null;
          unit?: string;
          aisle: string;
          checked?: boolean;
          sources?: string[];
          product_id?: string | null;
          product?: Json | null;
        };
        Update: Partial<Omit<Database["public"]["Tables"]["shopping_list_items"]["Insert"], "user_id">>;
        Relationships: [];
      };
      reviews: {
        Row: {
          id: string;
          recipe_slug: string;
          author_id: string;
          rating: number;
          text: string;
          created_at: string;
          updated_at: string | null;
          moderated_at: string | null;
        };
        Insert: { id?: string; recipe_slug: string; author_id: string; rating: number; text?: string; updated_at?: string | null };
        Update: { rating?: number; text?: string; updated_at?: string | null };
        Relationships: [
          {
            foreignKeyName: "reviews_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      cooked_log: {
        Row: { user_id: string; recipe_slug: string; cooked_at: string };
        Insert: { user_id: string; recipe_slug: string; cooked_at?: string };
        Update: { cooked_at?: string };
        Relationships: [];
      };
    };
    Views: {
      recipe_ratings: {
        Row: { recipe_slug: string; review_count: number; average_rating: number };
        Relationships: [];
      };
    };
    Functions: {
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean };
      is_active_user: { Args: Record<PropertyKey, never>; Returns: boolean };
      delete_my_account: { Args: Record<PropertyKey, never>; Returns: undefined };
      admin_delete_user: { Args: { target: string }; Returns: undefined };
      username_available: { Args: { candidate: string }; Returns: boolean };
      admin_list_users: {
        Args: Record<PropertyKey, never>;
        Returns: {
          id: string;
          email: string;
          username: string;
          name: string;
          avatar_url: string;
          bio: string;
          location: string;
          role: "user" | "admin";
          status: "active" | "suspended";
          created_at: string;
          is_owner: boolean;
        }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
