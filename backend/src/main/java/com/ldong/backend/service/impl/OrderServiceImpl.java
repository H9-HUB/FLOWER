package com.ldong.backend.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;

import com.ldong.backend.entity.Order;
import com.ldong.backend.mapper.OrderMapper;
import com.ldong.backend.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
public class OrderServiceImpl extends ServiceImpl<OrderMapper, Order> implements OrderService {
    // 无参即可，MP 会自动注入 mapper
}