package com.ldong.backend.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.ldong.backend.entity.OrderItem;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface OrderItemMapper extends BaseMapper<OrderItem> {
    // 如需自定义 SQL 方法，在此添加
}