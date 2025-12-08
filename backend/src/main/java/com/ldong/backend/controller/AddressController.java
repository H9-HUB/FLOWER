package com.ldong.backend.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.ldong.backend.common.R;
import com.ldong.backend.dto.AddressDTO;
import com.ldong.backend.entity.Address;
import com.ldong.backend.service.AddressService;
import com.ldong.backend.util.SecurityUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class AddressController {

    private final AddressService addressService;

    /** 我的地址列表 */
    @GetMapping("/addresses")
    public R<List<Address>> list() {
        Long userId = SecurityUtil.currentUserId();
        if(userId == null) return R.error("未登录");
        List<Address> list = addressService.list(new LambdaQueryWrapper<Address>()
                .eq(Address::getUserId, userId)
                .orderByDesc(Address::getId));
        return R.ok(list);
    }

    /** 新增地址 */
    @PostMapping("/addresses")
    public R<Long> add(@Valid @RequestBody AddressDTO dto) {
        Long userId = SecurityUtil.currentUserId();
        if(userId == null) return R.error("未登录");
        Address a = toEntity(dto);
        a.setUserId(userId);
        if (Boolean.TRUE.equals(dto.getIsDefault())) {
            // 取消该用户其他默认
            addressService.lambdaUpdate()
                    .eq(Address::getUserId, userId)
                    .set(Address::getIsDefault, 0)
                    .update();
            a.setIsDefault(1);
        } else if (a.getIsDefault() == null) {
            a.setIsDefault(0);
        }
        addressService.save(a);
        return R.ok(a.getId());
    }

    /** 修改地址 */
    @PutMapping("/addresses/{id}")
    public R<Void> update(@PathVariable Long id, @Valid @RequestBody AddressDTO dto) {
        Long userId = SecurityUtil.currentUserId();
        if(userId == null) return R.error("未登录");
        Address exist = addressService.getById(id);
        if (exist == null || !exist.getUserId().equals(userId)) {
            return R.error("地址不存在");
        }
        // 处理默认地址
        if (Boolean.TRUE.equals(dto.getIsDefault())) {
            addressService.lambdaUpdate()
                    .eq(Address::getUserId, userId)
                    .set(Address::getIsDefault, 0)
                    .update();
            exist.setIsDefault(1);
        } else if (dto.getIsDefault() != null) {
            exist.setIsDefault(Boolean.TRUE.equals(dto.getIsDefault()) ? 1 : 0);
        }
        // 其他字段
        exist.setName(dto.getName());
        exist.setPhone(dto.getPhone());
        exist.setProvince(dto.getProvince());
        exist.setCity(dto.getCity());
        exist.setDistrict(dto.getDistrict());
        exist.setDetail(dto.getDetail());
        addressService.updateById(exist);
        return R.ok();
    }

    /** 删除地址 */
    @DeleteMapping("/addresses/{id}")
    public R<Void> delete(@PathVariable Long id) {
        Long userId = SecurityUtil.currentUserId();
        if(userId == null) return R.error("未登录");
        Address exist = addressService.getById(id);
        if (exist == null || !exist.getUserId().equals(userId)) {
            return R.error("删除失败");
        }
        addressService.removeById(id);
        return R.ok();
    }

    private Address toEntity(AddressDTO d) {
        Address a = new Address();
        a.setName(d.getName());
        a.setPhone(d.getPhone());
        a.setProvince(d.getProvince());
        a.setCity(d.getCity());
        a.setDistrict(d.getDistrict());
        a.setDetail(d.getDetail());
        if (d.getIsDefault() != null) {
            a.setIsDefault(Boolean.TRUE.equals(d.getIsDefault()) ? 1 : 0);
        }
        return a;
    }
}
