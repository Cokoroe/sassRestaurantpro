-- V22_add_itemid_to_menu_options.sql
-- Thêm cột item_id để gắn option với item,
-- và thêm ràng buộc khóa ngoại + index.

-- 1. Thêm cột item_id (tạm thời cho phép NULL để tránh lỗi nếu đã có dữ liệu)
ALTER TABLE menu_options
ADD COLUMN item_id UUID;

-- 2. (OPTIONAL) Nếu hệ thống đã có sẵn dữ liệu thì cần backfill ở đây.
-- Ví dụ:
-- UPDATE menu_options mo
-- SET item_id = mi.id
-- FROM menu_items mi
-- WHERE ... điều kiện mapping ...
--;
-- Với project hiện tại bảng menu_options đang trống nên có thể bỏ qua bước này.

-- 3. Set NOT NULL cho item_id
ALTER TABLE menu_options
ALTER COLUMN item_id SET NOT NULL;

-- 4. Thêm ràng buộc khóa ngoại đến menu_items(id)
ALTER TABLE menu_options
ADD CONSTRAINT fk_menu_options_item
FOREIGN KEY (item_id)
REFERENCES menu_items(id)
ON DELETE RESTRICT;

-- Nếu muốn xóa item thì tự động xóa luôn option, dùng:
-- ON DELETE CASCADE;

-- 5. Thêm index để truy vấn nhanh theo item_id
CREATE INDEX idx_menu_options_item_id
    ON menu_options(item_id);
