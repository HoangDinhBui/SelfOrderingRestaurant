package com.example.SelfOrderingRestaurant.Entity;
import jakarta.persistence.*;
import lombok.*;

import java.sql.Time;

@Entity
@Table(name = "shifts")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class Shift {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "Shift_ID")
    private Integer shiftId;

    @Column(name = "Name", nullable = false)
    private String name;

    @Column(name = "StartTime", nullable = false)
    private Time startTime;

    @Column(name = "EndTime", nullable = false)
    private Time endTime;
}
