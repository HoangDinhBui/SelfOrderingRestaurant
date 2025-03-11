package com.example.SelfOrderingRestaurant.Entity;
import com.example.SelfOrderingRestaurant.Entity.Enum.ShiftStatus;
import com.example.SelfOrderingRestaurant.Entity.Key.StaffShiftKey;
import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.util.Date;

@Entity
@Table(name = "staffshift")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class StaffShift {
    @EmbeddedId
    private StaffShiftKey id;

    @ManyToOne
    @MapsId("shiftId")
    @JoinColumn(name = "Shift_ID")
    private Shift shift;

    @ManyToOne
    @MapsId("staffId")
    @JoinColumn(name = "Staff_ID")
    private Staff staff;

    @Temporal(TemporalType.DATE)
    @Column(name = "Date", nullable = false)
    private Date date;

    @Enumerated(EnumType.STRING)
    @Column(name = "Status")
    private ShiftStatus status;
}
