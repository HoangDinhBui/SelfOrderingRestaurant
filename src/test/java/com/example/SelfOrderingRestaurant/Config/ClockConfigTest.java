package com.example.SelfOrderingRestaurant.Config;

import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.ZoneId;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ClockConfigTest {

    @Test
    void clock_usesConfiguredAttendanceZone() {
        Clock clock = new ClockConfig().clock("Asia/Ho_Chi_Minh");
        assertEquals(ZoneId.of("Asia/Ho_Chi_Minh"), clock.getZone());
    }
}
