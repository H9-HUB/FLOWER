package com.ldong.backend.util;

import com.ldong.backend.entity.UserRole;
import io.jsonwebtoken.*;
import org.springframework.stereotype.Component;
import java.util.Date;

@Component
public class JwtUtil {
    private static final String SECRET = "flower2025Secretcreatedbyldongh900wdanyihuadian";
    private static final long EXPIRE = 24 * 60 * 60 * 1000; // 24h

    public String createToken(Long userId, UserRole role) {
        return Jwts.builder()
                .setSubject(userId.toString())
                .claim("role", role.name())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRE))
                .signWith(SignatureAlgorithm.HS256, SECRET)
                .compact();
    }

    public Claims parse(String token) {
        return Jwts.parser().setSigningKey(SECRET).parseClaimsJws(token).getBody();
    }
}