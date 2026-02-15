-- ============================================
-- MIGRATION: Agregar sistema de notificaciones
-- Fecha: 2026-02-15
-- ============================================

-- Crear tabla notification_settings
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

-- Insertar configuración por defecto para usuarios existentes (opcional)
-- INSERT INTO notification_settings (user_id, email_enabled, notify_on_new_opportunity)
-- SELECT id, 0, 1 FROM users WHERE id NOT IN (SELECT user_id FROM notification_settings);

