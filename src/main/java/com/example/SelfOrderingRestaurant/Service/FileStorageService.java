package com.example.SelfOrderingRestaurant.Service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Objects;
import java.util.UUID;

@Service
public class FileStorageService {

    @Value("${file.upload-dir}")
    private String uploadDir;

    public String saveFile(MultipartFile file, String subDirectory) {
        if (file == null || file.isEmpty()) {
            return null;
        }

        String fileName = StringUtils.cleanPath(Objects.requireNonNull(file.getOriginalFilename()));
        String uniqueFileName = UUID.randomUUID().toString() + "_" + fileName;

        // Đường dẫn tuyệt đối để lưu file
        Path uploadPath = Paths.get(uploadDir, subDirectory);
        try {
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            Path filePath = uploadPath.resolve(uniqueFileName);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // Trả về đường dẫn tương đối (ví dụ: dishes/abc_xyz.jpg)
            return uniqueFileName;
        } catch (IOException e) {
            throw new RuntimeException("Không thể lưu file " + fileName + ". Vui lòng thử lại!", e);
        }
    }

    public boolean deleteFile(String relativePath) {
        if (relativePath == null || relativePath.isEmpty()) {
            return false;
        }

        try {
            Path filePath = Paths.get(uploadDir, relativePath);
            return Files.deleteIfExists(filePath);
        } catch (IOException e) {
            throw new RuntimeException("Không thể xóa file " + relativePath, e);
        }
    }

    public String updateFile(MultipartFile file, String oldRelativePath, String subDirectory) {
        // Xóa file cũ nếu có
        if (oldRelativePath != null && !oldRelativePath.isEmpty()) {
            deleteFile(oldRelativePath);
        }

        // Lưu file mới
        return saveFile(file, subDirectory);
    }
}