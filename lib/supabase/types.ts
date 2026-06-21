export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      tournaments: {
        Row: {
          id: string
          name: string
          slug: string
          season: number
          status: "active" | "finished"
          description: string | null
          start_date: string | null
          end_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          season: number
          status?: "active" | "finished"
          description?: string | null
          start_date?: string | null
          end_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          season?: number
          status?: "active" | "finished"
          description?: string | null
          start_date?: string | null
          end_date?: string | null
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          tournament_id: string
          name: string
          slug: string
          phase_format: string
          regular_phase_type: string
          teams_count: number
          direct_semifinalists_count: number | null
          quarterfinals_enabled: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tournament_id: string
          name: string
          slug: string
          phase_format?: string
          regular_phase_type?: string
          teams_count: number
          direct_semifinalists_count?: number | null
          quarterfinals_enabled?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tournament_id?: string
          name?: string
          slug?: string
          phase_format?: string
          regular_phase_type?: string
          teams_count?: number
          direct_semifinalists_count?: number | null
          quarterfinals_enabled?: boolean
          sort_order?: number
          updated_at?: string
        }
      }
      teams: {
        Row: {
          id: string
          category_id: string
          name: string
          slug: string
          captain_name: string | null
          notes: string | null
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          category_id: string
          name: string
          slug: string
          captain_name?: string | null
          notes?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          category_id?: string
          name?: string
          slug?: string
          captain_name?: string | null
          notes?: string | null
          active?: boolean
          updated_at?: string
        }
      }
      players: {
        Row: {
          id: string
          first_name: string
          last_name: string
          display_name: string
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          first_name: string
          last_name: string
          display_name: string
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string
          display_name?: string
          active?: boolean
          updated_at?: string
        }
      }
      team_players: {
        Row: {
          id: string
          team_id: string
          player_id: string
          is_captain: boolean
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          team_id: string
          player_id: string
          is_captain?: boolean
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          player_id?: string
          is_captain?: boolean
          active?: boolean
          updated_at?: string
        }
      }
      rounds: {
        Row: {
          id: string
          category_id: string
          phase: "regular" | "quarterfinal" | "semifinal" | "final"
          round_number: number
          name: string
          scheduled_date: string | null
          status: "scheduled" | "completed" | "cancelled"
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          category_id: string
          phase?: "regular" | "quarterfinal" | "semifinal" | "final"
          round_number: number
          name: string
          scheduled_date?: string | null
          status?: "scheduled" | "completed" | "cancelled"
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          category_id?: string
          phase?: "regular" | "quarterfinal" | "semifinal" | "final"
          round_number?: number
          name?: string
          scheduled_date?: string | null
          status?: "scheduled" | "completed" | "cancelled"
          updated_at?: string
        }
      }
      series: {
        Row: {
          id: string
          round_id: string
          category_id: string
          home_team_id: string
          away_team_id: string
          scheduled_date: string | null
          scheduled_time: string | null
          original_scheduled_date: string | null
          original_scheduled_time: string | null
          rescheduled_reason: string | null
          status: "scheduled" | "rescheduled" | "in_progress" | "completed" | "walkover" | "cancelled"
          is_general_walkover: boolean
          walkover_winner_team_id: string | null
          winner_team_id: string | null
          home_courts_won: number | null
          away_courts_won: number | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          round_id: string
          category_id: string
          home_team_id: string
          away_team_id: string
          scheduled_date?: string | null
          scheduled_time?: string | null
          original_scheduled_date?: string | null
          original_scheduled_time?: string | null
          rescheduled_reason?: string | null
          status?: "scheduled" | "rescheduled" | "in_progress" | "completed" | "walkover" | "cancelled"
          is_general_walkover?: boolean
          walkover_winner_team_id?: string | null
          winner_team_id?: string | null
          home_courts_won?: number | null
          away_courts_won?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          round_id?: string
          category_id?: string
          home_team_id?: string
          away_team_id?: string
          scheduled_date?: string | null
          scheduled_time?: string | null
          original_scheduled_date?: string | null
          original_scheduled_time?: string | null
          rescheduled_reason?: string | null
          status?: "scheduled" | "rescheduled" | "in_progress" | "completed" | "walkover" | "cancelled"
          is_general_walkover?: boolean
          walkover_winner_team_id?: string | null
          winner_team_id?: string | null
          home_courts_won?: number | null
          away_courts_won?: number | null
          notes?: string | null
          updated_at?: string
        }
      }
      court_matches: {
        Row: {
          id: string
          series_id: string
          court_number: number
          home_player_1_id: string | null
          home_player_2_id: string | null
          away_player_1_id: string | null
          away_player_2_id: string | null
          score: string | null
          winner_team_id: string | null
          is_court_walkover: boolean
          home_sets_won: number | null
          away_sets_won: number | null
          home_games_won: number | null
          away_games_won: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          series_id: string
          court_number: number
          home_player_1_id?: string | null
          home_player_2_id?: string | null
          away_player_1_id?: string | null
          away_player_2_id?: string | null
          score?: string | null
          winner_team_id?: string | null
          is_court_walkover?: boolean
          home_sets_won?: number | null
          away_sets_won?: number | null
          home_games_won?: number | null
          away_games_won?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          series_id?: string
          court_number?: number
          home_player_1_id?: string | null
          home_player_2_id?: string | null
          away_player_1_id?: string | null
          away_player_2_id?: string | null
          score?: string | null
          winner_team_id?: string | null
          is_court_walkover?: boolean
          home_sets_won?: number | null
          away_sets_won?: number | null
          home_games_won?: number | null
          away_games_won?: number | null
          updated_at?: string
        }
      }
      standings_snapshot: {
        Row: {
          id: string
          category_id: string
          team_id: string
          played: number
          won: number
          lost: number
          points: number
          courts_won: number
          courts_lost: number
          courts_diff: number
          sets_won: number
          sets_lost: number
          sets_diff: number
          games_won: number
          games_lost: number
          games_diff: number
          position: number
          updated_at: string
        }
        Insert: {
          id?: string
          category_id: string
          team_id: string
          played?: number
          won?: number
          lost?: number
          points?: number
          courts_won?: number
          courts_lost?: number
          courts_diff?: number
          sets_won?: number
          sets_lost?: number
          sets_diff?: number
          games_won?: number
          games_lost?: number
          games_diff?: number
          position?: number
          updated_at?: string
        }
        Update: {
          id?: string
          category_id?: string
          team_id?: string
          played?: number
          won?: number
          lost?: number
          points?: number
          courts_won?: number
          courts_lost?: number
          courts_diff?: number
          sets_won?: number
          sets_lost?: number
          sets_diff?: number
          games_won?: number
          games_lost?: number
          games_diff?: number
          position?: number
          updated_at?: string
        }
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}
