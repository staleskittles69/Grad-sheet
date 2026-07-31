package com.siaas;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class SiaasApplication {
    public static void main(String[] args) {
        SpringApplication.run(SiaasApplication.class, args);
    }
}
