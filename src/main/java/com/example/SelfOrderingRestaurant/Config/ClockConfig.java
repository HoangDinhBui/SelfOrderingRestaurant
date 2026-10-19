package com.example.SelfOrderingRestaurant.Config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Clock;
import java.time.ZoneId;

/** Đồng hồ theo giờ Việt Nam: server production chạy UTC nhưng giờ ca làm là giờ địa phương. */
@Configuration
public class ClockConfig {

    @Bean
    public Clock clock(@Value("${attendance.zone:Asia/Ho_Chi_Minh}") String zone) {
        return Clock.system(ZoneId.of(zone));
    }
}
