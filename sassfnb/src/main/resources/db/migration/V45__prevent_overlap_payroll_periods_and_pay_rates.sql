-- =====================================================================
-- V45__prevent_overlap_payroll_periods_and_pay_rates.sql
-- Mục tiêu:
-- 1) Chặn overlap payroll_periods theo outlet_id
-- 2) Chặn overlap pay_rates theo (outlet_id, staff_id)
-- Kỹ thuật: EXCLUDE USING gist với daterange/tstzrange + btree_gist
-- Idempotent: safe to re-run
-- Flyway-safe: KHÔNG dùng BEGIN/COMMIT (Flyway quản transaction)
-- =====================================================================

-- Needed for EXCLUDE with equality on UUID/text/etc.
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- =========================================================
-- 1) payroll_periods: prevent overlap per outlet_id
-- =========================================================
DO $$
DECLARE
  v_tbl_exists   BOOLEAN;
  v_outlet_col   TEXT;
  v_start_col    TEXT;
  v_end_col      TEXT;
  v_start_type   TEXT;
  v_end_type     TEXT;
  v_use_date     BOOLEAN := FALSE;
  v_conname      TEXT := 'ex_payroll_periods_no_overlap';
  v_sql          TEXT;
  v_relid        REGCLASS;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'payroll_periods'
  ) INTO v_tbl_exists;

  IF NOT v_tbl_exists THEN
    RAISE NOTICE 'V45: table public.payroll_periods not found, skip payroll overlap constraint.';
    RETURN;
  END IF;

  -- outlet_id
  SELECT c.column_name
  INTO v_outlet_col
  FROM information_schema.columns c
  WHERE c.table_schema='public'
    AND c.table_name='payroll_periods'
    AND c.column_name IN ('outlet_id')
  LIMIT 1;

  -- start col candidates
  SELECT c.column_name, c.data_type
  INTO v_start_col, v_start_type
  FROM information_schema.columns c
  WHERE c.table_schema='public'
    AND c.table_name='payroll_periods'
    AND c.column_name IN ('start_date','start_at','starts_at','from_date','from_at','from_time','starts_on')
  ORDER BY CASE c.column_name
    WHEN 'start_date' THEN 1
    WHEN 'start_at' THEN 2
    WHEN 'starts_at' THEN 3
    WHEN 'from_date' THEN 4
    WHEN 'from_at' THEN 5
    WHEN 'from_time' THEN 6
    WHEN 'starts_on' THEN 7
    ELSE 99 END
  LIMIT 1;

  -- end col candidates
  SELECT c.column_name, c.data_type
  INTO v_end_col, v_end_type
  FROM information_schema.columns c
  WHERE c.table_schema='public'
    AND c.table_name='payroll_periods'
    AND c.column_name IN ('end_date','end_at','ends_at','to_date','to_at','to_time','ends_on')
  ORDER BY CASE c.column_name
    WHEN 'end_date' THEN 1
    WHEN 'end_at' THEN 2
    WHEN 'ends_at' THEN 3
    WHEN 'to_date' THEN 4
    WHEN 'to_at' THEN 5
    WHEN 'to_time' THEN 6
    WHEN 'ends_on' THEN 7
    ELSE 99 END
  LIMIT 1;

  IF v_outlet_col IS NULL OR v_start_col IS NULL OR v_end_col IS NULL THEN
    RAISE NOTICE
      'V45: payroll_periods missing required columns. outlet_id=%, start=%, end=% => SKIP',
      v_outlet_col, v_start_col, v_end_col;
    RETURN;
  END IF;

  -- Decide range type
  v_use_date := (v_start_type = 'date' AND v_end_type = 'date');

  -- Resolve table regclass once
  v_relid := 'public.payroll_periods'::regclass;

  -- Create constraint if not exists (scoped to this table)
  IF EXISTS (
    SELECT 1
    FROM pg_constraint pc
    WHERE pc.conrelid = v_relid
      AND pc.conname  = v_conname
  ) THEN
    RAISE NOTICE 'V45: constraint % already exists on payroll_periods, skip.', v_conname;
    RETURN;
  END IF;

  IF v_use_date THEN
    v_sql := format(
      'ALTER TABLE public.payroll_periods
       ADD CONSTRAINT %I
       EXCLUDE USING gist (
         %I WITH =,
         daterange(%I, %I, ''[]'') WITH &&
       );',
      v_conname, v_outlet_col, v_start_col, v_end_col
    );
  ELSE
    v_sql := format(
      'ALTER TABLE public.payroll_periods
       ADD CONSTRAINT %I
       EXCLUDE USING gist (
         %I WITH =,
         tstzrange((%I)::timestamptz, (%I)::timestamptz, ''[]'') WITH &&
       );',
      v_conname, v_outlet_col, v_start_col, v_end_col
    );
  END IF;

  EXECUTE v_sql;

  RAISE NOTICE
    'V45: created % on payroll_periods: outlet=%, start=%(%), end=%(%)',
    v_conname, v_outlet_col, v_start_col, v_start_type, v_end_col, v_end_type;
