package com.ldong.backend.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.ldong.backend.entity.Flower;
import com.ldong.backend.mapper.FlowerMapper;
import com.ldong.backend.service.FlowerService;
import org.springframework.stereotype.Service;

@Service
public class FlowerServiceImpl extends ServiceImpl<FlowerMapper, Flower> implements FlowerService {}
