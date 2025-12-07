package com.ldong.backend.util;

public class SecurityUtil {
    public static Long currentUserId() {
        // 先写死 1 号用户，等 JWT 过滤器再改
        return 1L;
    }
}
