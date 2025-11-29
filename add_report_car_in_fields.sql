-- 为 report_car_in 表添加新字段的 ALTER TABLE 语句
-- 执行前请确保数据库已存在 report_car_in 表

-- 添加进场VIP名称字段
ALTER TABLE `report_car_in` 
ADD COLUMN `enter_custom_vip_name` varchar(100) DEFAULT NULL COMMENT '进场VIP名称';

-- 添加进场车辆全图字段
ALTER TABLE `report_car_in` 
ADD COLUMN `enter_car_full_picture` varchar(500) DEFAULT NULL COMMENT '进场车辆全图';

-- 验证字段是否添加成功
DESCRIBE `report_car_in`;

-- 可选：为新字段添加索引（如果需要）
-- ALTER TABLE `report_car_in` ADD INDEX `idx_enter_custom_vip_name` (`enter_custom_vip_name`);
-- ALTER TABLE `report_car_in` ADD INDEX `idx_enter_car_full_picture` (`enter_car_full_picture`);
