package com.taskbridge.taskservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class TaskServiceApplication {

    public static void main(String[] args) {
        System.out.println("URL=" + System.getenv("SUPABASE_DB_URL"));
        System.out.println("USER=" + System.getenv("SUPABASE_DB_USER"));
        System.out.println("PW_LENGTH=" +
                (System.getenv("SUPABASE_DB_PASSWORD") != null ? System.getenv("SUPABASE_DB_PASSWORD").length() : "NULL"));
        System.out.println("JWT_SECRET_SET=" + (System.getenv("SUPABASE_JWT_SECRET") != null));
        SpringApplication.run(TaskServiceApplication.class, args);
    }
}