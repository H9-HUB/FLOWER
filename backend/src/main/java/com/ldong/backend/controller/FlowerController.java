package com.ldong.backend.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
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
     * 1. 商品分页列表
     * 参数：page 第几页（默认1）
     *      size 每页条数（默认12）
     *      categoryId 分类筛选（可选）
     */
    @GetMapping("/flowers")
    public R<IPage<Flower>> list(@RequestParam(defaultValue = "1") Integer page,
                                 @RequestParam(defaultValue = "12") Integer size,
                                 @RequestParam(required = false) Integer categoryId) {
        IPage<Flower> iPage = flowerService.lambdaQuery()
                .eq(categoryId != null, Flower::getCategoryId, categoryId)
                .eq(Flower::getStatus, "ON_SALE")          // 只显示上架
                .orderByDesc(Flower::getId)                // 最新在前
                .page(new Page<>(page, size));
        return R.ok(iPage);
    }

    /**
     * 2. 商品详情
     */
    @GetMapping("/flower/{id}")
    public R<Flower> detail(@PathVariable Long id) {
        Flower flower = flowerService.getById(id);
        if (flower == null || !"ON_SALE".equals(flower.getStatus())) {
            return R.error("商品不存在或已下架");
        }
        return R.ok(flower);
    }
}