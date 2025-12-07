package com.ldong.backend.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.ldong.backend.entity.Flower;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface FlowerMapper extends BaseMapper<Flower> {}