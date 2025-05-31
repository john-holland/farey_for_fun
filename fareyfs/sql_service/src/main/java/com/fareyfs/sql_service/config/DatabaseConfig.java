package com.fareyfs.sql_service.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.transaction.annotation.EnableTransactionManagement;

@Configuration
@EnableJpaRepositories(basePackages = "com.fareyfs.sql_service.repository")
@EnableTransactionManagement
public class DatabaseConfig {
} 