import { createClient } from '@supabase/supabase-js'

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      players: {
        Row: {
          id: string
          name: string
          number: number | null
          is_on_field: boolean
          position: string | null
          field_time_start: number | null
          total_field_time: number
          position_time_start: number | null
          total_position_time: number
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          number?: number | null
          is_on_field?: boolean
          position?: string | null
          field_time_start?: number | null
          total_field_time?: number
          position_time_start?: number | null
          total_position_time?: number
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          number?: number | null
          is_on_field?: boolean
          position?: string | null
          field_time_start?: number | null
          total_field_time?: number
          position_time_start?: number | null
          total_position_time?: number
          user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      matches: {
        Row: {
          id: string
          date: string
          opponent: string | null
          score: string | null
          start_time: number | null
          end_time: number | null
          half_time_start: number | null
          half_time_end: number | null
          duration: number
          is_active: boolean
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          date: string
          opponent?: string | null
          score?: string | null
          start_time?: number | null
          end_time?: number | null
          half_time_start?: number | null
          half_time_end?: number | null
          duration?: number
          is_active?: boolean
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          date?: string
          opponent?: string | null
          score?: string | null
          start_time?: number | null
          end_time?: number | null
          half_time_start?: number | null
          half_time_end?: number | null
          duration?: number
          is_active?: boolean
          user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      time_logs: {
        Row: {
          id: string
          player_id: string
          match_id: string
          start_time: number
          end_time: number | null
          position: string | null
          type: 'field' | 'position'
          created_at: string
        }
        Insert: {
          id?: string
          player_id: string
          match_id: string
          start_time: number
          end_time?: number | null
          position?: string | null
          type: 'field' | 'position'
          created_at?: string
        }
        Update: {
          id?: string
          player_id?: string
          match_id?: string
          start_time?: number
          end_time?: number | null
          position?: string | null
          type?: 'field' | 'position'
          created_at?: string
        }
      }
    }
  }
}