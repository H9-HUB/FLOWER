USE flower;


CREATE DATABASE flower CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE user (
                      id BIGINT AUTO_INCREMENT PRIMARY KEY,
                      phone VARCHAR(11) NOT NULL UNIQUE,
                      password VARCHAR(100) NOT NULL,
                      role ENUM('USER','ADMIN') DEFAULT 'USER',
                      create_time DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE category (
                          id INT AUTO_INCREMENT PRIMARY KEY,
                          name VARCHAR(20) NOT NULL
);

CREATE TABLE flower (
                        id BIGINT AUTO_INCREMENT PRIMARY KEY,
                        category_id INT NOT NULL,
                        name VARCHAR(50) NOT NULL,
                        title VARCHAR(100) NOT NULL,
                        price DECIMAL(10,2) NOT NULL,
                        stock INT NOT NULL,
                        main_img VARCHAR(200),
                        description TEXT,
                        status ENUM('ON_SALE','OFF_SALE') DEFAULT 'ON_SALE',
                        create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
                        INDEX idx_status (status),
                        FOREIGN KEY (category_id) REFERENCES category(id)
);

CREATE TABLE cart (
                      id BIGINT AUTO_INCREMENT PRIMARY KEY,
                      user_id BIGINT NOT NULL,
                      flower_id BIGINT NOT NULL,
                      quantity INT NOT NULL DEFAULT 1,
                      create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
                      UNIQUE KEY uk_user_flower (user_id,flower_id),
                      FOREIGN KEY (user_id) REFERENCES user(id),
                      FOREIGN KEY (flower_id) REFERENCES flower(id)
);

CREATE TABLE `order` (
                         id BIGINT AUTO_INCREMENT PRIMARY KEY,
                         sn VARCHAR(32) NOT NULL UNIQUE,
                         user_id BIGINT NOT NULL,
                         total_amount DECIMAL(10,2) NOT NULL,
                         status ENUM('UNPAID','PAID','CANCELLED','COMPLETED') DEFAULT 'UNPAID',
                         create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
                         pay_time DATETIME,
                         INDEX idx_user (user_id),
                         FOREIGN KEY (user_id) REFERENCES user(id)
);

CREATE TABLE order_item (
                            id BIGINT AUTO_INCREMENT PRIMARY KEY,
                            order_id BIGINT NOT NULL,
                            flower_id BIGINT NOT NULL,
                            quantity INT NOT NULL,
                            unit_price DECIMAL(10,2) NOT NULL,
                            FOREIGN KEY (order_id) REFERENCES `order`(id),
                            FOREIGN KEY (flower_id) REFERENCES flower(id)
);

CREATE TABLE login_log (
                           id BIGINT AUTO_INCREMENT PRIMARY KEY,
                           user_id BIGINT NOT NULL,
                           ip VARCHAR(45),
                           ua VARCHAR(200),
                           login_time DATETIME DEFAULT CURRENT_TIMESTAMP,
                           FOREIGN KEY (user_id) REFERENCES user(id)
);

-- 初始化两种分类
INSERT INTO category (id,name) VALUES (1,'盆栽'),(2,'鲜切花');



-- 商品
INSERT INTO flower (id,category_id,name,title,price,stock,main_img,description,status) VALUES
                                                                                           (1,1,'多肉盆栽','治愈系多肉',12.50,100,'/upload/duorou.jpg','非常容易养的多肉植物','ON_SALE'),
                                                                                           (2,1,'仙人掌','桌面小仙人掌',9.90,150,'/upload/cactus.jpg','耐旱防辐射','ON_SALE'),
                                                                                           (3,2,'香槟玫瑰','香槟色玫瑰 9 支',39.00,80,'/upload/champagne.jpg','厄瓜多尔玫瑰','ON_SALE'),
                                                                                           (4,2,'向日葵','阳光向日葵 5 支',28.00,60,'/upload/sunflower.jpg','大花头','ON_SALE'),
                                                                                           (5,1,'绿萝','室内净化绿萝',15.00,200,'/upload/lvluo.jpg','吊篮款','ON_SALE'),
                                                                                           (6,2,'百合','香水百合 3 头',32.00,70,'/upload/lily.jpg','香味浓郁','ON_SALE'),
                                                                                           (7,1,'虎皮兰','虎尾兰 吸甲醛',45.00,40,'/upload/hupilan.jpg','高大挺拔','ON_SALE'),
                                                                                           (8,2,'康乃馨','粉色康乃馨 10 支',24.00,90,'/upload/carnation.jpg','母亲节首选','ON_SALE'),
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
                                                                                           (21,2,'满天星','白色满天星 一大束',26.00,110,'/upload/star.jpg','雾状小花、配草','ON_SALE');

-- 收货地址表
CREATE TABLE address (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    name VARCHAR(20) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    province VARCHAR(50) NOT NULL,
    city VARCHAR(50) NOT NULL,
    district VARCHAR(50) NOT NULL,
    detail VARCHAR(200) NOT NULL,
    is_default TINYINT(1) DEFAULT 0,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    FOREIGN KEY (user_id) REFERENCES user(id)
);

-- 增加订单的地址字段（如果尚未添加）
ALTER TABLE `order` ADD COLUMN `address_id` BIGINT NULL AFTER `user_id`;

USE flower;
-- 增加订单取消原因字段
ALTER TABLE `order` ADD COLUMN `cancel_reason` VARCHAR(255) NULL AFTER `pay_time`;