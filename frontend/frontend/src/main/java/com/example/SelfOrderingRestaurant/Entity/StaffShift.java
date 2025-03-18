package com.example.SelfOrderingRestaurant.Entity;
import com.example.SelfOrderingRestaurant.Enum.StaffShiftStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "staff_shifts")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class StaffShift {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "staff_shift_id")
    private Integer StaffShiftKey;

    @ManyToOne
    @JoinColumn(name = "shift_id")
    private Shift shift;

    @ManyToOne
    @JoinColumn(name = "staff_id")
    private Staff staff;

    @Column(name = "date", nullable = false)
    private LocalDate date;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private StaffShiftStatus status;
}
