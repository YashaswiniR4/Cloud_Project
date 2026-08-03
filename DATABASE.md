# 🗄️ Database Architecture & Supabase Setup Specification

---

## 🏛️ Database Design & Entity Relationship (ER) Diagram

The platform utilizes a production-ready, highly normalized relational schema designed for **PostgreSQL / Supabase**, with an automatic in-memory SQLite fallback for ultra-fast local development and unit testing.

```mermaid
erDiagram
    users {
        uuid id PK
        string username UK
        string email UK
        string password_hash
        string role
        timestamp created_at
    }

    events {
        uuid id PK
        string event_id UK
        string event_name
        timestamp event_time
        string event_source
        string source_ip
        string user_arn
        string error_code
        float threat_score
        string severity
        boolean is_high_risk
        json raw_payload
        timestamp created_at
    }

    alerts {
        uuid id PK
        string alert_id UK
        timestamp timestamp
        string severity
        string event_name
        string source_ip
        float threat_score
        string sns_topic_arn
        text message
        string status
        timestamp created_at
    }

    threat_intelligence {
        uuid id PK
        string source_ip UK
        float reputation_score
        string category
        string isp
        integer total_attacks
        timestamp last_seen
        timestamp created_at
    }

    honeypot_logs {
        uuid id PK
        string honeypot_type
        string source_ip
        string target_user_or_path
        text payload_or_password
        float threat_score
        timestamp timestamp
        timestamp created_at
    }

    ml_predictions {
        uuid id PK
        uuid event_id FK
        string prediction_label
        float anomaly_score
        boolean is_zero_day
        json shap_explanation
        timestamp created_at
    }

    remediation_actions {
        uuid id PK
        string action_type
        string target_identifier
        string status
        timestamp timestamp
        json actions_taken
        timestamp created_at
    }

    audit_logs {
        uuid id PK
        string log_id UK
        string vault_bucket
        string sha256_hash
        boolean is_locked
        timestamp timestamp
        timestamp created_at
    }

    events ||--o{ ml_predictions : "generates"
```

---

## 📜 SQL DDL Schema (PostgreSQL / Supabase)

```sql
-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'ANALYST' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Telemetry Events Table
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id VARCHAR(100) UNIQUE NOT NULL,
    event_name VARCHAR(100) NOT NULL,
    event_time TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    event_source VARCHAR(100) NOT NULL,
    source_ip VARCHAR(45) NOT NULL,
    user_arn VARCHAR(255),
    error_code VARCHAR(100),
    threat_score DOUBLE PRECISION DEFAULT 0.0 NOT NULL,
    severity VARCHAR(20) DEFAULT 'LOW' NOT NULL,
    is_high_risk BOOLEAN DEFAULT FALSE NOT NULL,
    raw_payload JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_events_source_ip ON events(source_ip);
CREATE INDEX idx_events_time ON events(event_time);

-- 3. Dispatched Security Alerts Table
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_id VARCHAR(100) UNIQUE NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    severity VARCHAR(20) NOT NULL,
    event_name VARCHAR(100) NOT NULL,
    source_ip VARCHAR(45) NOT NULL,
    threat_score DOUBLE PRECISION NOT NULL,
    sns_topic_arn VARCHAR(255),
    message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'DELIVERED' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_alerts_ip ON alerts(source_ip);
CREATE INDEX idx_alerts_severity ON alerts(severity);

-- 4. Threat Intelligence Reputational Table
CREATE TABLE IF NOT EXISTS threat_intelligence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_ip VARCHAR(45) UNIQUE NOT NULL,
    reputation_score DOUBLE PRECISION NOT NULL,
    category VARCHAR(100) NOT NULL,
    isp VARCHAR(100),
    total_attacks INTEGER DEFAULT 1 NOT NULL,
    last_seen TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 5. Deception Honeypot Traps Log Table
CREATE TABLE IF NOT EXISTS honeypot_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    honeypot_type VARCHAR(20) NOT NULL, -- 'SSH' or 'HTTP'
    source_ip VARCHAR(45) NOT NULL,
    target_user_or_path VARCHAR(255) NOT NULL,
    payload_or_password TEXT,
    threat_score DOUBLE PRECISION NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_honeypots_type_ip ON honeypot_logs(honeypot_type, source_ip);

-- 6. ML Predictions & XAI Table
CREATE TABLE IF NOT EXISTS ml_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    prediction_label VARCHAR(100) NOT NULL,
    anomaly_score DOUBLE PRECISION NOT NULL,
    is_zero_day BOOLEAN DEFAULT FALSE NOT NULL,
    shap_explanation JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 7. Serverless Remediation Actions Table
CREATE TABLE IF NOT EXISTS remediation_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_type VARCHAR(100) NOT NULL,
    target_identifier VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'EXECUTED' NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    actions_taken JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 8. Audit Vault Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    log_id VARCHAR(100) UNIQUE NOT NULL,
    vault_bucket VARCHAR(100) NOT NULL,
    sha256_hash VARCHAR(64) NOT NULL,
    is_locked BOOLEAN DEFAULT TRUE NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

---

## ⚡ Supabase Setup & Configuration Guide

1. **Create a Supabase Project**:
   - Navigate to [https://supabase.com](https://supabase.com) and create a new project.
   - Note your project reference ID and database password.

2. **Retrieve Connection String**:
   - Go to **Project Settings** ➔ **Database** ➔ **Connection String** ➔ **URI**.
   - Copy the URI string: `postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres`

3. **Configure Environment Variables**:
   Update your local `.env` file with the Supabase connection URL:
   ```env
   DATABASE_URL=postgresql://postgres.your_project_ref:your_password@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   ```

4. **Seed the Production Database**:
   Run the automated Python seeding script:
   ```bash
   python -m backend.database.seed
   ```
