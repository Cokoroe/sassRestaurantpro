DO $$
BEGIN
    -- 1. Thêm cột item_id nếu chưa tồn tại
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'menu_options'
          AND column_name = 'item_id'
    ) THEN
        ALTER TABLE public.menu_options
            ADD COLUMN item_id UUID;
    END IF;

    -- 2. Thêm constraint FK nếu chưa tồn tại
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_menu_options_item'
          AND conrelid = 'public.menu_options'::regclass
    ) THEN
        ALTER TABLE public.menu_options
            ADD CONSTRAINT fk_menu_options_item
            FOREIGN KEY (item_id)
                REFERENCES public.menu_items (id)
                ON DELETE CASCADE;
    END IF;
END $$;