END $$;

-- =========================================================
-- 2) pay_rates: prevent overlap per (outlet_id, staff_id)
-- =========================================================
DO $$
DECLARE
  v_tbl_exists   BOOLEAN;
  v_outlet_col   TEXT;
  v_staff_col    TEXT;
  v_start_col    TEXT;
  v_end_col      TEXT;
  v_start_type   TEXT;
  v_end_type     TEXT;
  v_use_date     BOOLEAN := FALSE;
  v_conname      TEXT := 'ex_pay_rates_no_overlap';
  v_sql          TEXT;
  v_relid        REGCLASS;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'pay_rates'
  ) INTO v_tbl_exists;

  IF NOT v_tbl_exists THEN
    RAISE NOTICE 'V45: table public.pay_rates not found, skip pay_rates overlap constraint.';
    RETURN;
  END IF;

  -- outlet_id
  SELECT c.column_name
  INTO v_outlet_col
  FROM information_schema.columns c
  WHERE c.table_schema='public'
    AND c.table_name='pay_rates'
    AND c.column_name IN ('outlet_id')
  LIMIT 1;

  -- staff col candidates
  SELECT c.column_name
  INTO v_staff_col
  FROM information_schema.columns c
  WHERE c.table_schema='public'
    AND c.table_name='pay_rates'
    AND c.column_name IN ('staff_id','employee_id','user_id')
  ORDER BY CASE c.column_name
    WHEN 'staff_id' THEN 1
    WHEN 'employee_id' THEN 2
    WHEN 'user_id' THEN 3
    ELSE 99 END
  LIMIT 1;

  -- start col candidates
  SELECT c.column_name, c.data_type
  INTO v_start_col, v_start_type
  FROM information_schema.columns c
  WHERE c.table_schema='public'
    AND c.table_name='pay_rates'
    AND c.column_name IN ('effective_from','effective_start','start_date','start_at','valid_from','from_date','begins_at')
  ORDER BY CASE c.column_name
    WHEN 'effective_from' THEN 1
    WHEN 'effective_start' THEN 2
    WHEN 'start_date' THEN 3
    WHEN 'start_at' THEN 4
    WHEN 'valid_from' THEN 5
    WHEN 'from_date' THEN 6
    WHEN 'begins_at' THEN 7
    ELSE 99 END
  LIMIT 1;

  -- end col candidates
  SELECT c.column_name, c.data_type
  INTO v_end_col, v_end_type
  FROM information_schema.columns c
  WHERE c.table_schema='public'
    AND c.table_name='pay_rates'
    AND c.column_name IN ('effective_to','effective_end','end_date','end_at','valid_to','to_date','ends_at')
  ORDER BY CASE c.column_name
    WHEN 'effective_to' THEN 1
    WHEN 'effective_end' THEN 2
    WHEN 'end_date' THEN 3
    WHEN 'end_at' THEN 4
    WHEN 'valid_to' THEN 5
    WHEN 'to_date' THEN 6
    WHEN 'ends_at' THEN 7
    ELSE 99 END
  LIMIT 1;

  IF v_outlet_col IS NULL OR v_staff_col IS NULL OR v_start_col IS NULL OR v_end_col IS NULL THEN
    RAISE NOTICE
      'V45: pay_rates missing required columns. outlet_id=%, staff=%, start=%, end=% => SKIP',
      v_outlet_col, v_staff_col, v_start_col, v_end_col;
    RETURN;
  END IF;

  -- Decide range type
  v_use_date := (v_start_type = 'date' AND v_end_type = 'date');

  -- Resolve table regclass once
  v_relid := 'public.pay_rates'::regclass;

  -- Create constraint if not exists (scoped to this table)
  IF EXISTS (
    SELECT 1
    FROM pg_constraint pc
    WHERE pc.conrelid = v_relid
      AND pc.conname  = v_conname
  ) THEN
    RAISE NOTICE 'V45: constraint % already exists on pay_rates, skip.', v_conname;
    RETURN;
  END IF;

  IF v_use_date THEN
    v_sql := format(
      'ALTER TABLE public.pay_rates
       ADD CONSTRAINT %I
       EXCLUDE USING gist (
         %I WITH =,
         %I WITH =,
         daterange(%I, %I, ''[]'') WITH &&
       );',
      v_conname, v_outlet_col, v_staff_col, v_start_col, v_end_col
    );
  ELSE
    v_sql := format(
      'ALTER TABLE public.pay_rates
       ADD CONSTRAINT %I
       EXCLUDE USING gist (
         %I WITH =,
         %I WITH =,
         tstzrange((%I)::timestamptz, (%I)::timestamptz, ''[]'') WITH &&
       );',
      v_conname, v_outlet_col, v_staff_col, v_start_col, v_end_col
    );
  END IF;

  EXECUTE v_sql;

  RAISE NOTICE
    'V45: created % on pay_rates: outlet=%, staff=%, start=%(%), end=%(%)',
    v_conname, v_outlet_col, v_staff_col, v_start_col, v_start_type, v_end_col, v_end_type;
END $$;
