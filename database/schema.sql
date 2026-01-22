-- Smart Expense Tracker Database Schema

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Family groups for shared expense tracking
CREATE TABLE family_groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Family group members
CREATE TABLE family_members (
    id SERIAL PRIMARY KEY,
    family_group_id INTEGER REFERENCES family_groups(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(family_group_id, user_id)
);

-- Payment methods
CREATE TABLE payment_methods (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    method_type VARCHAR(50) NOT NULL, -- 'credit_card', 'debit_card', 'upi', 'cash', 'bank_transfer'
    method_name VARCHAR(255) NOT NULL,
    last_four VARCHAR(4),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Expense categories
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(50),
    color VARCHAR(7)
);

-- Insert default categories
INSERT INTO categories (name, icon, color) VALUES
('Food', '🍔', '#FF6B6B'),
('Transport', '🚗', '#4ECDC4'),
('Shopping', '🛍️', '#45B7D1'),
('Entertainment', '🎬', '#FFA07A'),
('Bills', '📄', '#98D8C8'),
('Healthcare', '🏥', '#F7DC6F'),
('Education', '📚', '#BB8FCE'),
('Subscription', '📱', '#85C1E2'),
('Groceries', '🛒', '#52C41A'),
('Other', '💰', '#95A5A6');

-- Expenses table
CREATE TABLE expenses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    family_group_id INTEGER REFERENCES family_groups(id) ON DELETE SET NULL,
    amount DECIMAL(10, 2) NOT NULL,
    category_id INTEGER REFERENCES categories(id),
    payment_method_id INTEGER REFERENCES payment_methods(id),
    description TEXT,
    original_text TEXT, -- Raw bank text
    merchant_name VARCHAR(255),
    transaction_date TIMESTAMP NOT NULL,
    is_recurring BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subscriptions detected by the system
CREATE TABLE subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    merchant_name VARCHAR(255) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    frequency VARCHAR(50) NOT NULL, -- 'monthly', 'yearly', 'weekly'
    category_id INTEGER REFERENCES categories(id),
    next_payment_date DATE,
    is_active BOOLEAN DEFAULT true,
    last_detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Merchant patterns for Smart Translator
CREATE TABLE merchant_patterns (
    id SERIAL PRIMARY KEY,
    pattern VARCHAR(255) NOT NULL,
    merchant_name VARCHAR(255) NOT NULL,
    category_id INTEGER REFERENCES categories(id),
    confidence_score DECIMAL(3, 2) DEFAULT 0.8,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert common merchant patterns
INSERT INTO merchant_patterns (pattern, merchant_name, category_id) VALUES
('ZOMATO', 'Zomato', (SELECT id FROM categories WHERE name = 'Food')),
('SWIGGY', 'Swiggy', (SELECT id FROM categories WHERE name = 'Food')),
('NETFLIX', 'Netflix', (SELECT id FROM categories WHERE name = 'Subscription')),
('AMAZON', 'Amazon', (SELECT id FROM categories WHERE name = 'Shopping')),
('UBER', 'Uber', (SELECT id FROM categories WHERE name = 'Transport')),
('OLA', 'Ola', (SELECT id FROM categories WHERE name = 'Transport')),
('SPOTIFY', 'Spotify', (SELECT id FROM categories WHERE name = 'Subscription')),
('PRIME', 'Amazon Prime', (SELECT id FROM categories WHERE name = 'Subscription'));

-- Budget settings
CREATE TABLE budgets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES categories(id),
    monthly_limit DECIMAL(10, 2) NOT NULL,
    alert_threshold DECIMAL(3, 2) DEFAULT 0.8, -- Alert at 80%
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_expenses_user_date ON expenses(user_id, transaction_date DESC);
CREATE INDEX idx_expenses_family ON expenses(family_group_id, transaction_date DESC);
CREATE INDEX idx_subscriptions_user ON subscriptions(user_id, is_active);
CREATE INDEX idx_merchant_patterns_pattern ON merchant_patterns(pattern);
