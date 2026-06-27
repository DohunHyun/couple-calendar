package com.couplecalendar;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class CoupleCalendarApplication {

    public static void main(String[] args) {
        SpringApplication.run(CoupleCalendarApplication.class, args);
    }
}
