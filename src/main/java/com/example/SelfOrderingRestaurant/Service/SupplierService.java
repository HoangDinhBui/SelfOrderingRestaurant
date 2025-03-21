package com.example.SelfOrderingRestaurant.Service;

import com.example.SelfOrderingRestaurant.Dto.Request.SupplierRequestDTO.CreateSupplierRequestDTO;
import com.example.SelfOrderingRestaurant.Dto.Request.SupplierRequestDTO.UpdateSupplierRequestDTO;
import com.example.SelfOrderingRestaurant.Entity.Supplier;
import com.example.SelfOrderingRestaurant.Repository.SupplierRepository;
import lombok.AllArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class SupplierService {
    @Autowired
    private SupplierRepository supplierRepository;

    @Transactional
    public List<Supplier> getAllSuppliers() {
        return supplierRepository.findAll();
    }

    @Transactional
    public Supplier getSupplierById(Integer id) {
        return supplierRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Supplier not found"));
    }

    @Transactional
    public void createSupplier(CreateSupplierRequestDTO request) {
        Supplier supplier = new Supplier();
        supplier.setName(request.getName());
        supplier.setAddress(request.getAddress());
        supplier.setContactPerson(request.getContactPerson());
        supplier.setEmail(request.getEmail());
        supplier.setPhone(request.getPhone());

        supplierRepository.save(supplier);
    }

    @Transactional
    public void updateSupplier(Integer id, UpdateSupplierRequestDTO request) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Supplier not found with ID: " + id));

        supplier.setName(request.getName());
        supplier.setAddress(request.getAddress());
        supplier.setPhone(request.getPhone());

        supplierRepository.save(supplier);
    }

    @Transactional
    public boolean deleteSupplier(Integer id) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Supplier not found with ID: " + id));
        supplierRepository.delete(supplier);
        return !supplierRepository.existsById(id);
    }
}
