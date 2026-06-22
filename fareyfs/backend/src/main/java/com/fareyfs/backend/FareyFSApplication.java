package com.fareyfs.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication
@EntityScan("com.fareyfs.model")
@EnableJpaRepositories("com.fareyfs.repository")
public class FareyFSApplication {
    public static void main(String[] args) {
        SpringApplication.run(FareyFSApplication.class, args);
    }
} 