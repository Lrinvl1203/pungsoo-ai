/**
 * Supabase Analysis History Service
 *
 * Required SQL to create the table in Supabase Dashboard → SQL Editor:
 *
 * ```sql
 * CREATE TABLE analysis_history (
 *   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
 *   user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
 *   created_at TIMESTAMPTZ DEFAULT NOW(),
 *   analysis_type TEXT NOT NULL CHECK (analysis_type IN ('internal', 'external')),
 *   image_url TEXT,
 *   address TEXT,
 *   metadata JSONB NOT NULL DEFAULT '{}',
 *   result JSONB NOT NULL,
 *   remedy_art_url TEXT,
 *   zodiac_image_url TEXT,
 *   to_be_image_url TEXT,
 *   feng_shui_score INTEGER
 * );
 *
 * -- Row Level Security
 * ALTER TABLE analysis_history ENABLE ROW LEVEL SECURITY;
 *
 * -- Users can only read their own rows
 * CREATE POLICY "Users can view own history"
 *   ON analysis_history FOR SELECT
 *   USING (auth.uid() = user_id);
 *
 * -- Users can insert their own rows
 * CREATE POLICY "Users can insert own history"
 *   ON analysis_history FOR INSERT
 *   WITH CHECK (auth.uid() = user_id);
 *
 * -- Users can delete their own rows
 * CREATE POLICY "Users can delete own history"
 *   ON analysis_history FOR DELETE
 *   USING (auth.uid() = user_id);
 *
 * -- Index for faster user queries
 * CREATE INDEX idx_analysis_history_user ON analysis_history(user_id, created_at DESC);
 * ```
 */

import { supabase } from './supabaseClient';
import { AnalysisResult, UserMetadata } from '../types';

export interface AnalysisHistoryRow {
    id: string;
    user_id: string;
    created_at: string;
    analysis_type: 'internal' | 'external';
    image_url: string | null;
    address: string | null;
    metadata: UserMetadata;
    result: AnalysisResult;
    remedy_art_url: string | null;
    zodiac_image_url: string | null;
    to_be_image_url: string | null;
    feng_shui_score: number;
}

/**
 * Save an analysis result to Supabase.
 * Images are stored as data URLs for now (could migrate to Supabase Storage later).
 */
export async function saveAnalysis(params: {
    userId: string;
    analysisType: 'internal' | 'external';
    image: string | null;
    address: string | null;
    metadata: UserMetadata;
    result: AnalysisResult;
    remedyArt: string | null;
    zodiacImage: string | null;
    toBeImage: string | null;
}): Promise<AnalysisHistoryRow | null> {
    try {
        const { data, error } = await supabase
            .from('analysis_history')
            .insert({
                user_id: params.userId,
                analysis_type: params.analysisType,
                image_url: params.image,
                address: params.address,
                metadata: params.metadata,
                result: params.result,
                remedy_art_url: params.remedyArt,
                zodiac_image_url: params.zodiacImage,
                to_be_image_url: params.toBeImage,
                feng_shui_score: params.result.feng_shui_score,
            })
            .select()
            .single();

        if (error) {
            console.error('❌ [Supabase Save Error]', JSON.stringify(error, null, 2));
            alert(`저장 실패 (콘솔 확인 필요): ${error.message}`);
            return null;
        }
        return data as AnalysisHistoryRow;
    } catch (err) {
        console.error('❌ [Supabase Catch Error]', err);
        alert(`저장 에러 발생: ${err}`);
        return null;
    }
}

/**
 * Fetch all analysis history for the current user, newest first.
 */
export async function getAnalysisHistory(userId: string, limit = 20): Promise<AnalysisHistoryRow[]> {
    try {
        const { data, error } = await supabase
            .from('analysis_history')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('Failed to fetch history:', error);
            return [];
        }
        return (data || []) as AnalysisHistoryRow[];
    } catch (err) {
        console.error('Error fetching history:', err);
        return [];
    }
}

/**
 * Get a single analysis by ID (for permalink / re-view).
 */
export async function getAnalysisById(id: string): Promise<AnalysisHistoryRow | null> {
    try {
        const { data, error } = await supabase
            .from('analysis_history')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Failed to fetch analysis:', error);
            return null;
        }
        return data as AnalysisHistoryRow;
    } catch (err) {
        console.error('Error fetching analysis:', err);
        return null;
    }
}

/**
 * Delete an analysis history entry.
 */
export async function deleteAnalysis(id: string): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('analysis_history')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Failed to delete analysis:', error);
            return false;
        }
        return true;
    } catch (err) {
        console.error('Error deleting analysis:', err);
        return false;
    }
}

/**
 * Delete all analysis history for a user.
 */
export async function clearAllHistory(userId: string): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('analysis_history')
            .delete()
            .eq('user_id', userId);

        if (error) {
            console.error('Failed to clear history:', error);
            return false;
        }
        return true;
    } catch (err) {
        console.error('Error clearing history:', err);
        return false;
    }
}
