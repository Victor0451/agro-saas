-- Fix categorias_insumos: replace inconsistent seeds with canonical 7 categories
-- Migration 011 seeded 4 categories; the API route seeded 6 different ones.
-- This migration establishes the single canonical set.
-- System is pre-production: clear insumos first to release FK constraint.

DELETE FROM insumos;
DELETE FROM categorias_insumos;

INSERT INTO categorias_insumos (nombre, descripcion) VALUES
  ('Combustibles',  'Gas oil, nafta, lubricantes'),
  ('Almácigos',     'Bandejas, sustrato, manta térmica, plásticos'),
  ('Insecticidas',  'Control de plagas foliares y del suelo'),
  ('Herbicidas',    'Control de malezas'),
  ('Fertilizantes', 'Nutrición foliar y edáfica'),
  ('Funguicidas',   'Control de enfermedades fúngicas'),
  ('Otros',         'Insumos varios no categorizados');
