package com.ldong.backend.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.ldong.backend.entity.OrderItem;
import com.ldong.backend.mapper.OrderItemMapper;
import com.ldong.backend.service.OrderItemService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
public class OrderItemServiceImpl extends ServiceImpl<OrderItemMapper, OrderItem> implements OrderItemService {
    // 无参即可
}