-- LifeLine Supabase Database Schema
-- Paste this script into the Supabase SQL Editor to initialize your database structure.

-- Drop existing tables if they exist (for easy resetting)
DROP TABLE IF EXISTS matches;
DROP TABLE IF EXISTS requests;
DROP TABLE IF EXISTS bank_inventory;
DROP TABLE IF EXISTS donors;

-- 1. Donors table
CREATE TABLE donors (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    blood_group TEXT NOT NULL,
    lat NUMERIC NOT NULL,
    lng NUMERIC NOT NULL,
    location_label TEXT NOT NULL,
    available BOOLEAN NOT NULL DEFAULT true,
    reliability_score NUMERIC NOT NULL DEFAULT 0.75,
    last_donation_date TEXT NOT NULL
);

-- 2. Bank Inventory table
CREATE TABLE bank_inventory (
    id TEXT PRIMARY KEY,
    bank_id TEXT NOT NULL,
    bank_name TEXT NOT NULL,
    blood_group TEXT NOT NULL,
    lat NUMERIC NOT NULL,
    lng NUMERIC NOT NULL,
    location_label TEXT NOT NULL,
    units_available INTEGER NOT NULL DEFAULT 0,
    expiry_date TEXT NOT NULL -- ISO date/text
);

-- 3. Requests table
CREATE TABLE requests (
    id TEXT PRIMARY KEY,
    hospital_name TEXT NOT NULL,
    blood_group TEXT NOT NULL,
    units_needed INTEGER NOT NULL DEFAULT 1,
    urgency TEXT NOT NULL,
    lat NUMERIC NOT NULL,
    lng NUMERIC NOT NULL,
    location_label TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',
    created_at TEXT NOT NULL
);

-- 4. Matches table (optional audit / linkage table if needed)
CREATE TABLE matches (
    id TEXT PRIMARY KEY,
    request_id TEXT NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
    source_type TEXT NOT NULL, -- 'donor' or 'bank'
    source_id TEXT NOT NULL,
    source_name TEXT NOT NULL,
    score NUMERIC NOT NULL,
    status TEXT NOT NULL DEFAULT 'offered', -- 'offered', 'confirmed', 'released'
    confirmed_at TEXT
);

-- Enable Row Level Security (RLS) optionally. For hackathon simplicity, we can let anyone read/write or add standard RLS policies.
-- Let's bypass RLS restrictions or enable public access policies so client-side fetching works.
ALTER TABLE donors ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read-write for donors" ON donors FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for bank_inventory" ON bank_inventory FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for requests" ON requests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for matches" ON matches FOR ALL USING (true) WITH CHECK (true);

-- Seed Hardcoded Data
INSERT INTO donors (id, name, phone, blood_group, lat, lng, location_label, available, reliability_score, last_donation_date) VALUES
('d1', 'Rahul Verma', '9876500001', 'O-', 28.6139, 77.209, 'Connaught Place', true, 0.9, '2026-05-10'),
('d2', 'Priya Nair', '9876500002', 'A+', 28.5355, 77.391, 'Noida Sector 62', true, 0.6, '2026-03-20'),
('d3', 'Aman Gupta', '9876500003', 'B+', 28.4595, 77.0266, 'Gurugram Sector 29', true, 0.4, '2026-01-15'),
('d4', 'Sneha Kapoor', '9876500004', 'O+', 28.7041, 77.1025, 'Rohini', true, 0.85, '2026-06-01'),
('d5', 'Karan Malhotra', '9876500005', 'AB+', 28.6304, 77.2177, 'Lajpat Nagar', false, 0.95, '2026-04-11');

INSERT INTO bank_inventory (id, bank_id, bank_name, blood_group, lat, lng, location_label, units_available, expiry_date) VALUES
('b1', 'bank1', 'Red Cross Blood Bank, Delhi', 'O-', 28.6129, 77.2295, 'Delhi', 4, '2026-08-22'),
('b2', 'bank1', 'Red Cross Blood Bank, Delhi', 'A+', 28.6129, 77.2295, 'Delhi', 10, '2026-09-30'),
('b3', 'bank2', 'Apollo Blood Bank, Noida', 'O+', 28.575, 77.321, 'Noida', 6, '2026-08-25'),
('b4', 'bank3', 'Fortis Blood Bank, Gurugram', 'B+', 28.4744, 77.0839, 'Gurugram', 3, '2026-09-05');
