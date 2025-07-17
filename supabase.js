// src/utils/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tjolmryvwcaofgzmqyvn.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqb2xtcnl2d2Nhb2Znem1xeXZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3NzQzNjcsImV4cCI6MjA2ODM1MDM2N30.d1v5hkxHC6I35HTGobsqFDHCI5XTOGjju7uAIx5sHxA' 

export const supabase = createClient(supabaseUrl, supabaseKey)

// Function to record a swipe AND increment global counter
export async function recordSwipe(playerId, rating) {
  try {
    // Use a transaction to do both operations atomically
    const { data, error } = await supabase.rpc('record_swipe_with_global_increment', {
      p_player_id: playerId,
      p_rating: rating
    });
    
    if (error) {
      console.error('Error recording swipe:', error);
      return { success: false, globalCount: null };
    }
    
    return { success: true, globalCount: data };
  } catch (error) {
    console.error('Network error recording swipe:', error);
    return { success: false, globalCount: null };
  }
}

// Function to get current global swipe count
export async function getGlobalSwipeCount() {
  try {
    const { data, error } = await supabase
      .from('global_stats')
      .select('total_swipes')
      .eq('id', 1)
      .single();
    
    if (error) {
      console.error('Error fetching global count:', error);
      return null;
    }
    
    return data.total_swipes;
  } catch (error) {
    console.error('Network error fetching global count:', error);
    return null;
  }
}

// Function to get player stats (unchanged)
export async function getPlayerStats(playerId) {
  try {
    const { data, error } = await supabase
      .from('swipe_stats')
      .select('*')
      .eq('player_id', playerId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching stats:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Network error fetching stats:', error);
    return null;
  }
}

// Function to get all player stats (unchanged)
export async function getAllPlayerStats() {
  try {
    const { data, error } = await supabase
      .from('swipe_stats')
      .select('*')
      .order('total_swipes', { ascending: false });
    
    if (error) {
      console.error('Error fetching all stats:', error);
      return [];
    }
    
    return data;
  } catch (error) {
    console.error('Network error fetching all stats:', error);
    return [];
  }
}