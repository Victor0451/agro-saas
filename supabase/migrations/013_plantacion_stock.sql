-- 1. Add tracking columns
ALTER TABLE almacigos
ADD COLUMN bandejas_plantadas INTEGER DEFAULT 0;

ALTER TABLE plantaciones
ADD COLUMN bandejas_usadas INTEGER DEFAULT 0;

-- 2. Create RPC for Transactional Planting
CREATE OR REPLACE FUNCTION registrar_plantacion(
  p_tenant_id UUID,
  p_finca_id UUID,
  p_lote_id UUID,
  p_fecha DATE,
  p_variedad VARCHAR,
  p_almacigo_id UUID, -- Optional
  p_cantidad_plantas INTEGER,
  p_bandejas_usadas INTEGER, -- How many trays were used from the Almacigo source
  p_superficie_cubierta DECIMAL,
  p_observaciones TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_id UUID;
  v_stock_bandejas INTEGER;
  v_bandejas_plantadas INTEGER;
BEGIN
  -- If source Almacigo is provided, check and update stock
  IF p_almacigo_id IS NOT NULL THEN
      SELECT cantidad_bandejas, bandejas_plantadas 
      INTO v_stock_bandejas, v_bandejas_plantadas
      FROM almacigos 
      WHERE id = p_almacigo_id AND tenant_id = p_tenant_id;
      
      IF v_stock_bandejas IS NULL THEN
        RAISE EXCEPTION 'Almácigo de origen no encontrado';
      END IF;

      -- Check available stock
      IF (v_stock_bandejas - v_bandejas_plantadas) < p_bandejas_usadas THEN
        RAISE EXCEPTION 'Stock insuficiente en Almácigo. Disponibles: %, Solicitadas: %', (v_stock_bandejas - v_bandejas_plantadas), p_bandejas_usadas;
      END IF;
      
      -- Update usage
      UPDATE almacigos
      SET bandejas_plantadas = bandejas_plantadas + p_bandejas_usadas,
          updated_at = NOW()
      WHERE id = p_almacigo_id;
  END IF;

  -- Insert Plantacion Record
  INSERT INTO plantaciones (
      tenant_id, finca_id, lote_id, fecha, variedad,
      almacigo_id, cantidad_plantas, bandejas_usadas,
      superficie_cubierta, observaciones
  ) VALUES (
      p_tenant_id, p_finca_id, p_lote_id, p_fecha, p_variedad,
      p_almacigo_id, p_cantidad_plantas, p_bandejas_usadas,
      p_superficie_cubierta, p_observaciones
  ) RETURNING id INTO v_new_id;

  RETURN jsonb_build_object('id', v_new_id, 'success', true);
END;
$$;
