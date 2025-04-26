package com.example.SelfOrderingRestaurant.Controller;

import com.example.SelfOrderingRestaurant.Dto.Request.SupplierRequestDTO.CreateSupplierRequestDTO;
import com.example.SelfOrderingRestaurant.Dto.Request.SupplierRequestDTO.UpdateSupplierRequestDTO;
import com.example.SelfOrderingRestaurant.Service.SupplierService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import lombok.AllArgsConstructor;

@AllArgsConstructor
@RestController
@RequestMapping("api/admin/suppliers")
public class SupplierController {

    private final SupplierService supplierService;

    @GetMapping
    public ResponseEntity<?> getAllSuppliers() {
        return ResponseEntity.ok(supplierService.getAllSuppliers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getSupplierById(@PathVariable Integer id) {
        return ResponseEntity.ok(supplierService.getSupplierById(id));
    }

    @PostMapping
    public ResponseEntity<?> createSupplier(@RequestBody CreateSupplierRequestDTO request) {
        supplierService.createSupplier(request);
        return ResponseEntity.ok("Supplier created successfully");
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateSupplier(@PathVariable Integer id, @RequestBody UpdateSupplierRequestDTO request) {
        supplierService.updateSupplier(id, request);
        return ResponseEntity.ok("Supplier updated successfully");
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteSupplier(@PathVariable Integer id) {
        if(supplierService.deleteSupplier(id)) {
            return ResponseEntity.ok("Supplier deleted successfully");
        }
        return ResponseEntity.notFound().build();
    }

}
