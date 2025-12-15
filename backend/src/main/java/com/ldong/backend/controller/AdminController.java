package com.ldong.backend.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.ldong.backend.common.R;
import com.ldong.backend.entity.*;
import com.ldong.backend.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminController {

    private final FlowerService flowerService;
    private final OrderService orderService;
    private final OrderItemService orderItemService;
    private final UserService userService;
    private final CategoryService categoryService;
    private final CartService cartService;
    private final AddressService addressService;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    /** 图片上传：保存到 resources/static/upload 下，并返回访问路径 /upload/xxx */
    @PostMapping("/upload")
    public R<Map<String, String>> upload(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return R.error("文件不能为空");
        }
        try {
            String original = Objects.requireNonNull(file.getOriginalFilename());
            String ext = "";
            int dot = original.lastIndexOf(".");
            if (dot >= 0) {
                ext = original.substring(dot);
            }
            String filename = System.currentTimeMillis() + "-" + UUID.randomUUID().toString().replace("-", "") + ext;

            // 保存到项目的 backend/src/main/resources/static/upload 文件夹（你要求保存在此处）
            Path uploadDir = Paths.get(System.getProperty("user.dir"), "backend", "src", "main", "resources", "static", "upload");
            if (!Files.exists(uploadDir)) {
                Files.createDirectories(uploadDir);
            }
            Path target = uploadDir.resolve(filename);
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
            Map<String, String> data = new HashMap<>();
            data.put("url", "/upload/" + filename);
            return R.ok(data);
        } catch (Exception e) {
            return R.error("上传失败: " + e.getMessage());
        }
    }

    /** 仪表盘统计: /admin/stat/overview?dateType=day|week|month */
    @GetMapping("/stat/overview")
    public R<Map<String, Object>> overview(@RequestParam(defaultValue = "day") String dateType) {
        Map<String, Object> data = new HashMap<>();
        
        // 计算时间范围
        LocalDateTime since = LocalDateTime.now().minusDays(1);
        switch (dateType) {
            case "week": since = LocalDateTime.now().minusDays(7); break;
            case "month": since = LocalDateTime.now().minusDays(30); break;
            default: since = LocalDateTime.now().minusDays(1); break;
        }

        // 今日订单数（或指定时间范围内的订单数）
        long todayOrders = orderService.lambdaQuery().ge(Order::getCreateTime, since).count();
        data.put("todayOrders", todayOrders);

        // 订单总数（所有订单）
        long totalOrders = orderService.count();
        data.put("totalOrders", totalOrders);

        // 总收入（所有已支付订单的总金额）
        List<Order> paidOrders = orderService.lambdaQuery()
                .in(Order::getStatus, Arrays.asList("PAID", "COMPLETED"))
                .list();
        double totalRevenue = paidOrders.stream()
                .map(o -> o.getTotalAmount() == null ? 0.0 : o.getTotalAmount().doubleValue())
                .mapToDouble(Double::doubleValue)
                .sum();
        data.put("totalRevenue", totalRevenue);

        // 客户总数（所有用户）
        long totalCustomers = userService.count();
        data.put("totalCustomers", totalCustomers);

        // 订单状态分布
        // UNPAID -> pending (未支付)
        long pendingCount = orderService.lambdaQuery().eq(Order::getStatus, "UNPAID").count();
        // COMPLETED + PAID -> completed (已完成/已支付)
        long completedCount = orderService.lambdaQuery()
                .in(Order::getStatus, Arrays.asList("COMPLETED", "PAID"))
                .count();
        // CANCELLED -> cancelled (已取消)
        long cancelledCount = orderService.lambdaQuery().eq(Order::getStatus, "CANCELLED").count();
        
        // 使用 Map<String, Object> 确保 JSON 序列化正确
        Map<String, Object> orderStatusDistribution = new HashMap<>();
        orderStatusDistribution.put("pending", pendingCount);
        orderStatusDistribution.put("completed", completedCount);
        orderStatusDistribution.put("cancelled", cancelledCount);
        data.put("orderStatusDistribution", orderStatusDistribution);

        // 近 7 天/30 天的每日/每周销售额（简要）
        List<Map<String, Object>> sales = new ArrayList<>();
        int days = "month".equals(dateType) ? 30 : ("week".equals(dateType) ? 7 : 1);
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        for (int i = days - 1; i >= 0; i--) {
            LocalDate d = LocalDate.now().minusDays(i);
            LocalDateTime start = d.atStartOfDay();
            LocalDateTime end = d.plusDays(1).atStartOfDay();
            List<Order> list = orderService.lambdaQuery()
                    .ge(Order::getCreateTime, start)
                    .lt(Order::getCreateTime, end)
                    .in(Order::getStatus, Arrays.asList("PAID", "COMPLETED"))
                    .list();
            double total = list.stream().map(o -> o.getTotalAmount() == null ? 0.0 : o.getTotalAmount().doubleValue()).mapToDouble(Double::doubleValue).sum();
            Map<String, Object> point = new HashMap<>();
            point.put("date", d.format(fmt));
            point.put("sales", total);
            sales.add(point);
        }
        data.put("sales", sales);
        
        return R.ok(data);
    }

    /** 商品列表 - 支持分页和搜索 */
    @GetMapping("/product")
    public R<Map<String, Object>> products(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer pageSize,
            @RequestParam(required = false) String keyword) {
        
        com.baomidou.mybatisplus.core.metadata.IPage<Flower> iPage = new com.baomidou.mybatisplus.extension.plugins.pagination.Page<>(page, pageSize);
        
        LambdaQueryWrapper<Flower> query = new LambdaQueryWrapper<>();
        if (keyword != null && !keyword.trim().isEmpty()) {
            String kw = keyword.trim();
            query.and(w -> w
                .like(Flower::getName, kw)
                .or()
                .like(Flower::getTitle, kw)
                .or()
                .like(Flower::getDescription, kw)
            );
        }
        query.orderByDesc(Flower::getId);
        
        iPage = flowerService.page(iPage, query);
        
        // 转换为前端需要的格式
        List<Map<String, Object>> productList = iPage.getRecords().stream().map(flower -> {
            Map<String, Object> product = new HashMap<>();
            product.put("id", flower.getId());
            product.put("name", flower.getName());
            product.put("categoryId", flower.getCategoryId());
            // 获取分类名称
            Category category = categoryService.getById(flower.getCategoryId());
            product.put("category", category != null ? category.getName() : "");
            product.put("price", flower.getPrice());
            product.put("stock", flower.getStock());
            // 状态转换：ON_SALE -> on, OFF_SALE -> off
            product.put("status", "ON_SALE".equals(flower.getStatus()) ? "on" : "off");
            product.put("image", flower.getMainImg());
            product.put("description", flower.getDescription());
            return product;
        }).collect(java.util.stream.Collectors.toList());
        
        Map<String, Object> result = new HashMap<>();
        result.put("list", productList);
        result.put("total", iPage.getTotal());
        result.put("page", iPage.getCurrent());
        result.put("pageSize", iPage.getSize());
        
        return R.ok(result);
    }

    /** 新增商品 */
    @PostMapping("/product")
    public R<Long> addProduct(@RequestBody Map<String, Object> body) {
        Flower flower = new Flower();
        String name = (String) body.get("name");
        if (name == null || name.trim().isEmpty()) {
            return R.error("商品名称不能为空");
        }
        flower.setName(name.trim());
        flower.setTitle(name.trim()); // title 使用 name 的值
        
        if (body.get("categoryId") == null) {
            return R.error("分类ID不能为空");
        }
        flower.setCategoryId(Long.valueOf(body.get("categoryId").toString()));
        
        if (body.get("price") == null) {
            return R.error("价格不能为空");
        }
        flower.setPrice(Double.valueOf(body.get("price").toString()));
        
        if (body.get("stock") == null) {
            return R.error("库存不能为空");
        }
        flower.setStock(Integer.valueOf(body.get("stock").toString()));
        
        // 图片必填
        String image = (String) body.get("image");
        if (image == null || image.trim().isEmpty()) {
            return R.error("商品图片不能为空");
        }

        // 状态转换：on -> ON_SALE, off -> OFF_SALE，默认为 ON_SALE
        String status = (String) body.getOrDefault("status", "on");
        flower.setStatus("on".equals(status) ? "ON_SALE" : "OFF_SALE");
        
        flower.setDescription((String) body.getOrDefault("description", ""));
        flower.setMainImg(image.trim());
        
        flowerService.save(flower);
        return R.ok(flower.getId());
    }

    /** 更新商品 */
    @PutMapping("/product/{id}")
    public R<Void> updateProduct(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Flower flower = flowerService.getById(id);
        if (flower == null) return R.error("商品不存在");
        
        if (body.containsKey("name")) {
            flower.setName((String) body.get("name"));
            flower.setTitle((String) body.get("name"));
        }
        if (body.containsKey("categoryId")) {
            flower.setCategoryId(Long.valueOf(body.get("categoryId").toString()));
        }
        if (body.containsKey("price")) {
            flower.setPrice(Double.valueOf(body.get("price").toString()));
        }
        if (body.containsKey("stock")) {
            flower.setStock(Integer.valueOf(body.get("stock").toString()));
        }
        if (body.containsKey("status")) {
            String status = (String) body.get("status");
            flower.setStatus("on".equals(status) ? "ON_SALE" : "OFF_SALE");
        }
        if (body.containsKey("description")) {
            flower.setDescription((String) body.get("description"));
        }
        if (body.containsKey("image")) {
            String image = (String) body.get("image");
            if (image != null && !image.trim().isEmpty()) {
                flower.setMainImg(image.trim());
            }
        }
        
        flowerService.updateById(flower);
        return R.ok(null);
    }

    /** 删除商品 */
    @DeleteMapping("/product/{id}")
    public R<Void> deleteProduct(@PathVariable Long id) {
        Flower flower = flowerService.getById(id);
        if (flower == null) return R.error("商品不存在");
        
        // 检查是否有订单项引用该商品（历史订单数据应保留，不能删除）
        long orderItemCount = orderItemService.lambdaQuery()
                .eq(com.ldong.backend.entity.OrderItem::getFlowerId, id)
                .count();
        if (orderItemCount > 0) {
            return R.error("该商品已被订单使用，无法删除。建议将商品状态改为下架。");
        }
        
        // 删除购物车中引用该商品的记录
        cartService.remove(new LambdaQueryWrapper<Cart>()
                .eq(Cart::getFlowerId, id));
        
        // 删除商品
        flowerService.removeById(id);
        return R.ok(null);
    }

    /** 商品上下架 */
    @PutMapping("/product/{id}/status")
    public R<Void> setProductStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String status = body.get("status");
        if (status == null || (!"on".equals(status) && !"off".equals(status))) {
            return R.error("status 必须为 on 或 off");
        }
        Flower f = flowerService.getById(id);
        if (f == null) return R.error("商品不存在");
        // 状态转换：on -> ON_SALE, off -> OFF_SALE
        f.setStatus("on".equals(status) ? "ON_SALE" : "OFF_SALE");
        flowerService.updateById(f);
        return R.ok(null);
    }

    /** 订单列表 - 支持分页和状态筛选 */
    @GetMapping("/order")
    public R<Map<String, Object>> orders(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer pageSize,
            @RequestParam(required = false) String status) {
        
        com.baomidou.mybatisplus.core.metadata.IPage<Order> iPage = new com.baomidou.mybatisplus.extension.plugins.pagination.Page<>(page, pageSize);
        
        LambdaQueryWrapper<Order> query = new LambdaQueryWrapper<>();
        // 状态筛选：前端传 pending/completed/cancelled，需要转换为后端状态
        if (status != null && !status.trim().isEmpty()) {
            String frontendStatus = status.trim();
            if ("pending".equals(frontendStatus)) {
                // pending 对应 UNPAID 和 PAID 状态
                query.in(Order::getStatus, Arrays.asList("UNPAID", "PAID"));
            } else {
                String backendStatus = convertStatusFromFrontend(frontendStatus);
                if (backendStatus != null) {
                    query.eq(Order::getStatus, backendStatus);
                }
            }
        }
        query.orderByDesc(Order::getId);
        
        iPage = orderService.page(iPage, query);
        
        // 转换为前端需要的格式
        List<Map<String, Object>> orderList = iPage.getRecords().stream().map(order -> {
            Map<String, Object> orderMap = new HashMap<>();
            orderMap.put("id", order.getId());
            orderMap.put("orderNo", order.getSn());
            orderMap.put("amount", order.getTotalAmount() != null ? order.getTotalAmount().doubleValue() : 0.0);
            // 状态转换：UNPAID/PAID -> pending, COMPLETED -> completed, CANCELLED -> cancelled
            orderMap.put("status", convertStatusToFrontend(order.getStatus()));
            // 获取收货人信息
            String receiver = "未知";
            if (order.getAddressId() != null) {
                Address address = addressService.getById(order.getAddressId());
                if (address != null) {
                    receiver = address.getName();
                }
            }
            orderMap.put("receiver", receiver);
            // 格式化创建时间
            if (order.getCreateTime() != null) {
                orderMap.put("createdAt", order.getCreateTime().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
            } else {
                orderMap.put("createdAt", "");
            }
            return orderMap;
        }).collect(java.util.stream.Collectors.toList());
        
        Map<String, Object> result = new HashMap<>();
        result.put("list", orderList);
        result.put("total", iPage.getTotal());
        result.put("page", iPage.getCurrent());
        result.put("pageSize", iPage.getSize());
        
        return R.ok(result);
    }
    
    /** 状态转换：前端 -> 后端 */
    private String convertStatusFromFrontend(String frontendStatus) {
        switch (frontendStatus) {
            case "pending": return "UNPAID"; // pending 对应未支付订单
            case "completed": return "COMPLETED";
            case "cancelled": return "CANCELLED";
            default: return null;
        }
    }
    
    /** 状态转换：后端 -> 前端 */
    private String convertStatusToFrontend(String backendStatus) {
        if (backendStatus == null) return "pending";
        switch (backendStatus) {
            case "UNPAID":
            case "PAID": return "pending"; // 未支付和已支付都显示为"已下单"
            case "COMPLETED": return "completed";
            case "CANCELLED": return "cancelled";
            default: return "pending";
        }
    }

    /** 订单发货 */
    @PutMapping("/order/{id}/deliver")
    public R<Void> deliver(@PathVariable Long id, @RequestBody(required = false) Map<String, String> body) {
        Order o = orderService.getById(id);
        if (o == null) return R.error("订单不存在");
        // 允许 UNPAID 和 PAID 状态的订单发货（已支付订单发货）
        if (!"PAID".equals(o.getStatus()) && !"UNPAID".equals(o.getStatus())) {
            return R.error("只有未支付或已支付订单可以发货");
        }
        o.setStatus("COMPLETED");
        o.setPayTime(o.getPayTime() == null ? LocalDateTime.now() : o.getPayTime());
        orderService.updateById(o);
        return R.ok(null);
    }
    
    /** 取消订单 */
    @PutMapping("/order/{id}/cancel")
    public R<Void> cancelOrder(@PathVariable Long id, @RequestBody(required = false) Map<String, String> body) {
        Order o = orderService.getById(id);
        if (o == null) return R.error("订单不存在");
        // 只有未支付和已支付状态的订单可以取消
        if (!"UNPAID".equals(o.getStatus()) && !"PAID".equals(o.getStatus())) {
            return R.error("该订单状态不允许取消");
        }
        o.setStatus("CANCELLED");
        String reason = body != null ? body.get("reason") : null;
        o.setCancelReason(reason != null ? reason : "管理员取消");
        orderService.updateById(o);
        return R.ok(null);
    }

    /** 用户列表 - 支持分页和角色筛选 */
    @GetMapping("/user")
    public R<Map<String, Object>> users(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer pageSize,
            @RequestParam(required = false) String username,
            @RequestParam(required = false) String role) {
        
        com.baomidou.mybatisplus.core.metadata.IPage<User> iPage = new com.baomidou.mybatisplus.extension.plugins.pagination.Page<>(page, pageSize);
        
        LambdaQueryWrapper<User> query = new LambdaQueryWrapper<>();
        if (username != null && !username.trim().isEmpty()) {
            query.like(User::getUsername, username.trim());
        }
        // 角色筛选：前端传 Admin/User，需要转换为后端枚举
        if (role != null && !role.trim().isEmpty()) {
            String roleStr = role.trim();
            if ("Admin".equals(roleStr)) {
                query.eq(User::getRole, com.ldong.backend.entity.UserRole.ADMIN);
            } else if ("User".equals(roleStr)) {
                query.eq(User::getRole, com.ldong.backend.entity.UserRole.USER);
            }
        }
        query.orderByDesc(User::getId);
        
        iPage = userService.page(iPage, query);
        
        // 转换为前端需要的格式
        List<Map<String, Object>> userList = iPage.getRecords().stream().map(user -> {
            Map<String, Object> userMap = new HashMap<>();
            userMap.put("id", user.getId());
            userMap.put("username", user.getUsername());
            // 后端没有 nickname 字段，使用 username 代替
            userMap.put("nickname", user.getUsername());
            // 角色转换：ADMIN -> Admin, USER -> User
            if (user.getRole() != null) {
                userMap.put("role", user.getRole() == com.ldong.backend.entity.UserRole.ADMIN ? "Admin" : "User");
            } else {
                userMap.put("role", "User");
            }
            return userMap;
        }).collect(java.util.stream.Collectors.toList());
        
        Map<String, Object> result = new HashMap<>();
        result.put("list", userList);
        result.put("total", iPage.getTotal());
        result.put("page", iPage.getCurrent());
        result.put("pageSize", iPage.getSize());
        
        return R.ok(result);
    }
    
    /** 重置用户密码 */
    @PutMapping("/user/{id}/pwd")
    public R<Void> resetPassword(@PathVariable Long id, @RequestBody Map<String, String> body) {
        User user = userService.getById(id);
        if (user == null) return R.error("用户不存在");
        
        String newPassword = body != null ? body.get("password") : "123456";
        if (newPassword == null || newPassword.trim().isEmpty()) {
            newPassword = "123456";
        }
        
        // 使用 PasswordEncoder 加密密码
        user.setPassword(passwordEncoder.encode(newPassword));
        userService.updateById(user);
        return R.ok(null);
    }

    /** 分类列表 */
    @GetMapping("/category")
    public R<List<Category>> categories() {
        List<Category> list = categoryService.list();
        return R.ok(list);
    }
    
    /** 新增分类 */
    @PostMapping("/category")
    public R<Integer> addCategory(@RequestBody Map<String, Object> body) {
        Category category = new Category();
        String name = (String) body.get("name");
        if (name == null || name.trim().isEmpty()) {
            return R.error("分类名称不能为空");
        }
        category.setName(name.trim());
        categoryService.save(category);
        return R.ok(category.getId());
    }
    
    /** 更新分类 */
    @PutMapping("/category/{id}")
    public R<Void> updateCategory(@PathVariable Integer id, @RequestBody Map<String, Object> body) {
        Category category = categoryService.getById(id);
        if (category == null) return R.error("分类不存在");
        
        if (body.containsKey("name")) {
            String name = (String) body.get("name");
            if (name == null || name.trim().isEmpty()) {
                return R.error("分类名称不能为空");
            }
            category.setName(name.trim());
        }
        
        categoryService.updateById(category);
        return R.ok(null);
    }
    
    /** 删除分类 */
    @DeleteMapping("/category/{id}")
    public R<Void> deleteCategory(@PathVariable Integer id) {
        Category category = categoryService.getById(id);
        if (category == null) return R.error("分类不存在");
        
        // 检查是否有商品使用该分类
        long flowerCount = flowerService.lambdaQuery()
                .eq(Flower::getCategoryId, id)
                .count();
        if (flowerCount > 0) {
            return R.error("该分类下还有商品，无法删除");
        }
        
        categoryService.removeById(id);
        return R.ok(null);
    }

    /** 诊断接口：返回当前用户的 ID 和角色 */
    @GetMapping("/me")
    public R<Map<String, Object>> me(HttpServletRequest req) {
        Object id = req.getAttribute("USER_ID");
        Object role = req.getAttribute("USER_ROLE");
        Map<String, Object> m = new HashMap<>();
        m.put("userId", id);
        m.put("role", role);
        return R.ok(m);
    }

    /** 调试：返回 Spring Security Authentication 和请求属性 */
    @GetMapping("/debug-auth")
    public R<Map<String, Object>> debugAuth(HttpServletRequest req) {
        Authentication a = SecurityContextHolder.getContext().getAuthentication();
        Map<String, Object> m = new HashMap<>();
        m.put("authentication", a == null ? null : Map.of(
                "principal", a.getPrincipal(),
                "authenticated", a.isAuthenticated(),
                "authorities", a.getAuthorities()
        ));
        m.put("requestUserId", req.getAttribute("USER_ID"));
        m.put("requestUserRole", req.getAttribute("USER_ROLE"));
        return R.ok(m);
    }
}
