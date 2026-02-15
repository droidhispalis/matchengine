-- ============================================
-- ESQUEMA ACTUAL (inferido del código)
-- ============================================

-- Tabla: jobs
-- Almacena los trabajos scrapeados
CREATE TABLE IF NOT EXISTS jobs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    url VARCHAR(512) NOT NULL,
    url_hash CHAR(64) UNIQUE NOT NULL,
    title VARCHAR(512),
    snippet TEXT,
    source VARCHAR(100),
    status ENUM('pending', 'classified', 'discarded', 'extracted', 'extraction_failed') DEFAULT 'pending',
    is_relevant TINYINT(1) DEFAULT 0,
    classified_at DATETIME NULL,
    extracted_at DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_url_hash (url_hash),
    INDEX idx_classified (status, is_relevant)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: opportunities
-- Almacena las oportunidades extraídas
CREATE TABLE IF NOT EXISTS opportunities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    job_id INT NOT NULL,
    title VARCHAR(512),
    organism VARCHAR(255),
    specialty VARCHAR(255),
    position_type VARCHAR(100),
    access_type ENUM('libre', 'concurso', 'oposicion', 'concurso-oposicion'),
    disability_quota TINYINT(1) DEFAULT 0,
    disability_percentage VARCHAR(50),
    education_level VARCHAR(255),
    application_deadline DATE NULL,
    exam_date DATE NULL,
    syllabus_url VARCHAR(512),
    province VARCHAR(100),
    autonomous_region VARCHAR(100),
    ai_score INT DEFAULT 50,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    UNIQUE KEY unique_job (job_id),
    INDEX idx_disability (disability_quota),
    INDEX idx_region (autonomous_region),
    INDEX idx_deadline (application_deadline)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- EXTENSIÓN MULTI-TENANT (para monetizar)
-- ============================================

-- Tabla: users
-- Usuarios del sistema (clientes)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    status ENUM('active', 'inactive', 'trial') DEFAULT 'trial',
    subscription_plan ENUM('free', 'basic', 'premium', 'enterprise') DEFAULT 'free',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_subscription (subscription_plan)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: search_configs
-- Configuraciones de búsqueda por usuario
CREATE TABLE IF NOT EXISTS search_configs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    queries JSON NOT NULL COMMENT 'Array de queries de búsqueda',
    filters JSON COMMENT 'Filtros: autonomous_region, disability_quota, etc',
    max_results INT DEFAULT 10,
    run_interval_minutes INT DEFAULT 60,
    is_active TINYINT(1) DEFAULT 1,
    last_run_at DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_active (user_id, is_active),
    INDEX idx_last_run (last_run_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Modificar tabla jobs para soportar multi-tenant
ALTER TABLE jobs ADD COLUMN user_id INT NULL AFTER id;
ALTER TABLE jobs ADD COLUMN search_config_id INT NULL AFTER user_id;
ALTER TABLE jobs ADD INDEX idx_user (user_id);
ALTER TABLE jobs ADD INDEX idx_search_config (search_config_id);
ALTER TABLE jobs ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE jobs ADD FOREIGN KEY (search_config_id) REFERENCES search_configs(id) ON DELETE SET NULL;

-- Tabla: user_opportunities
-- Relación usuario-oportunidad (favoritos, alertas, etc)
-- NOTA: Se crea SIN foreign keys primero, luego se agregan si son compatibles
CREATE TABLE IF NOT EXISTS user_opportunities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    opportunity_id INT NOT NULL,
    status ENUM('new', 'viewed', 'saved', 'applied', 'dismissed') DEFAULT 'new',
    notified_at DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_opp (user_id, opportunity_id),
    INDEX idx_user_status (user_id, status),
    INDEX idx_user (user_id),
    INDEX idx_opportunity (opportunity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Agregar foreign keys SI las tablas son compatibles
-- ALTER TABLE user_opportunities ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
-- ALTER TABLE user_opportunities ADD FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE CASCADE;

-- Tabla: notification_settings
-- Configuración de notificaciones por usuario
CREATE TABLE IF NOT EXISTS notification_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    email_enabled TINYINT(1) DEFAULT 0,
    email_address VARCHAR(255) NULL,
    telegram_enabled TINYINT(1) DEFAULT 0,
    telegram_chat_id VARCHAR(100) NULL,
    notify_on_new_opportunity TINYINT(1) DEFAULT 1,
    notify_on_deadline_approaching TINYINT(1) DEFAULT 0,
    deadline_days_before INT DEFAULT 7,
    quiet_hours_start TIME NULL COMMENT 'Hora de inicio de horario silencioso',
    quiet_hours_end TIME NULL COMMENT 'Hora de fin de horario silencioso',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_settings (user_id),
    INDEX idx_email_enabled (email_enabled),
    INDEX idx_telegram_enabled (telegram_enabled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: worker_logs
-- Logs de ejecución de workers
CREATE TABLE IF NOT EXISTS worker_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    search_config_id INT NULL,
    worker_type ENUM('search', 'classify', 'extract') NOT NULL,
    status ENUM('running', 'completed', 'failed') DEFAULT 'running',
    jobs_processed INT DEFAULT 0,
    jobs_success INT DEFAULT 0,
    jobs_failed INT DEFAULT 0,
    error_message TEXT NULL,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME NULL,
    INDEX idx_user (user_id),
    INDEX idx_config (search_config_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
