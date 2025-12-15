package com.ldong.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig {
    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/**")   // 开放所有业务与管理接口，避免跨域阻断
                        // 开发环境：放开所有来源，避免 file:// 或其它端口导致 401/跨域失败
                        .allowedOriginPatterns("*")
                        .allowedMethods("GET","POST","PUT","DELETE","OPTIONS")
                        .allowedHeaders("*")
                        .exposedHeaders("Authorization","X-User-Id","X-User-Role")
                        .allowCredentials(true);
            }

            @Override
            public void addResourceHandlers(ResourceHandlerRegistry registry) {
                // 优先从 classpath 的 static/upload 提供静态资源，开发时也从项目目录的 static/upload 提供
                String fsUploadPath = "file:" + System.getProperty("user.dir") + "/backend/src/main/resources/static/upload/";
                registry.addResourceHandler("/upload/**")
                        .addResourceLocations("classpath:/static/upload/", fsUploadPath);
            }
        };
    }
}