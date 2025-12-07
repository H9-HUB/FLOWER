package com.ldong.backend.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.ldong.backend.entity.User;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface UserMapper extends BaseMapper<User> {
}