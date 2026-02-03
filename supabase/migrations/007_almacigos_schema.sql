-- 1. Add Foreign Keys to Almacigos table to track which Inputs were used
ALTER TABLE almacigos
ADD COLUMN insumo_semilla_id UUID REFERENCES insumos(id) ON DELETE SET NULL,
ADD COLUMN insumo_sustrato_id UUID REFERENCES insumos(id) ON DELETE SET NULL;

-- 2. Create RPC Function to Register Sowing and Deduct Stock Atomicallly
CREATE OR REPLACE FUNCTION registrar_almacigo(
  p_tenant_id UUID,
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
SECURITY DEFINER -- Run as owner to ensure we can update stock even if RLS is tricky (though policies should allow it)
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
      tenant_id, fecha, variedad, cantidad_bandejas,
      insumo_semilla_id, semilla_usada,
      insumo_sustrato_id, sustrato_usado,
      observaciones
  ) VALUES (
      p_tenant_id, p_fecha, p_variedad, p_cantidad_bandejas,
      p_insumo_semilla_id, p_semilla_usada,
      p_insumo_sustrato_id, p_sustrato_usado,
      p_observaciones
  ) RETURNING id INTO v_new_id;

  RETURN jsonb_build_object('id', v_new_id, 'success', true);
END;
$$;
