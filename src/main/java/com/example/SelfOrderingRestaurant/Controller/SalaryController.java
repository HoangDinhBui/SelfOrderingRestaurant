package com.example.SelfOrderingRestaurant.Controller;

import com.example.SelfOrderingRestaurant.Entity.StaffMonthlySalary;
import com.example.SelfOrderingRestaurant.Repository.StaffMonthlySalaryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/salary")
public class SalaryController {
    @Autowired
    private StaffMonthlySalaryRepository repository;

    @GetMapping("/monthly")
    public List<StaffMonthlySalary> getAllMonthlySalaries() {
        return repository.findAll();
    }
}