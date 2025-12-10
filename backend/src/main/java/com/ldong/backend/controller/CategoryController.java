package com.ldong.backend.controller;

import com.ldong.backend.common.R;
import com.ldong.backend.entity.Category;
import com.ldong.backend.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class CategoryController {
    private final CategoryService categoryService;

    @GetMapping("/categories")
    public R<List<Category>> listCategories() {
        List<Category> list = categoryService.list();
        return R.ok(list);
    }
}
