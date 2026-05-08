package com.academy.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.List;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Value("${app.cors.allowed-origins}")
    private List<String> allowedOrigins;

    /**
     * File serving (/files/**) is handled by FileController which sets the
     * correct Content-Disposition (inline) and Content-Type headers so PDFs
     * and images display in the browser instead of being downloaded.
     * CORS for /files/** is also declared here so the browser can fetch files
     * from the React dev-server origin.
     */
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/files/**")
                .allowedOrigins(allowedOrigins.toArray(new String[0]))
                .allowedMethods("GET", "HEAD", "OPTIONS");
    }
}
