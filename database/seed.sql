-- ============================================
-- DATOS DE PRUEBA (seed)
-- ============================================

-- Usuario demo
INSERT INTO users (email, name, status, subscription_plan) VALUES
('demo@matchengine.com', 'Usuario Demo', 'active', 'premium'),
('test@matchengine.com', 'Usuario Test', 'trial', 'free');

-- Configuraciones de búsqueda
INSERT INTO search_configs (user_id, name, queries, filters, max_results, run_interval_minutes) VALUES
(1, 'Oposiciones Andalucía con cupo discapacidad', 
 JSON_ARRAY(
    'site:juntadeandalucia.es convocatoria empleo publico discapacidad',
    'site:juntadeandalucia.es proceso selectivo discapacidad',
    'junta de andalucia oposiciones discapacidad plazo solicitud'
 ),
 JSON_OBJECT(
    'autonomous_region', 'Andalucía',
    'disability_quota', true
 ),
 10,
 30
),
(1, 'Oposiciones educación España', 
 JSON_ARRAY(
    'convocatoria oposiciones maestros profesores',
    'proceso selectivo educación docente'
 ),
 JSON_OBJECT(
    'education_level', 'Universidad',
    'specialty', 'educación'
 ),
 15,
 60
);

-- Consulta para ver datos
SELECT 
    u.email,
    sc.name,
    sc.queries,
    sc.is_active
FROM users u
JOIN search_configs sc ON sc.user_id = u.id;
