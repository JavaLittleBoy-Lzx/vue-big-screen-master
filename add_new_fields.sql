-- 为 report_car_out 表添加新字段的 ALTER TABLE 语句
-- 执行前请确保数据库已存在 report_car_out 表

-- 添加离场VIP名称字段
ALTER TABLE `report_car_out` 
ADD COLUMN `leave_custom_vip_name` varchar(100) DEFAULT NULL COMMENT '离场VIP名称';

-- 添加应收金额字段
ALTER TABLE `report_car_out` 
ADD COLUMN `amount_receivable` varchar(20) DEFAULT NULL COMMENT '应收金额';

-- 添加离场车牌图片字段
ALTER TABLE `report_car_out` 
ADD COLUMN `leave_car_license_picture` varchar(500) DEFAULT NULL COMMENT '离场车牌图片';

-- 添加进场车辆全图字段
ALTER TABLE `report_car_out` 
ADD COLUMN `enter_car_full_picture` varchar(500) DEFAULT NULL COMMENT '进场车辆全图';

-- 验证字段是否添加成功
DESCRIBE `report_car_out`;

-- 可选：为新字段添加索引（如果需要）
-- ALTER TABLE `report_car_out` ADD INDEX `idx_leave_custom_vip_name` (`leave_custom_vip_name`);
-- ALTER TABLE `report_car_out` ADD INDEX `idx_amount_receivable` (`amount_receivable`);
