/**
 * Types for the RecipeNest database (supabase/migrations). Kept in the shape
 * `supabase gen types typescript` produces, so they can be regenerated with:
 *   npx supabase gen types typescript --project-id <id> > lib/supabase/database.types.ts
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Timestamps = { created_at: string; updated_at: string };

export type ContactTopic = "general" | "billing" | "refund" | "contest" | "account" | "other";

export type SubscriptionStatus = "none" | "pending" | "active" | "cancelled" | "halted" | "paused" | "completed" | "granted";

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
      /** Written only by the billing functions; members can read their own row. */
      subscriptions: {
        Row: {
          user_id: string;
          premium_until: string | null;
          period: "monthly" | "yearly" | null;
          status: SubscriptionStatus;
          razorpay_subscription_id: string | null;
          updated_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      contests: {
        Row: {
          id: string;
          title: string;
          description: string;
          starts_at: string;
          ends_at: string;
          prize_amount: number;
          winner_entry_id: string | null;
          announced_at: string | null;
          prize_paid: boolean;
          created_at: string;
        };
        Insert: { id?: string; title: string; description?: string; starts_at: string; ends_at: string; prize_amount?: number };
        Update: { title?: string; description?: string; starts_at?: string; ends_at?: string; prize_amount?: number; prize_paid?: boolean };
        Relationships: [];
      };
      contest_entries: {
        Row: { id: string; contest_id: string; recipe_id: string; user_id: string; created_at: string };
        Insert: { id?: string; contest_id: string; recipe_id: string; user_id: string };
        Update: never;
        Relationships: [];
      };
      contest_votes: {
        Row: { entry_id: string; user_id: string; created_at: string };
        Insert: { entry_id: string; user_id: string };
        Update: never;
        Relationships: [];
      };
      lucky_draws: {
        Row: {
          id: string;
          title: string;
          starts_at: string;
          ends_at: string;
          winners_count: number;
          cash_prize: number;
          drawn_at: string | null;
          created_at: string;
        };
        Insert: { id?: string; title?: string; starts_at: string; ends_at: string; winners_count?: number; cash_prize?: number };
        Update: { title?: string; starts_at?: string; ends_at?: string; winners_count?: number; cash_prize?: number };
        Relationships: [];
      };
      lucky_draw_entries: {
        Row: { draw_id: string; user_id: string; winner: boolean; prize_paid: boolean; created_at: string };
        Insert: { draw_id: string; user_id: string };
        Update: never;
        Relationships: [];
      };
      /** Contact page messages: anyone may insert; only admins read them. */
      scheduled_emails: {
        Row: {
          id: string;
          subject: string;
          message: string;
          audience: "waitlist" | "direct";
          emails: string[];
          send_at: string;
          status: "scheduled" | "sending" | "sent" | "failed" | "cancelled";
          sent_count: number;
          failed_emails: string[];
          error: string | null;
          claimed_at: string | null;
          finished_at: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: { subject: string; message: string; audience: "waitlist" | "direct"; emails?: string[]; send_at: string; created_by: string };
        Update: never;
        Relationships: [];
      };
      launch_waitlist: {
        Row: { email: string; created_at: string; notified_at: string | null };
        Insert: never;
        Update: { notified_at?: string | null };
        Relationships: [];
      };
      contact_messages: {
        Row: {
          id: string;
          name: string;
          email: string;
          topic: ContactTopic;
          message: string;
          user_id: string | null;
          handled: boolean;
          user_read_at: string | null;
          created_at: string;
        };
        Insert: { name: string; email: string; topic?: ContactTopic; message: string; user_id?: string | null };
        Update: { handled?: boolean };
        Relationships: [];
      };
      contact_replies: {
        Row: { id: string; message_id: string; author_id: string | null; from_admin: boolean; body: string; created_at: string };
        Insert: { message_id: string; author_id: string; from_admin: boolean; body: string };
        Update: never;
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
      is_owner: { Args: { target?: string }; Returns: boolean };
      is_active_user: { Args: Record<PropertyKey, never>; Returns: boolean };
      delete_my_account: { Args: Record<PropertyKey, never>; Returns: undefined };
      admin_delete_user: { Args: { target: string }; Returns: undefined };
      username_available: { Args: { candidate: string }; Returns: boolean };
      is_premium: { Args: { target?: string }; Returns: boolean };
      my_plan: {
        Args: Record<PropertyKey, never>;
        Returns: {
          premium: boolean;
          premium_until: string | null;
          period: "monthly" | "yearly" | null;
          status: SubscriptionStatus;
          has_razorpay: boolean;
          recipes_this_month: number;
          monthly_limit: number | null;
        }[];
      };
      admin_set_premium: { Args: { target: string; days: number }; Returns: undefined };
      admin_list_plans: {
        Args: Record<PropertyKey, never>;
        Returns: { user_id: string; premium: boolean; premium_until: string | null; period: string | null; status: SubscriptionStatus }[];
      };
      contest_is_open: { Args: { p_contest: string }; Returns: boolean };
      contest_entries_with_votes: {
        Args: { p_contest: string };
        Returns: {
          entry_id: string;
          recipe_id: string;
          recipe_slug: string;
          recipe_title: string;
          recipe_image: string;
          user_id: string;
          author_name: string;
          author_username: string;
          author_avatar: string;
          votes: number;
          voted_by_me: boolean;
          created_at: string;
        }[];
      };
      site_is_launched: { Args: Record<PropertyKey, never>; Returns: boolean };
      owner_site_status: { Args: Record<PropertyKey, never>; Returns: string | null };
      owner_set_launched: { Args: { launched: boolean }; Returns: string | null };
      lucky_draw_is_open: { Args: { p_draw: string }; Returns: boolean };
      mark_contact_message_read: { Args: { p_message: string }; Returns: undefined };
      my_unread_support_replies: { Args: Record<PropertyKey, never>; Returns: number };
      join_launch_waitlist: { Args: { p_email: string }; Returns: undefined };
      cancel_scheduled_email: { Args: { p_id: string }; Returns: boolean };
      lucky_draw_summary: {
        Args: { p_draw: string };
        Returns: { entries: number; joined: boolean; i_won: boolean; winners: Json }[];
      };
      admin_draw_winners: { Args: { p_draw: string }; Returns: number };
      admin_draw_winner_details: {
        Args: { p_draw: string };
        Returns: { user_id: string; name: string; username: string; email: string; prize_paid: boolean }[];
      };
      owner_set_draw_prize_paid: { Args: { p_draw: string; p_user: string; paid: boolean }; Returns: undefined };
      has_admin_power: { Args: { power_name: string }; Returns: boolean };
      my_admin_powers: {
        Args: Record<PropertyKey, never>;
        Returns: { moderate: boolean; members: boolean; contests: boolean; messages: boolean; owner: boolean }[];
      };
      set_admin_powers: {
        Args: { target: string; p_moderate: boolean; p_members: boolean; p_contests: boolean; p_messages: boolean };
        Returns: undefined;
      };
      owner_list_admin_powers: {
        Args: Record<PropertyKey, never>;
        Returns: { user_id: string; moderate: boolean; members: boolean; contests: boolean; messages: boolean }[];
      };
      has_site_access: { Args: Record<PropertyKey, never>; Returns: boolean };
      set_early_access: { Args: { target: string; allowed: boolean }; Returns: undefined };
      admin_list_early_access: { Args: Record<PropertyKey, never>; Returns: string[] };
      touch_last_seen: { Args: Record<PropertyKey, never>; Returns: undefined };
      admin_list_presence: { Args: Record<PropertyKey, never>; Returns: { user_id: string; last_seen_at: string | null }[] };
      admin_announce_winner: { Args: { p_contest: string }; Returns: string | null };
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
