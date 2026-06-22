package com.fareyfs.sql_service;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication
@EntityScan("com.fareyfs.sql_service.entity")
@EnableJpaRepositories("com.fareyfs.sql_service.repository")
public class SqlServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(SqlServiceApplication.class, args);
    }
} 