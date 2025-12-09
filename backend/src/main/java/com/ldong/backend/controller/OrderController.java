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
    private final com.ldong.backend.service.AddressService addressService;

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
        // 校验并设置收货地址（可选）
        Long addrId = dto.getAddressId();
        if (addrId != null) {
            var addr = addressService.getById(addrId);
            if (addr == null || !addr.getUserId().equals(userId)) {
                return R.error("收货地址无效");
            }
            order.setAddressId(addrId);
        }
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
        map.put("addressId", order.getAddressId());
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
    
    @GetMapping("/orders/{id}")
    public R<OrderVO> getOrder(@PathVariable Long id) {
        Long userId = SecurityUtil.currentUserId();
        if (userId == null) return R.error("未登录");
        Order order = orderService.getById(id);
        if (order == null) return R.error("订单不存在");
        if (!order.getUserId().equals(userId)) return R.error("无权访问该订单");
        return R.ok(toVO(order));
    }

    @PostMapping("/orders/{id}/pay")
    public R<Void> pay(@PathVariable Long id) {
        Long userId = SecurityUtil.currentUserId();
        if(userId == null) return R.error("未登录");
        Order order = orderService.getById(id);
        if (order == null || !"UNPAID".equals(order.getStatus())) return R.error("订单状态异常");
        // 必填校验：支付前必须有收货地址
        if (order.getAddressId() == null) {
            return R.error("请先填写并选择收货地址");
        }
        order.setStatus("PAID");
        order.setPayTime(LocalDateTime.now());
        orderService.updateById(order);
        return R.ok(null);
    }

    @PutMapping("/orders/{id}/cancel")
    public R<Void> cancel(@PathVariable Long id, @RequestBody(required = false) Map<String, String> body) {
        Long userId = SecurityUtil.currentUserId();
        if(userId == null) return R.error("未登录");
        Order order = orderService.getById(id);
        if (order == null || !"UNPAID".equals(order.getStatus())) return R.error("只能取消未支付订单");
        order.setStatus("CANCELLED");
        if (body != null) {
            String reason = body.getOrDefault("reason", "").trim();
            if (!reason.isEmpty()) order.setCancelReason(reason);
        }
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
        v.setAddressId(o.getAddressId());
        v.setCancelReason(o.getCancelReason());
        v.setCreateTime(o.getCreateTime());
        v.setPayTime(o.getPayTime());
        // 填充地址详情（若有）
        if (o.getAddressId() != null) {
            var addr = addressService.getById(o.getAddressId());
            if (addr != null) {
                v.setAddressName(addr.getName());
                v.setAddressPhone(addr.getPhone());
                v.setAddressProvince(addr.getProvince());
                v.setAddressCity(addr.getCity());
                v.setAddressDistrict(addr.getDistrict());
                v.setAddressDetail(addr.getDetail());
            }
        }
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

    /** 更新订单地址（仅未支付时允许） */
    @PutMapping("/orders/{id}/address")
    public R<Void> updateAddress(@PathVariable Long id, @RequestBody Map<String, Long> body) {
        Long userId = SecurityUtil.currentUserId();
        if(userId == null) return R.error("未登录");
        Long addressId = body.get("addressId");
        if (addressId == null) return R.error("缺少地址");
        var order = orderService.getById(id);
        if (order == null || !order.getUserId().equals(userId)) return R.error("订单不存在");
        if (!"UNPAID".equals(order.getStatus())) return R.error("已支付订单不可修改地址");
        var addr = addressService.getById(addressId);
        if (addr == null || !addr.getUserId().equals(userId)) return R.error("收货地址无效");
        order.setAddressId(addressId);
        orderService.updateById(order);
        return R.ok(null);
    }
}