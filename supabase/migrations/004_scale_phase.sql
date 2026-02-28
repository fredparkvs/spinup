-- Migration 004: Add Scale phase for the Accelerator (App 3)

-- Add 'scale' to the phase enum
ALTER TYPE public.phase ADD VALUE IF NOT EXISTS 'scale';

-- No table changes needed: teams.current_phase already uses the phase enum.
-- Artifact types for the scale phase are handled in application code (artifact_types).
-- New OKR tracking will use the generic artifacts table with JSONB data column.
