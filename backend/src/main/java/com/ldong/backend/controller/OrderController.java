package com.ldong.backend.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.ldong.backend.common.R;
import com.ldong.backend.dto.*;
import com.ldong.backend.entity.Flower;
import com.ldong.backend.entity.Order;
import com.ldong.backend.entity.OrderItem;
import com.ldong.backend.service.CartService;
import com.ldong.backend.service.FlowerService;
import com.ldong.backend.service.OrderItemService;
import com.ldong.backend.service.OrderService;
import com.ldong.backend.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import com.ldong.backend.entity.Cart;


@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;
    private final OrderItemService orderItemService;
    private final CartService cartService;
    private final FlowerService flowerService;

    @PostMapping("/orders")
    public R<Map<String, Object>> create(@RequestBody CreateOrderDTO dto) {
        Long userId = SecurityUtil.currentUserId();
        if(userId == null) return R.error("未登录");
        List<Cart> carts = cartService.lambdaQuery().eq(Cart::getUserId, userId).list();
        if (carts.isEmpty()) return R.error("购物车为空");

        String sn = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss")) + userId;
        BigDecimal total = BigDecimal.ZERO;

        Order order = new Order();
        order.setSn(sn);
        order.setUserId(userId);
        order.setStatus("UNPAID");
        order.setTotalAmount(BigDecimal.ZERO);
        order.setCreateTime(LocalDateTime.now());
        orderService.save(order);

        for (Cart c : carts) {
            Flower f = flowerService.getById(c.getFlowerId());
            if (f.getStock() < c.getQuantity()) throw new RuntimeException("库存不足：" + f.getName());
            flowerService.lambdaUpdate()
                    .setSql(" stock = stock - " + c.getQuantity() + " ")
                    .eq(Flower::getId, c.getFlowerId())
                    .update();

            OrderItem item = new OrderItem();
            item.setOrderId(order.getId());
            item.setFlowerId(c.getFlowerId());
            item.setQuantity(c.getQuantity());
            // 将 Double 转为 BigDecimal
            item.setUnitPrice(BigDecimal.valueOf(f.getPrice()));
            orderItemService.save(item);
            // 金额计算使用 BigDecimal
            total = total.add(BigDecimal.valueOf(f.getPrice()).multiply(BigDecimal.valueOf(c.getQuantity())));
        }
        order.setTotalAmount(total);
        orderService.updateById(order);
        // 使用 LambdaQueryWrapper 删除
        cartService.remove(new LambdaQueryWrapper<Cart>().eq(Cart::getUserId, userId));

        Map<String, Object> map = new HashMap<>();
        map.put("orderId", order.getId());
        map.put("sn", order.getSn());
        map.put("totalAmount", total);
        return R.ok(map);
    }

    @GetMapping("/orders")
    public R<List<OrderVO>> myOrders() {
        Long userId = SecurityUtil.currentUserId();
        if(userId == null) return R.error("未登录");
        List<Order> orders = orderService.lambdaQuery().eq(Order::getUserId, userId).orderByDesc(Order::getId).list();
        List<OrderVO> vo = orders.stream().map(this::toVO).collect(Collectors.toList());
        return R.ok(vo);
    }

    @PostMapping("/orders/{id}/pay")
    public R<Void> pay(@PathVariable Long id) {
        Long userId = SecurityUtil.currentUserId();
        if(userId == null) return R.error("未登录");
        Order order = orderService.getById(id);
        if (order == null || !"UNPAID".equals(order.getStatus())) return R.error("订单状态异常");
        order.setStatus("PAID");
        order.setPayTime(LocalDateTime.now());
        orderService.updateById(order);
        return R.ok(null);
    }

    @PutMapping("/orders/{id}/cancel")
    public R<Void> cancel(@PathVariable Long id) {
        Long userId = SecurityUtil.currentUserId();
        if(userId == null) return R.error("未登录");
        Order order = orderService.getById(id);
        if (order == null || !"UNPAID".equals(order.getStatus())) return R.error("只能取消未支付订单");
        order.setStatus("CANCELLED");
        orderService.updateById(order);
        // 库存回滚
        List<OrderItem> items = orderItemService.lambdaQuery().eq(OrderItem::getOrderId, id).list();
        for (OrderItem i : items) {
            flowerService.lambdaUpdate().setSql("stock = stock + " + i.getQuantity()).eq(Flower::getId, i.getFlowerId()).update();
        }
        return R.ok(null);
    }

    private OrderVO toVO(Order o) {
        OrderVO v = new OrderVO();
        v.setOrderId(o.getId());
        v.setSn(o.getSn());
        v.setTotalAmount(o.getTotalAmount());
        v.setStatus(o.getStatus());
        List<OrderItemVO> items = orderItemService.lambdaQuery().eq(OrderItem::getOrderId, o.getId()).list()
                .stream().map(i -> {
                    OrderItemVO vo = new OrderItemVO();
                    vo.setQuantity(i.getQuantity());
                    vo.setUnitPrice(i.getUnitPrice());
                    Flower f = flowerService.getById(i.getFlowerId());
                    vo.setFlowerName(f.getName());
                    vo.setMainImg(f.getMainImg());
                    return vo;
                }).collect(Collectors.toList());
        v.setItems(items);
        return v;
    }
}