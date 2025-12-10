package com.ldong.backend.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.ldong.backend.entity.Category;
import com.ldong.backend.mapper.CategoryMapper;
import com.ldong.backend.service.CategoryService;
import org.springframework.stereotype.Service;

@Service
public class CategoryServiceImpl extends ServiceImpl<CategoryMapper, Category> implements CategoryService {
}
