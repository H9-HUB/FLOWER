package com.ldong.backend.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.ldong.backend.common.R;
import com.ldong.backend.entity.Flower;
import com.ldong.backend.service.FlowerService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class FlowerController {

    private final FlowerService flowerService;

    /**
     * 分页列表 + 可选分类筛选
     */
    @GetMapping("/flowers")
    public R<Page<Flower>> list(@RequestParam(defaultValue = "1") Integer page,
                                @RequestParam(defaultValue = "10") Integer size,
                                @RequestParam(required = false) Integer categoryId) {
        Page<Flower> p = flowerService.lambdaQuery()
                .eq(categoryId != null, Flower::getCategoryId, categoryId)
                .eq(Flower::getStatus, "ON_SALE")
                .orderByDesc(Flower::getId)
                .page(new Page<>(page, size));
        return R.ok(p);
    }

    /**
     * 商品详情
     */
    @GetMapping("/flower/{id}")
    public R<Flower> detail(@PathVariable Long id) {
        Flower flower = flowerService.getById(id);
        if (flower == null || !"ON_SALE".equals(flower.getStatus())) {
            // 先返回错误信息，同时把 data 设 null，但泛型仍是 Flower
            return R.error("商品不存在或已下架");
        }
        return R.ok(flower);
    }
}