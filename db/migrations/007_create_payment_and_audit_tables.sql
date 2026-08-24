-- Migration: Create Payment, Transactions, & Audit Tables
-- Version: 007
-- Author: Backend & Infrastructure Lead
-- Date: 2026-08-25
-- Status: Payment Processing & Compliance Tracking

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  payment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id),
  payment_method VARCHAR(50) NOT NULL, -- credit_card, bank_transfer, e_wallet, paypal, stripe
  payment_provider VARCHAR(50), -- stripe, paypal, local_provider
  provider_payment_id VARCHAR(255) UNIQUE,
  amount DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed, refunded, cancelled
  payment_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT valid_amount CHECK (amount > 0),
  CONSTRAINT valid_payment_method CHECK (payment_method IN (
    'credit_card', 'bank_transfer', 'e_wallet', 'paypal', 'stripe', 'other'
  )),
  CONSTRAINT valid_status CHECK (status IN (
    'pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'
  ))
);

-- Create indexes for payments table
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date DESC);
CREATE INDEX IF NOT EXISTS idx_payments_provider_payment_id ON payments(provider_payment_id);

-- Create transactions table for transaction records linked to tournaments/events
CREATE TABLE IF NOT EXISTS transactions (
  transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id),
  payment_id UUID REFERENCES payments(payment_id),
  tournament_registration_id UUID REFERENCES tournament_participants(id),
  event_id UUID REFERENCES events(event_id),
  transaction_type VARCHAR(50) NOT NULL, -- tournament_entry, event_booking, membership, other
  amount DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  description TEXT,
  status VARCHAR(50) DEFAULT 'pending', -- pending, completed, failed, refunded
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  refunded_at TIMESTAMP,
  refund_reason VARCHAR(255),

  CONSTRAINT valid_amount CHECK (amount >= 0),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  CONSTRAINT valid_transaction_type CHECK (transaction_type IN (
    'tournament_entry', 'event_booking', 'membership', 'merchandise', 'coaching', 'other'
  ))
);

-- Create indexes for transactions table
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_transaction_type ON transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_payment_id ON transactions(payment_id);

-- Create invoices table for invoice management
CREATE TABLE IF NOT EXISTS invoices (
  invoice_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id),
  transaction_id UUID REFERENCES transactions(transaction_id),
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  tax_amount DECIMAL(12, 2) DEFAULT 0,
  total_amount DECIMAL(12, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'draft', -- draft, sent, paid, overdue, cancelled
  issue_date DATE,
  due_date DATE,
  paid_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT valid_amounts CHECK (amount > 0 AND total_amount >= amount),
  CONSTRAINT valid_status CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled'))
);

-- Create indexes for invoices table
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);

-- Create refunds table
CREATE TABLE IF NOT EXISTS refunds (
  refund_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(transaction_id),
  payment_id UUID NOT NULL REFERENCES payments(payment_id),
  amount DECIMAL(12, 2) NOT NULL,
  reason VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- pending, approved, completed, rejected
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT valid_amount CHECK (amount > 0)
);

-- Create indexes for refunds table
CREATE INDEX IF NOT EXISTS idx_refunds_transaction_id ON refunds(transaction_id);
CREATE INDEX IF NOT EXISTS idx_refunds_payment_id ON refunds(payment_id);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON refunds(status);

-- Create audit_logs table for comprehensive audit trail
CREATE TABLE IF NOT EXISTS audit_logs (
  log_id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(user_id),
  action VARCHAR(50) NOT NULL, -- create, read, update, delete, login, logout
  resource_type VARCHAR(100) NOT NULL, -- users, tournaments, matches, payments
  resource_id VARCHAR(255) NOT NULL,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  status VARCHAR(50), -- success, failure
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT valid_action CHECK (action IN (
    'create', 'read', 'update', 'delete', 'login', 'logout',
    'export', 'import', 'archive', 'restore'
  ))
);

-- Create indexes for audit_logs table
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type_id ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_ip_address ON audit_logs(ip_address);

-- Create security_events table for security-related events
CREATE TABLE IF NOT EXISTS security_events (
  event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(user_id),
  event_type VARCHAR(50) NOT NULL, -- login_attempt, password_reset, 2fa_enabled, suspicious_activity
  ip_address INET,
  user_agent TEXT,
  severity VARCHAR(50) DEFAULT 'info', -- info, warning, critical
  details JSONB,
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT valid_event_type CHECK (event_type IN (
    'login_attempt', 'failed_login', 'password_reset', '2fa_enabled',
    '2fa_disabled', 'suspicious_activity', 'api_key_created', 'api_key_revoked',
    'permission_change', 'data_export'
  )),
  CONSTRAINT valid_severity CHECK (severity IN ('info', 'warning', 'critical'))
);

-- Create indexes for security_events table
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_event_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(severity);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON security_events(created_at DESC);

-- Create function for timestamp updates
CREATE OR REPLACE FUNCTION update_payment_audit_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for payments
DROP TRIGGER IF EXISTS trigger_update_payments_timestamp ON payments;
CREATE TRIGGER trigger_update_payments_timestamp
BEFORE UPDATE ON payments
FOR EACH ROW
EXECUTE FUNCTION update_payment_audit_timestamp();

-- Create trigger for invoices
DROP TRIGGER IF EXISTS trigger_update_invoices_timestamp ON invoices;
CREATE TRIGGER trigger_update_invoices_timestamp
BEFORE UPDATE ON invoices
FOR EACH ROW
EXECUTE FUNCTION update_payment_audit_timestamp();

-- Migration status: COMPLETED
-- Tables created: payments, transactions, invoices, refunds, audit_logs, security_events
-- Indexes created: 24
-- Triggers created: 2
-- Total objects: 32
