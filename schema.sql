-- Enable pgcrypto for UUID generation if needed, though gen_random_uuid() is built-in in PostgreSQL 13+
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop tables if they exist
DROP TABLE IF EXISTS ratings CASCADE;
DROP TABLE IF EXISTS stores CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    address VARCHAR(400) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'user', 'owner')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Stores table
CREATE TABLE stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    address VARCHAR(400) NOT NULL,
    owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Ratings table
CREATE TABLE ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_store UNIQUE (user_id, store_id)
);

-- Insert Default System Administrator
-- Password is 'Admin@123' (hashed using bcrypt)
INSERT INTO users (name, email, password_hash, address, role)
VALUES (
    'System Administrator Account',
    'admin@example.com',
    '$2a$10$tZptc.d70zE3.hK.HETb/.j1aB3.cTz2Zk7x95HwD1nO.wFf.HjS6', -- bcrypt hash of Admin@123
    'Platform Administration Headquarters, New Delhi, India',
    'admin'
);
