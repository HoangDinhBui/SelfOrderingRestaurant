package com.example.SelfOrderingRestaurant.Entity;
import com.example.SelfOrderingRestaurant.Enum.StaffShiftStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "staffshifts")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class StaffShift {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "StaffShift_ID")
    private Integer StaffShiftKey;

    @ManyToOne
    @JoinColumn(name = "Shift_ID")
    private Shift shift;

    @ManyToOne
    @JoinColumn(name = "Staff_ID")
    private Staff staff;

    @Column(name = "Date", nullable = false)
    private LocalDate date;

    @Enumerated(EnumType.STRING)
    @Column(name = "Status")
    private StaffShiftStatus status;
}
