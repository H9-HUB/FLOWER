CREATE DATABASE flower CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE flower;

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
                                                                                           (8,2,'康乃馨','粉色康乃馨 10 支',24.00,90,'/upload/carnation.jpg','母亲节首选','ON_SALE');
