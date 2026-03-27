package com.academy.controller;

import com.academy.dto.response.ApiResponse;
import com.academy.dto.response.CertificateResponse;
import com.academy.dto.response.PageResponse;
import com.academy.service.CertificateService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/certificates")
@RequiredArgsConstructor
@Tag(name = "Certificates", description = "Certificate management")
public class CertificateController {

    private final CertificateService certificateService;

    @GetMapping
    @Operation(summary = "Get user's certificates")
    public ResponseEntity<ApiResponse<PageResponse<CertificateResponse>>> getMyCertificates(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        PageResponse<CertificateResponse> response = certificateService.getMyCertificates(page, size);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get certificate by ID")
    public ResponseEntity<ApiResponse<CertificateResponse>> getCertificateById(@PathVariable UUID id) {
        CertificateResponse response = certificateService.getCertificateById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}/download")
    @Operation(summary = "Download certificate PDF")
    public ResponseEntity<byte[]> downloadCertificate(@PathVariable UUID id) {
        byte[] pdfBytes = certificateService.downloadCertificate(id);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "certificate.pdf");

        return ResponseEntity.ok()
                .headers(headers)
                .body(pdfBytes);
    }

    @GetMapping("/verify/{certificateNumber}")
    @Operation(summary = "Verify certificate by certificate number")
    public ResponseEntity<ApiResponse<CertificateResponse>> verifyCertificate(@PathVariable String certificateNumber) {
        CertificateResponse response = certificateService.verifyCertificate(certificateNumber);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
