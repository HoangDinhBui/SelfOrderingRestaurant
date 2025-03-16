package com.example.SelfOrderingRestaurant.Entity;

import com.example.SelfOrderingRestaurant.Enum.TableStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "tables")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class DinningTable {
    @Id
    @Column(name = "TableNumber", updatable = false, nullable = false)
    private Integer tableNumber;

    @Column(name = "Capacity", nullable = false)
    private Integer capacity;

    @Enumerated(EnumType.STRING)
    @Column(name = "Status")
    private TableStatus tableStatus = TableStatus.AVAILABLE;

    @Column(name = "Location")
    private String location;

    @Column(name = "QRCode")
    private String qrCode;
}
