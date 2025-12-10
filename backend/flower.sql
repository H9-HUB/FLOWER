-- =====================================================
--  花店商城数据库 ・完整整理版
--  说明：每表先 DROP 再 CREATE，保证可重复执行
-- =====================================================
CREATE DATABASE IF NOT EXISTS flower
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;
USE flower;

-- -------------- 一键关闭/开启外键检查 --------------
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS cart;
DROP TABLE IF EXISTS order_item;
DROP TABLE IF EXISTS `order`;
DROP TABLE IF EXISTS login_log;
DROP TABLE IF EXISTS address;
DROP TABLE IF EXISTS flower;
DROP TABLE IF EXISTS category;
DROP TABLE IF EXISTS user;

SET FOREIGN_KEY_CHECKS = 1;
-- -------------- 下面再按顺序 CREATE 即可 --------------

-- 1. 用户表 -------------------------------------------------
CREATE TABLE user (
                      id           BIGINT AUTO_INCREMENT PRIMARY KEY,
                      phone        VARCHAR(11) NOT NULL UNIQUE,
                      username     VARCHAR(32) NOT NULL UNIQUE,
                      password     VARCHAR(100) NOT NULL,
                      role         ENUM('USER','ADMIN') DEFAULT 'USER',
                      create_time  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. 分类表 -------------------------------------------------
CREATE TABLE category (
                          id   INT AUTO_INCREMENT PRIMARY KEY,
                          name VARCHAR(20) NOT NULL
);

-- 3. 商品表 -------------------------------------------------
CREATE TABLE flower (
                        id            BIGINT AUTO_INCREMENT PRIMARY KEY,
                        category_id   INT NOT NULL,
                        name          VARCHAR(50) NOT NULL,
                        title         VARCHAR(100) NOT NULL,
                        price         DECIMAL(10,2) NOT NULL,
                        stock         INT NOT NULL,
                        main_img      VARCHAR(200),
                        description   TEXT,
                        status        ENUM('ON_SALE','OFF_SALE') DEFAULT 'ON_SALE',
                        create_time   DATETIME DEFAULT CURRENT_TIMESTAMP,
                        INDEX idx_status (status),
                        FOREIGN KEY (category_id) REFERENCES category(id)
);

-- 4. 购物车表 ----------------------------------------------
CREATE TABLE cart (
                      id           BIGINT AUTO_INCREMENT PRIMARY KEY,
                      user_id      BIGINT NOT NULL,
                      flower_id    BIGINT NOT NULL,
                      quantity     INT NOT NULL DEFAULT 1,
                      create_time  DATETIME DEFAULT CURRENT_TIMESTAMP,
                      UNIQUE KEY uk_user_flower (user_id, flower_id),
                      FOREIGN KEY (user_id)  REFERENCES user(id),
                      FOREIGN KEY (flower_id) REFERENCES flower(id)
);

-- 5. 订单表 ------------------------------------------------
CREATE TABLE `order` (
                         id            BIGINT AUTO_INCREMENT PRIMARY KEY,
                         sn            VARCHAR(32) NOT NULL UNIQUE,
                         user_id       BIGINT NOT NULL,
                         address_id    BIGINT NULL,
                         total_amount  DECIMAL(10,2) NOT NULL,
                         status        ENUM('UNPAID','PAID','CANCELLED','COMPLETED') DEFAULT 'UNPAID',
                         create_time   DATETIME DEFAULT CURRENT_TIMESTAMP,
                         pay_time      DATETIME NULL,
                         cancel_reason VARCHAR(255) NULL,
                         INDEX idx_user (user_id),
                         FOREIGN KEY (user_id) REFERENCES user(id)
);

-- 6. 订单明细表 --------------------------------------------
CREATE TABLE order_item (
                            id          BIGINT AUTO_INCREMENT PRIMARY KEY,
                            order_id    BIGINT NOT NULL,
                            flower_id   BIGINT NOT NULL,
                            quantity    INT NOT NULL,
                            unit_price  DECIMAL(10,2) NOT NULL,
                            FOREIGN KEY (order_id)  REFERENCES `order`(id),
                            FOREIGN KEY (flower_id) REFERENCES flower(id)
);

-- 7. 登录日志表 --------------------------------------------
CREATE TABLE login_log (
                           id          BIGINT AUTO_INCREMENT PRIMARY KEY,
                           user_id     BIGINT NOT NULL,
                           ip          VARCHAR(45),
                           ua          VARCHAR(200),
                           login_time  DATETIME DEFAULT CURRENT_TIMESTAMP,
                           FOREIGN KEY (user_id) REFERENCES user(id)
);

-- 8. 收货地址表 --------------------------------------------
CREATE TABLE address (
                         id          BIGINT AUTO_INCREMENT PRIMARY KEY,
                         user_id     BIGINT NOT NULL,
                         name        VARCHAR(20)  NOT NULL,
                         phone       VARCHAR(20)  NOT NULL,
                         province    VARCHAR(50)  NOT NULL,
                         city        VARCHAR(50)  NOT NULL,
                         district    VARCHAR(50)  NOT NULL,
                         detail      VARCHAR(200) NOT NULL,
                         is_default  TINYINT(1) DEFAULT 0,
                         create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
                         INDEX idx_user (user_id),
                         FOREIGN KEY (user_id) REFERENCES user(id)
);

-- =====================================================
--  初始化数据
-- =====================================================

-- 分类
INSERT INTO category(id,name) VALUES
                                  (1,'盆栽'),
                                  (2,'鲜切花'),
                                  (3,'多肉植物'),
                                  (4,'开业花篮'),
                                  (5,'永生花'),
                                  (6,'绿植租赁'),
                                  (7,'花卉种子')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 商品
INSERT INTO flower(id,category_id,name,title,price,stock,main_img,description,status) VALUES
                                                                                          (1 ,1,'多肉盆栽','治愈系多肉',12.50,100,'/upload/duorou.jpg','非常容易养的多肉植物','ON_SALE'),
                                                                                          (2 ,1,'仙人掌','桌面小仙人掌',9.90,150,'/upload/cactus.jpg','耐旱防辐射','ON_SALE'),
                                                                                          (3 ,2,'香槟玫瑰','香槟色玫瑰 9 支',39.00,80,'/upload/champagne.jpg','厄瓜多尔玫瑰','ON_SALE'),
                                                                                          (4 ,2,'向日葵','阳光向日葵 5 支',28.00,60,'/upload/sunflower.jpg','大花头','ON_SALE'),
                                                                                          (5 ,1,'绿萝','室内净化绿萝',15.00,200,'/upload/lvluo.jpg','吊篮款','ON_SALE'),
                                                                                          (6 ,2,'百合','香水百合 3 头',32.00,70,'/upload/lily.jpg','香味浓郁','ON_SALE'),
                                                                                          (7 ,1,'虎皮兰','虎尾兰 吸甲醛',45.00,40,'/upload/hupilan.jpg','高大挺拔','ON_SALE'),
                                                                                          (8 ,2,'康乃馨','粉色康乃馨 10 支',24.00,90,'/upload/carnation.jpg','母亲节首选','ON_SALE'),
                                                                                          (9 ,1,'绿萝盆栽','桌面净化绿萝 带吊篮',18.50,200,'/upload/luoluo.jpg','耐阴、易养、净化空气','ON_SALE'),
                                                                                          (10,1,'仙人掌组合','3 盆组合装 多肉仙人掌',25.00,150,'/upload/cactus_combo.jpg','防辐射、耐旱','ON_SALE'),
                                                                                          (11,1,'多肉拼盘','6 株随机混色多肉',32.00,120,'/upload/duorou_plate.jpg','治愈系、易养活','ON_SALE'),
                                                                                          (12,1,'袖珍椰子','桌面小椰苗 净化空气',28.00,90,'/upload/yezi.jpg','热带风情、耐阴','ON_SALE'),
                                                                                          (13,1,'发财树','小辫发财树 招财寓意',38.00,70,'/upload/facai.jpg','象征招财、耐阴','ON_SALE'),
                                                                                          (14,1,'文竹','迷你文竹 书香气息',22.00,110,'/upload/wenzhu.jpg','文雅、易养','ON_SALE'),
                                                                                          (15,1,'豆瓣绿','圆叶豆瓣绿 小型盆栽',16.50,160,'/upload/douban.jpg','圆叶可爱、耐阴','ON_SALE'),
                                                                                          (16,1,'白掌','一帆风顺 开花盆栽',29.90,85,'/upload/baizhang.jpg','白花雅致、耐阴','ON_SALE'),
                                                                                          (17,2,'红玫瑰','红玫瑰 9 支装',42.00,100,'/upload/redrose.jpg','爱情玫瑰、大花头','ON_SALE'),
                                                                                          (18,2,'白玫瑰','白玫瑰 9 支装',42.00,90,'/upload/whiterose.jpg','纯洁玫瑰、大花头','ON_SALE'),
                                                                                          (19,2,'蓝玫瑰','蓝色妖姬 9 支装',68.00,60,'/upload/bluerose.jpg','染色蓝玫瑰、神秘','ON_SALE'),
                                                                                          (20,2,'洋桔梗','洋桔梗 10 支',35.00,95,'/upload/jiegeng.jpg','雾感花瓣、高雅','ON_SALE'),
                                                                                          (21,2,'满天星','白色满天星 一大束',26.00,110,'/upload/star.jpg','雾状小花、配草','ON_SALE'),
                                                                                          (22,3,'玉露','冰灯玉露 多肉',28.00,85,'/upload/yulu.jpg','晶莹剔透','ON_SALE'),
                                                                                          (23,3,'生石花','石头花 混色 3 粒',15.00,200,'/upload/lithops.jpg','形态奇特','ON_SALE'),
                                                                                          (24,3,'熊童子','熊掌多肉 萌系',19.90,120,'/upload/bear.jpg','毛茸茸红爪','ON_SALE'),
                                                                                          (25,4,'单层开业花篮','红掌+百合 单层',168.00,30,'/upload/kaiye1.jpg','开业大吉','ON_SALE'),
                                                                                          (26,4,'双层开业花篮','红掌+玫瑰 双层',288.00,20,'/upload/kaiye2.jpg','大气双层','ON_SALE'),
                                                                                          (27,5,'永生玫瑰玻璃罩','厄瓜多尔永生红玫瑰',198.00,50,'/upload/forever_rose.jpg','保色 3-5 年','ON_SALE'),
                                                                                          (28,5,'永生花小熊礼盒','小熊+永生花组合',128.00,80,'/upload/forever_bear.jpg','可爱送礼','ON_SALE'),
                                                                                          (29,6,'发财树租赁','1.5 m 发财树 月租',68.00,999,'/upload/rent_facai.jpg','包养护、月付','ON_SALE'),
                                                                                          (30,6,'绿萝柱租赁','1.2 m 绿萝柱 月租',38.00,999,'/upload/rent_lvluo.jpg','包换叶、月付','ON_SALE'),
                                                                                          (31,7,'矮牵牛种子','阳台爆花 100 粒',9.90,300,'/upload/seed_qianniu.jpg','花期长','ON_SALE'),
                                                                                          (32,7,'向日葵种子','玩具熊向日葵 20 粒',12.00,250,'/upload/seed_sun.jpg','矮生盆栽','ON_SALE')
ON DUPLICATE KEY UPDATE
                     category_id=VALUES(category_id),
                     name=VALUES(name),
                     title=VALUES(title),
                     price=VALUES(price),
                     stock=VALUES(stock),
                     main_img=VALUES(main_img),
                     description=VALUES(description),
                     status=VALUES(status);