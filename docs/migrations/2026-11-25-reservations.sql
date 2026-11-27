-- Đặt bàn trước: thêm SĐT liên hệ, số khách và trạng thái CONFIRMED cho lịch hẹn.
-- Local (H2, ddl-auto: update) tự thêm cột. Profile Supabase (ddl-auto: validate) phải chạy tay
-- trong Supabase SQL Editor TRƯỚC khi deploy bản có tính năng đặt bàn. Chạy lại nhiều lần không sao.

ALTER TABLE restaurant.orders ADD COLUMN IF NOT EXISTS contact_phone varchar(20);
ALTER TABLE restaurant.orders ADD COLUMN IF NOT EXISTS guest_count integer;

-- Trạng thái CONFIRMED: cột status lưu chuỗi (@Enumerated STRING). Tùy cách bảng được tạo,
-- cột có thể là kiểu enum của Postgres hoặc varchar kèm CHECK liệt kê trạng thái; xử lý cả hai.
DO $$
DECLARE
    status_type text;
    c record;
BEGIN
    SELECT format_type(a.atttypid, a.atttypmod) INTO status_type
    FROM pg_attribute a
    WHERE a.attrelid = 'restaurant.orders'::regclass AND a.attname = 'status' AND NOT a.attisdropped;

    IF EXISTS (SELECT 1 FROM pg_type t
               JOIN pg_attribute a ON a.atttypid = t.oid
               WHERE a.attrelid = 'restaurant.orders'::regclass AND a.attname = 'status' AND t.typtype = 'e') THEN
        -- Kiểu enum của Postgres
        EXECUTE format('ALTER TYPE %s ADD VALUE IF NOT EXISTS %L', status_type, 'CONFIRMED');
    ELSE
        -- varchar: bỏ CHECK cũ trên cột status (không đụng payment_status) rồi tạo lại đủ trạng thái
        FOR c IN
            SELECT con.conname
            FROM pg_constraint con
            WHERE con.conrelid = 'restaurant.orders'::regclass
              AND con.contype = 'c'
              AND pg_get_constraintdef(con.oid) ~ '(^|[^_a-z])status'
        LOOP
            EXECUTE format('ALTER TABLE restaurant.orders DROP CONSTRAINT %I', c.conname);
        END LOOP;
        ALTER TABLE restaurant.orders ADD CONSTRAINT orders_status_check
            CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED', 'SCHEDULED', 'CONFIRMED'));
    END IF;
END $$;
