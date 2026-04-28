-- =============================================
-- 停车场管理系统数据库创建脚本
-- 基于实体类：ReportCarIn, ReportCarOut, PaymentRecord
-- 创建时间：2025-01-27
-- =============================================

-- 创建数据库
CREATE DATABASE IF NOT EXISTS `parking_management` 
DEFAULT CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- 使用数据库
USE `parking_management`;

-- =============================================
-- 1. 车辆进场记录表 (report_car_in)
-- =============================================
DROP TABLE IF EXISTS `report_car_in`;

CREATE TABLE `report_car_in` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `car_license_number` varchar(20) DEFAULT NULL COMMENT '最终车牌号',
  `enter_channel_name` varchar(100) DEFAULT NULL COMMENT '进场通道名称',
  `enter_time` varchar(50) DEFAULT NULL COMMENT '入场时间',
  `enter_type` varchar(50) DEFAULT NULL COMMENT '进场类型（正常进出/免费进出/异常进出）',
  `enter_vip_type` varchar(50) DEFAULT NULL COMMENT '进场Vip类型（月卡/临时卡/免费卡等）',
  `enter_car_license_color` varchar(20) DEFAULT NULL COMMENT '入场车牌颜色（黑色/白色/红色/蓝色/黄色/绿色/其他）',
  `enter_car_type` varchar(20) DEFAULT NULL COMMENT '车辆类型（小型车/大型车/摩托车）',
  `enter_custom_vip_name` varchar(100) DEFAULT NULL COMMENT '进场VIP名称',
  `enter_car_full_picture` varchar(500) DEFAULT NULL COMMENT '进场车辆全图',
  `deleted` int(1) NOT NULL DEFAULT '0' COMMENT '逻辑删除标识：0：未删除，1：已删除',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_car_license_number` (`car_license_number`),
  KEY `idx_enter_time` (`enter_time`),
  KEY `idx_enter_channel` (`enter_channel_name`),
  KEY `idx_deleted` (`deleted`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='车辆进场记录表';

-- =============================================
-- 2. 车辆离场记录表 (report_car_out)
-- =============================================
DROP TABLE IF EXISTS `report_car_out`;

CREATE TABLE `report_car_out` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `car_license_number` varchar(20) DEFAULT NULL COMMENT '最终车牌号',
  `enter_channel_name` varchar(100) DEFAULT NULL COMMENT '进场通道名称',
  `leave_channel_name` varchar(100) DEFAULT NULL COMMENT '出场通道名，路边停车场没有',
  `enter_time` varchar(50) DEFAULT NULL COMMENT '入场时间',
  `leave_time` varchar(50) DEFAULT NULL COMMENT '离场时间',
  `enter_type` varchar(50) DEFAULT NULL COMMENT '进场类型（正常进出/免费进出/异常进出）',
  `enter_vip_type` varchar(50) DEFAULT NULL COMMENT '进场Vip类型（月卡/临时卡/免费卡等）',
  `leave_vip_type` varchar(50) DEFAULT NULL COMMENT '出场Vip类型（月卡/临时卡/免费卡等）',
  `leave_custom_vip_name` varchar(100) DEFAULT NULL COMMENT '离场VIP名称',
  `amount_receivable` varchar(20) DEFAULT NULL COMMENT '应收金额',
  `leave_car_full_picture` varchar(500) DEFAULT NULL COMMENT '离场车辆全图',
  `enter_car_full_picture` varchar(500) DEFAULT NULL COMMENT '进场车辆全图',
  `leave_type` varchar(50) DEFAULT NULL COMMENT '离场类型（正常进出/免费进出/异常进出）',
  `enter_car_license_color` varchar(20) DEFAULT NULL COMMENT '入场车牌颜色（黑色/白色/红色/蓝色/黄色/绿色/其他）',
  `leave_car_license_color` varchar(20) DEFAULT NULL COMMENT '离场车牌颜色（黑色/白色/红色/蓝色/黄色/绿色/其他）',
  `enter_car_type` varchar(20) DEFAULT NULL COMMENT '入场车辆类型（小型车/大型车/摩托车）',
  `leave_car_type` varchar(20) DEFAULT NULL COMMENT '离场车辆类型（小型车/大型车/摩托车）',
  `record_type` varchar(20) DEFAULT NULL COMMENT '记录类型（正常记录/异常记录）',
  `stopping_time` varchar(100) DEFAULT NULL COMMENT '停车时长（格式化后的字符串，如：1小时30分钟20秒）',
  `remark` text COMMENT '备注',
  `deleted` int(1) NOT NULL DEFAULT '0' COMMENT '逻辑删除标识：0：未删除，1：已删除',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_car_license_number` (`car_license_number`),
  KEY `idx_enter_time` (`enter_time`),
  KEY `idx_leave_time` (`leave_time`),
  KEY `idx_enter_channel` (`enter_channel_name`),
  KEY `idx_leave_channel` (`leave_channel_name`),
  KEY `idx_deleted` (`deleted`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='车辆离场记录表';

-- =============================================
-- 3. 缴费记录表 (payment_record)
-- =============================================
DROP TABLE IF EXISTS `payment_record`;

CREATE TABLE `payment_record` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `payment_mode` varchar(50) DEFAULT NULL COMMENT '支付方式',
  `payment_mode_remark` varchar(200) DEFAULT NULL COMMENT '支付方式备注',
  `pay_origin` varchar(50) DEFAULT NULL COMMENT '支付来源',
  `pay_origin_remark` varchar(200) DEFAULT NULL COMMENT '支付来源备注',
  `pay_time` varchar(50) DEFAULT NULL COMMENT '支付时间',
  `pay_status` varchar(20) DEFAULT NULL COMMENT '支付状态',
  `actual_receivable` varchar(20) DEFAULT NULL COMMENT '实际应收金额',
  `amount_receivable` varchar(20) DEFAULT NULL COMMENT '应收金额',
  `car_plate_number` varchar(20) DEFAULT NULL COMMENT '车牌号码',
  `parking_duration` varchar(100) DEFAULT NULL COMMENT '停车时长（格式：xx小时xx分钟xx秒，若小时为0则不显示，分钟为0但小时不为0时显示，秒同理）',
  `deleted` int(1) NOT NULL DEFAULT '0' COMMENT '逻辑删除标识：0：未删除，1：已删除',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_car_plate_number` (`car_plate_number`),
  KEY `idx_pay_time` (`pay_time`),
  KEY `idx_pay_status` (`pay_status`),
  KEY `idx_deleted` (`deleted`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='缴费记录表';

-- =============================================
-- 创建索引优化查询性能
-- =============================================

-- 为进场记录表创建复合索引
CREATE INDEX `idx_car_enter_time` ON `report_car_in` (`car_license_number`, `enter_time`);
CREATE INDEX `idx_channel_enter_time` ON `report_car_in` (`enter_channel_name`, `enter_time`);

-- 为离场记录表创建复合索引
CREATE INDEX `idx_car_leave_time` ON `report_car_out` (`car_license_number`, `leave_time`);
CREATE INDEX `idx_enter_leave_time` ON `report_car_out` (`enter_time`, `leave_time`);
CREATE INDEX `idx_channel_leave_time` ON `report_car_out` (`leave_channel_name`, `leave_time`);

-- 为缴费记录表创建复合索引
CREATE INDEX `idx_car_pay_time` ON `payment_record` (`car_plate_number`, `pay_time`);
CREATE INDEX `idx_status_pay_time` ON `payment_record` (`pay_status`, `pay_time`);

-- =============================================
-- 插入示例数据（可选）
-- =============================================

-- 插入示例进场记录
INSERT INTO `report_car_in` (
    `car_license_number`, `enter_channel_name`, `enter_time`, 
    `enter_type`, `enter_vip_type`, `enter_car_license_color`, `enter_car_type`
) VALUES 
('京A12345', '东门入口', '2025-01-27 08:30:00', '正常进出', '临时卡', '蓝色', '小型车'),
('京B67890', '西门入口', '2025-01-27 09:15:00', '正常进出', '月卡', '白色', '小型车'),
('京C11111', '南门入口', '2025-01-27 10:00:00', '免费进出', '免费卡', '黑色', '大型车');

-- 插入示例离场记录
INSERT INTO `report_car_out` (
    `car_license_number`, `enter_channel_name`, `leave_channel_name`, 
    `enter_time`, `leave_time`, `enter_type`, `enter_vip_type`, `leave_vip_type`,
    `leave_custom_vip_name`, `amount_receivable`, `leave_car_full_picture`, `enter_car_full_picture`,
    `leave_type`, `enter_car_license_color`, `leave_car_license_color`,
    `enter_car_type`, `leave_car_type`, `record_type`, `stopping_time`
) VALUES 
('京A12345', '东门入口', '东门出口', '2025-01-27 08:30:00', '2025-01-27 12:30:00',
 '自动放行', '临时车', '临时车', '临时车主', '20.00', '/images/leave_001.jpg', '/images/enter_001.jpg',
 '自动放行', '蓝色', '蓝色', '小型车', '小型车', '正常记录', '4小时0分钟0秒'),
('京B67890', '西门入口', '西门出口', '2025-01-27 09:15:00', '2025-01-27 11:45:00',
 '确认放行', '本地VIP', '本地VIP', 'VIP会员', '15.00', '/images/leave_002.jpg', '/images/enter_002.jpg',
 '确认放行', '白色', '白色', '小型车', '小型车', '正常记录', '2小时30分钟0秒');

-- 插入示例缴费记录
INSERT INTO `payment_record` (
    `payment_mode`, `payment_mode_remark`, `pay_origin`, `pay_origin_remark`,
    `pay_time`, `pay_status`, `actual_receivable`, `amount_receivable`,
    `car_plate_number`, `parking_duration`
) VALUES 
('微信支付', '微信扫码支付', 'APP', '手机APP支付', '2025-01-27 12:30:00', '已支付', '20.00', '20.00', '京A12345', '4小时0分钟0秒'),
('现金支付', '现金支付', '现场', '现场现金支付', '2025-01-27 11:45:00', '已支付', '15.00', '15.00', '京B67890', '2小时30分钟0秒');

-- =============================================
-- 创建视图（可选）
-- =============================================

-- 创建车辆进出记录视图
CREATE VIEW `v_car_in_out_records` AS
SELECT 
    o.id,
    o.car_license_number,
    o.enter_channel_name,
    o.leave_channel_name,
    o.enter_time,
    o.leave_time,
    o.stopping_time,
    o.enter_type,
    o.leave_type,
    o.record_type,
    o.create_time,
    o.update_time
FROM `report_car_out` o
WHERE o.deleted = 0;

-- 创建缴费统计视图
CREATE VIEW `v_payment_statistics` AS
SELECT 
    DATE(pay_time) as pay_date,
    COUNT(*) as total_count,
    SUM(CAST(actual_receivable AS DECIMAL(10,2))) as total_amount,
    payment_mode,
    pay_status
FROM `payment_record`
WHERE deleted = 0
GROUP BY DATE(pay_time), payment_mode, pay_status;

-- =============================================
-- 脚本执行完成
-- =============================================

-- 显示创建的表
SHOW TABLES;

-- 显示数据库信息
SELECT 
    TABLE_NAME as '表名',
    TABLE_COMMENT as '表注释',
    TABLE_ROWS as '记录数',
    CREATE_TIME as '创建时间'
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'parking_management'
ORDER BY TABLE_NAME;
