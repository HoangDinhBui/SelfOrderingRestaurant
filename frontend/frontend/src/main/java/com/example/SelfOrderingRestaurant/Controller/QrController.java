package com.example.SelfOrderingRestaurant.Controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
@RequestMapping("/api/qr")
public class QrController {

    @Value("${file.upload-dir}")
    private String uploadDir;

    @PostMapping("/upload")
    public ResponseEntity<?> uploadQrCode(@RequestParam("file") MultipartFile file,
                                          @RequestParam("tableNumber") String tableNumber) {
        try {
            // Đảm bảo thư mục QR tồn tại
            Path qrDir = Paths.get(uploadDir, "QR");
            Files.createDirectories(qrDir);

            // Lưu file vào thư mục uploads/QR
            String fileName = "table_" + tableNumber + "_qr.png";
            Path filePath = qrDir.resolve(fileName);
            Files.write(filePath, file.getBytes());

            return ResponseEntity.ok().body("Mã QR đã được lưu thành công!");
        } catch (IOException e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Lỗi khi lưu mã QR: " + e.getMessage());
        }
    }
}