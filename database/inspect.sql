-- ============================================
-- Ver estructura de tablas existentes
-- ============================================

DESCRIBE jobs;
DESCRIBE opportunities;
DESCRIBE syllabi;
DESCRIBE invoice_series;

-- Ver foreign keys existentes
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'matchengine'
  AND REFERENCED_TABLE_NAME IS NOT NULL;
