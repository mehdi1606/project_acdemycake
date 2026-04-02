package com.academy.service.impl;

import com.academy.entity.User;
import com.academy.entity.enums.SubscriptionStatus;
import com.academy.entity.enums.UserRole;
import com.academy.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminBootstrapService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.email:}")
    private String adminEmail;

    @Value("${app.admin.password:}")
    private String adminPassword;

    @Value("${app.admin.full-name:Administrator}")
    private String adminFullName;

    @PostConstruct
    @Transactional
    public void bootstrapAdmin() {
        if (!StringUtils.hasText(adminEmail) || !StringUtils.hasText(adminPassword)) {
            throw new IllegalStateException(
                "ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required. " +
                "Set them before starting the application.");
        }

        if (adminPassword.length() < 12) {
            throw new IllegalStateException(
                "ADMIN_PASSWORD must be at least 12 characters.");
        }

        String normalizedEmail = adminEmail.toLowerCase();

        if (userRepository.existsByEmail(normalizedEmail)) {
            log.info("Admin account already exists for {}", normalizedEmail);
            return;
        }

        User admin = User.builder()
                .email(normalizedEmail)
                .passwordHash(passwordEncoder.encode(adminPassword))
                .fullName(adminFullName)
                .role(UserRole.ADMIN)
                .isEmailVerified(true)
                .mustChangePassword(true)
                .isBanned(false)
                .subscriptionStatus(SubscriptionStatus.NONE)
                .build();

        userRepository.save(admin);
        log.info("Admin account bootstrapped for {}. Password change required on first login.", normalizedEmail);
    }
}
