package com.ldong.backend.controller;

import com.ldong.backend.common.R;
import com.ldong.backend.dto.AddCartDTO;
import com.ldong.backend.dto.CartVO;
import com.ldong.backend.entity.Cart;
import com.ldong.backend.entity.Flower;
import com.ldong.backend.service.CartService;
import com.ldong.backend.service.FlowerService;
import com.ldong.backend.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;
    private final FlowerService flowerService;

    /** 加入购物车（需登录） */
    @PostMapping("/cart")
    public R<Void> add(@RequestBody AddCartDTO dto) {
        Long userId = SecurityUtil.currentUserId();
        if(userId == null) return R.error("未登录");
        Flower flower = flowerService.getById(dto.getFlowerId());
        if (flower == null || !"ON_SALE".equals(flower.getStatus()))
            return R.error("商品不存在或已下架");
        if (flower.getStock() < dto.getQuantity())
            return R.error("库存不足");

        // 同一用户合并数量
        Cart old = cartService.lambdaQuery()
                .eq(Cart::getUserId, userId)
                .eq(Cart::getFlowerId, dto.getFlowerId())
                .one();
        if (old != null) {
            old.setQuantity(old.getQuantity() + dto.getQuantity());
            cartService.updateById(old);
        } else {
            Cart c = new Cart();
            c.setUserId(userId);
            c.setFlowerId(dto.getFlowerId());
            c.setQuantity(dto.getQuantity());
            cartService.save(c);
        }
        return R.ok();
    }

    /** 我的购物车 */
    @GetMapping("/cart")
    public R<List<CartVO>> list() {
        Long userId = SecurityUtil.currentUserId();
        if(userId == null) return R.error("未登录");
        List<CartVO> voList = cartService.lambdaQuery()
                .eq(Cart::getUserId, userId)
                .list()                       // List<Cart>
                .stream()
                .map(this::toVO)              // Cart → CartVO
                .collect(Collectors.toList());// 收回来
        return R.ok(voList);
    }

    /** 删除项 */
    @DeleteMapping("/cart/{id}")
    public R<Void> del(@PathVariable Long id) {
        Long userId = SecurityUtil.currentUserId();
        if(userId == null) return R.error("未登录");
        // 写法①：先查是否存在，再按主键删除（安全）
        boolean exist = cartService.lambdaQuery()
                .eq(Cart::getId, id)
                .eq(Cart::getUserId, userId)
                .count() > 0;
        if (exist) {
            cartService.removeById(id);
            return R.ok();
        }
        return R.error("删除失败");
    }

    /** 修改购物车数量：传入 delta 为 +1/-1 */
    @PutMapping("/cart/{id}")
    public R<Void> change(@PathVariable Long id, @RequestBody ChangeReq req) {
        Long userId = SecurityUtil.currentUserId();
        if (userId == null) return R.error("未登录");

        Cart cart = cartService.lambdaQuery()
                .eq(Cart::getId, id)
                .eq(Cart::getUserId, userId)
                .one();
        if (cart == null) return R.error("购物车项不存在");

        Flower flower = flowerService.getById(cart.getFlowerId());
        if (flower == null || !"ON_SALE".equals(flower.getStatus()))
            return R.error("商品不存在或已下架");

        int newQty = cart.getQuantity() + req.getDelta();
        // 若减少到小于1，则直接移除购物车项
        if (newQty < 1) {
            cartService.removeById(id);
            return R.ok();
        }
        if (newQty > flower.getStock()) return R.error("库存不足");

        cart.setQuantity(newQty);
        cartService.updateById(cart);
        return R.ok();
    }

    /** 简单请求体：只需要增量 */
    public static class ChangeReq {
        private int delta;
        public int getDelta() { return delta; }
        public void setDelta(int delta) { this.delta = delta; }
    }

    private CartVO toVO(Cart c) {
        CartVO v = new CartVO();
        v.setId(c.getId());
        v.setQuantity(c.getQuantity());
        Flower f = flowerService.getById(c.getFlowerId());
        v.setFlowerName(f.getName());
        v.setPrice(f.getPrice());
        v.setMainImg(f.getMainImg());
        return v;
    }
}