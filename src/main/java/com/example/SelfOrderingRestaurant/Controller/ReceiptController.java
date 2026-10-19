package com.example.SelfOrderingRestaurant.Controller;

import com.example.SelfOrderingRestaurant.Service.ReceiptService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import lombok.AllArgsConstructor;
@AllArgsConstructor
@RestController
@RequestMapping("/api/receipts")
public class ReceiptController {


    private final ReceiptService receiptService;

    @GetMapping("/generate/{orderId}")
    public ResponseEntity<byte[]> generateReceipt(@PathVariable Integer orderId) throws Exception {
        // Missing orders surface as 404 through GlobalExeptionHandler
        byte[] pdfBytes = receiptService.generateReceiptPdf(orderId);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "receipt-order-" + orderId + ".pdf");
        headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");

        return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
    }

    @GetMapping("/generate/table/{tableId}")
    public ResponseEntity<byte[]> generateTableReceipt(@PathVariable Integer tableId) {
        try {

            return new ResponseEntity<>(HttpStatus.NOT_IMPLEMENTED);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}