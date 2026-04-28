-- =============================================
-- 数据库字段更新脚本
-- 更新图片字段名称和添加URL前缀支持
-- 创建时间：2025-01-27
-- =============================================

-- 使用数据库
USE `parking_management`;

-- =============================================
-- 1. 更新离场记录表字段名
-- =============================================

-- 将 leave_car_license_picture 字段重命名为 leave_car_full_picture
ALTER TABLE `report_car_out` 
CHANGE COLUMN `leave_car_license_picture` `leave_car_full_picture` varchar(500) DEFAULT NULL COMMENT '离场车辆全图';

-- =============================================
-- 2. 为进场记录表添加图片字段
-- =============================================

-- 检查字段是否已存在，如果不存在则添加
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = 'parking_management' 
     AND TABLE_NAME = 'report_car_in' 
     AND COLUMN_NAME = 'enter_car_full_picture') = 0,
    'ALTER TABLE `report_car_in` ADD COLUMN `enter_car_full_picture` varchar(500) DEFAULT NULL COMMENT ''进场车辆全图'' AFTER `enter_car_type`;',
    'SELECT ''字段已存在，无需添加'';'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 检查字段是否已存在，如果不存在则添加
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = 'parking_management' 
     AND TABLE_NAME = 'report_car_in' 
     AND COLUMN_NAME = 'enter_custom_vip_name') = 0,
    'ALTER TABLE `report_car_in` ADD COLUMN `enter_custom_vip_name` varchar(100) DEFAULT NULL COMMENT ''进场VIP名称'' AFTER `enter_car_type`;',
    'SELECT ''字段已存在，无需添加'';'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =============================================
-- 3. 更新现有数据（为图片URL添加前缀）
-- =============================================

-- 更新离场记录表中的图片URL（添加前缀）
UPDATE `report_car_out` 
SET `leave_car_full_picture` = CONCAT('@http://cl.nefu.edu.cn:8092', `leave_car_full_picture`)
WHERE `leave_car_full_picture` IS NOT NULL 
  AND `leave_car_full_picture` != '' 
  AND `leave_car_full_picture` NOT LIKE '@http://cl.nefu.edu.cn:8092%';

UPDATE `report_car_out` 
SET `enter_car_full_picture` = CONCAT('@http://cl.nefu.edu.cn:8092', `enter_car_full_picture`)
WHERE `enter_car_full_picture` IS NOT NULL 
  AND `enter_car_full_picture` != '' 
  AND `enter_car_full_picture` NOT LIKE '@http://cl.nefu.edu.cn:8092%';

-- 更新进场记录表中的图片URL（添加前缀）
UPDATE `report_car_in` 
SET `enter_car_full_picture` = CONCAT('@http://cl.nefu.edu.cn:8092', `enter_car_full_picture`)
WHERE `enter_car_full_picture` IS NOT NULL 
  AND `enter_car_full_picture` != '' 
  AND `enter_car_full_picture` NOT LIKE '@http://cl.nefu.edu.cn:8092%';

-- =============================================
-- 4. 验证更新结果
-- =============================================

-- 显示表结构
DESCRIBE `report_car_in`;
DESCRIBE `report_car_out`;

-- 显示更新后的数据示例
SELECT 
    id, 
    car_license_number, 
    enter_car_full_picture,
    enter_custom_vip_name
FROM `report_car_in` 
WHERE enter_car_full_picture IS NOT NULL 
LIMIT 5;

SELECT 
    id, 
    car_license_number, 
    leave_car_full_picture,
    enter_car_full_picture
FROM `report_car_out` 
WHERE leave_car_full_picture IS NOT NULL OR enter_car_full_picture IS NOT NULL
LIMIT 5;

-- =============================================
-- 脚本执行完成
-- =============================================
