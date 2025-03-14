package com.example.SelfOrderingRestaurant.Entity.Key;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Embeddable
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class StaffShiftKey {
    @Column(name = "Shift_ID")
    private Integer shiftId;

    @Column(name = "Staff_ID")
    private Integer staffId;

    @Column(name = "Date")
    private LocalDate date;
}
