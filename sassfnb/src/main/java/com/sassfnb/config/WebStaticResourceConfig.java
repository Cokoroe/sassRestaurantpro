package com.sassfnb.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.*;

@Configuration
public class WebStaticResourceConfig implements WebMvcConfigurer {

    @Value("${app.upload.localDir:uploads}")
    private String localDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // http://localhost:8080/files/** -> thư mục localDir
        registry.addResourceHandler("/files/**")
                .addResourceLocations("file:" + System.getProperty("user.dir") + "/" + localDir + "/")
                .setCachePeriod(31536000); // cache 1 năm
    }
}
