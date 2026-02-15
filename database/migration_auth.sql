-- ============================================
-- MIGRATION: Sistema de Autenticación
-- Fecha: 2026-02-15
-- ============================================

-- Agregar campo password a users
ALTER TABLE users 
ADD COLUMN password_hash VARCHAR(255) NULL AFTER email,
ADD COLUMN last_login_at DATETIME NULL AFTER updated_at;

-- Crear índice para búsqueda rápida por email
ALTER TABLE users 
ADD INDEX idx_email (email);

-- Tabla de sesiones (opcional, si no usas JWT puro)
CREATE TABLE IF NOT EXISTS user_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(512) NOT NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token (token(255)),
    INDEX idx_user (user_id),
    INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Limpiar sesiones expiradas (ejecutar periodicamente)
-- DELETE FROM user_sessions WHERE expires_at < NOW();

