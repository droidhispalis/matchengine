-- ============================================
-- MIGRATION: Sistema de Webhooks
-- Fecha: 2026-02-15
-- ============================================

-- Crear tabla webhooks
CREATE TABLE IF NOT EXISTS webhooks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    url VARCHAR(512) NOT NULL,
    method ENUM('POST', 'PUT', 'PATCH') DEFAULT 'POST',
    headers JSON NULL COMMENT 'Headers HTTP personalizados',
    secret VARCHAR(255) NULL COMMENT 'Secret para HMAC signature',
    events JSON NOT NULL COMMENT 'Array de eventos: ["opportunity.created", "opportunity.deadline"]',
    is_active TINYINT(1) DEFAULT 1,
    last_triggered_at DATETIME NULL,
    last_status INT NULL COMMENT 'Último HTTP status code',
    last_error TEXT NULL,
    retry_count INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_active (user_id, is_active),
    INDEX idx_events (events(255))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Crear tabla webhook_logs
CREATE TABLE IF NOT EXISTS webhook_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    webhook_id INT NOT NULL,
    event VARCHAR(100) NOT NULL,
    payload JSON NOT NULL,
    response_status INT NULL,
    response_body TEXT NULL,
    error_message TEXT NULL,
    duration_ms INT NULL COMMENT 'Duración de la petición en ms',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (webhook_id) REFERENCES webhooks(id) ON DELETE CASCADE,
    INDEX idx_webhook (webhook_id),
    INDEX idx_event (event),
    INDEX idx_status (response_status),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

