-- Create Labores table
CREATE TABLE IF NOT EXISTS labores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    finca_id UUID NOT NULL REFERENCES fincas(id) ON DELETE CASCADE,
    lote_id UUID NOT NULL REFERENCES lotes(id) ON DELETE CASCADE,
    
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    tipo_labor VARCHAR NOT NULL, -- 'Fertilizacion', 'Riego', 'Curacion', 'Poda', etc.
    estado_fenologico VARCHAR, -- 'Vegetativo', 'Floracion', etc.
    
    jornales DECIMAL(10,2) DEFAULT 0,
    costo_jornales DECIMAL(10,2) DEFAULT 0, -- Optional explicit cost
    
    observaciones TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Labores Insumos (Detail) table
CREATE TABLE IF NOT EXISTS labores_insumos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    labor_id UUID NOT NULL REFERENCES labores(id) ON DELETE CASCADE,
    insumo_id UUID NOT NULL REFERENCES insumos(id) ON DELETE RESTRICT,
    cantidad DECIMAL(10,2) NOT NULL,
    -- Snapshot of cost at time of usage could be added here if needed
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_labores_finca ON labores(finca_id);
CREATE INDEX IF NOT EXISTS idx_labores_lote ON labores(lote_id);
CREATE INDEX IF NOT EXISTS idx_labores_insumos_labor ON labores_insumos(labor_id);

-- RLS Policies
ALTER TABLE labores ENABLE ROW LEVEL SECURITY;
ALTER TABLE labores_insumos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view labors of their tenant" ON labores;
CREATE POLICY "Users can view labors of their tenant" ON labores
    FOR SELECT USING (tenant_id = get_current_tenant_id());

DROP POLICY IF EXISTS "Users can insert labors of their tenant" ON labores;
CREATE POLICY "Users can insert labors of their tenant" ON labores
    FOR INSERT WITH CHECK (tenant_id = get_current_tenant_id());

DROP POLICY IF EXISTS "Users can view labor details of their tenant" ON labores_insumos;
CREATE POLICY "Users can view labor details of their tenant" ON labores_insumos
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM labores l WHERE l.id = labores_insumos.labor_id AND l.tenant_id = get_current_tenant_id())
    );

-- RPC for Transactional Recording
CREATE OR REPLACE FUNCTION registrar_labor(
  p_tenant_id UUID,
  p_finca_id UUID,
  p_lote_id UUID,
  p_fecha DATE,
  p_tipo_labor VARCHAR,
  p_estado_fenologico VARCHAR,
  p_jornales DECIMAL,
  p_observaciones TEXT,
  p_insumos JSONB -- Array of { insumo_id: uuid, cantidad: number }
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_labor_id UUID;
  v_insumo JSONB;
  v_stock_actual DECIMAL;
  v_insumo_id UUID;
  v_cantidad DECIMAL;
BEGIN
  -- 1. Insert Labor Header
  INSERT INTO labores (
    tenant_id, finca_id, lote_id, fecha, tipo_labor, estado_fenologico, jornales, observaciones
  ) VALUES (
    p_tenant_id, p_finca_id, p_lote_id, p_fecha, p_tipo_labor, p_estado_fenologico, p_jornales, p_observaciones
  ) RETURNING id INTO v_labor_id;

  -- 2. Process Insumos
  IF p_insumos IS NOT NULL AND jsonb_array_length(p_insumos) > 0 THEN
    FOR v_insumo IN SELECT * FROM jsonb_array_elements(p_insumos)
    LOOP
       v_insumo_id := (v_insumo->>'insumo_id')::UUID;
       v_cantidad := (v_insumo->>'cantidad')::DECIMAL;
       
       -- Check Stock
       SELECT stock_actual INTO v_stock_actual FROM insumos WHERE id = v_insumo_id AND tenant_id = p_tenant_id;
       
       IF v_stock_actual IS NULL THEN
          RAISE EXCEPTION 'Insumo % no encontrado', v_insumo_id;
       END IF;
       
       IF v_stock_actual < v_cantidad THEN
          RAISE EXCEPTION 'Stock insuficiente para insumo %. Disp: %, Req: %', v_insumo_id, v_stock_actual, v_cantidad;
       END IF;
       
       -- Deduct Stock
       UPDATE insumos SET stock_actual = stock_actual - v_cantidad, updated_at = NOW() WHERE id = v_insumo_id;
       
       -- Record Usage Detail
       INSERT INTO labores_insumos (labor_id, insumo_id, cantidad) VALUES (v_labor_id, v_insumo_id, v_cantidad);
    END LOOP;
  END IF;

  RETURN jsonb_build_object('id', v_labor_id, 'success', true);
END;
$$;
