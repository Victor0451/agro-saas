-- 1. Add finca_id to almacigos table
ALTER TABLE almacigos
ADD COLUMN finca_id UUID REFERENCES fincas(id) ON DELETE CASCADE;

-- 2. Create index for performance
CREATE INDEX idx_almacigos_finca ON almacigos(finca_id);

-- 3. Update RPC to include finca_id
CREATE OR REPLACE FUNCTION registrar_almacigo(
  p_tenant_id UUID,
  p_finca_id UUID,
  p_fecha DATE,
  p_variedad VARCHAR,
  p_cantidad_bandejas INTEGER,
  p_insumo_semilla_id UUID,
  p_semilla_usada DECIMAL,
  p_insumo_sustrato_id UUID, -- Optional
  p_sustrato_usado DECIMAL, -- Optional
  p_observaciones TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_id UUID;
  v_stock_semilla DECIMAL;
  v_stock_sustrato DECIMAL;
BEGIN
  -- Validation: Check Seed Stock
  SELECT stock_actual INTO v_stock_semilla FROM insumos WHERE id = p_insumo_semilla_id AND tenant_id = p_tenant_id;
  
  IF v_stock_semilla IS NULL THEN
    RAISE EXCEPTION 'Insumo de semilla no encontrado';
  END IF;
  
  IF v_stock_semilla < p_semilla_usada THEN
    RAISE EXCEPTION 'Stock insuficiente de semilla. Disponible: %, Requerido: %', v_stock_semilla, p_semilla_usada;
  END IF;

  -- Validation: Check Substrate Stock (if provided)
  IF p_insumo_sustrato_id IS NOT NULL AND p_sustrato_usado > 0 THEN
      SELECT stock_actual INTO v_stock_sustrato FROM insumos WHERE id = p_insumo_sustrato_id AND tenant_id = p_tenant_id;
      
      IF v_stock_sustrato IS NULL THEN
        RAISE EXCEPTION 'Insumo de sustrato no encontrado';
      END IF;

      IF v_stock_sustrato < p_sustrato_usado THEN
        RAISE EXCEPTION 'Stock insuficiente de sustrato. Disponible: %, Requerido: %', v_stock_sustrato, p_sustrato_usado;
      END IF;
      
      -- Update Substrate
      UPDATE insumos
      SET stock_actual = stock_actual - p_sustrato_usado,
          updated_at = NOW()
      WHERE id = p_insumo_sustrato_id;
  END IF;

  -- Update Seed
  UPDATE insumos
  SET stock_actual = stock_actual - p_semilla_usada,
      updated_at = NOW()
  WHERE id = p_insumo_semilla_id;

  -- Insert Almacigo Record
  INSERT INTO almacigos (
      tenant_id, finca_id, fecha, variedad, cantidad_bandejas,
      insumo_semilla_id, semilla_usada,
      insumo_sustrato_id, sustrato_usado,
      observaciones
  ) VALUES (
      p_tenant_id, p_finca_id, p_fecha, p_variedad, p_cantidad_bandejas,
      p_insumo_semilla_id, p_semilla_usada,
      p_insumo_sustrato_id, p_sustrato_usado,
      p_observaciones
  ) RETURNING id INTO v_new_id;

  RETURN jsonb_build_object('id', v_new_id, 'success', true);
END;
$$;
