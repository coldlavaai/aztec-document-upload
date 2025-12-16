-- Migration: Replace work references with company history
-- Run this in Supabase SQL Editor

-- Drop old reference columns if they exist
ALTER TABLE applicants
DROP COLUMN IF EXISTS reference_1_name,
DROP COLUMN IF EXISTS reference_1_phone,
DROP COLUMN IF EXISTS reference_1_company,
DROP COLUMN IF EXISTS reference_2_name,
DROP COLUMN IF EXISTS reference_2_phone,
DROP COLUMN IF EXISTS reference_2_company;

-- Add new company history columns
ALTER TABLE applicants
ADD COLUMN IF NOT EXISTS company_1_name TEXT,
ADD COLUMN IF NOT EXISTS company_1_end_date DATE,
ADD COLUMN IF NOT EXISTS company_2_name TEXT,
ADD COLUMN IF NOT EXISTS company_2_end_date DATE,
ADD COLUMN IF NOT EXISTS company_3_name TEXT,
ADD COLUMN IF NOT EXISTS company_3_end_date DATE;

-- Add comment for documentation
COMMENT ON COLUMN applicants.company_1_name IS 'Most recent company worked for';
COMMENT ON COLUMN applicants.company_2_name IS 'Second most recent company';
COMMENT ON COLUMN applicants.company_3_name IS 'Third most recent company';
