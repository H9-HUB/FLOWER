package com.ldong.backend.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.ldong.backend.entity.Order;

public interface OrderService extends IService<Order> {
    // 不要重写 getBaseMapper()
}