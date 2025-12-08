package com.ldong.backend.util;

import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

public class SecurityUtil {
    public static Long currentUserId() {
        ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attrs == null) return null;
        Object v = attrs.getRequest().getAttribute("USER_ID");
        return v instanceof Long ? (Long) v : (v != null ? Long.valueOf(v.toString()) : null);
    }
}
