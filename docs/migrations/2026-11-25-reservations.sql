-- Đặt bàn trước: thêm SĐT liên hệ và số khách cho lịch hẹn.
-- Local (H2, ddl-auto: update) tự thêm cột. Profile Supabase (ddl-auto: validate) phải chạy tay trước khi deploy:
ALTER TABLE restaurant.orders ADD COLUMN IF NOT EXISTS contact_phone varchar(20);
ALTER TABLE restaurant.orders ADD COLUMN IF NOT EXISTS guest_count integer;
-- Trạng thái mới CONFIRMED lưu dạng chuỗi trong cột status, không cần đổi schema.
-- Nếu cột status có CHECK constraint liệt kê trạng thái, thêm 'CONFIRMED' vào constraint đó.
