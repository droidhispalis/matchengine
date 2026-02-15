-- ============================================
-- MIGRACIÓN SEGURA - Sin romper datos existentes
-- ============================================

-- 1. Crear tabla users
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

-- 2. Crear tabla search_configs
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

-- 3. Agregar columnas a jobs (solo si no existen)
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS user_id INT NULL AFTER id;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS search_config_id INT NULL AFTER user_id;
ALTER TABLE jobs ADD INDEX IF NOT EXISTS idx_user (user_id);
ALTER TABLE jobs ADD INDEX IF NOT EXISTS idx_search_config (search_config_id);

-- 4. Crear tabla user_opportunities (SIN foreign keys problemáticas)
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

-- 5. Crear tabla worker_logs
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

-- 6. Verificar tablas creadas
SHOW TABLES;
