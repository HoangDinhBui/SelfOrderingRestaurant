package com.example.SelfOrderingRestaurant.Service;

import com.example.SelfOrderingRestaurant.Dto.Request.SupplierRequestDTO.CreateSupplierRequestDTO;
import com.example.SelfOrderingRestaurant.Dto.Request.SupplierRequestDTO.UpdateSupplierRequestDTO;
import com.example.SelfOrderingRestaurant.Entity.Supplier;
import com.example.SelfOrderingRestaurant.Repository.SupplierRepository;
import com.example.SelfOrderingRestaurant.Service.Imp.ISupplierService;
import lombok.AllArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import lombok.AllArgsConstructor;

@AllArgsConstructor
@Service
public class SupplierService implements ISupplierService {

    private final SupplierRepository supplierRepository;

    @Transactional
    @Override
    public List<Supplier> getAllSuppliers() {
        return supplierRepository.findAll();
    }

    @Transactional
    @Override
    public Supplier getSupplierById(Integer id) {
        return supplierRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Supplier not found"));
    }

    @Transactional
    @Override
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
    @Override
    public void updateSupplier(Integer id, UpdateSupplierRequestDTO request) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Supplier not found with ID: " + id));

        supplier.setName(request.getName());
        supplier.setAddress(request.getAddress());
        supplier.setPhone(request.getPhone());

        supplierRepository.save(supplier);
    }

    @Transactional
    @Override
    public boolean deleteSupplier(Integer id) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Supplier not found with ID: " + id));
        supplierRepository.delete(supplier);
        return !supplierRepository.existsById(id);
    }
}
