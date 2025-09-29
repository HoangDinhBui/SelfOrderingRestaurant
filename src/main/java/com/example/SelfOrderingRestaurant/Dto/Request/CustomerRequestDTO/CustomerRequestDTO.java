package com.example.SelfOrderingRestaurant.Dto.Request.CustomerRequestDTO;

import lombok.*;

import java.util.Date;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class CustomerRequestDTO {
    private String fullname;
    private Date joinDate;
    private Integer points;
}