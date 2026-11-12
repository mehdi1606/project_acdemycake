package com.academy.dto.request;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;

/** Participant reserved on WhatsApp and paid outside the platform. */
@Data
public class AddManualParticipantRequest {

    @NotBlank(message = "Full name is required")
    @Size(min = 2, max = 150, message = "Full name must be between 2 and 150 characters")
    private String fullName;

    @Size(max = 30, message = "Phone number is too long")
    @Pattern(regexp = "^$|^[-+0-9 ()]{6,30}$", message = "Invalid phone number")
    private String phone;

    @Email(message = "Invalid e-mail address")
    @Size(max = 255)
    private String email;

    @DecimalMin(value = "0.00", message = "Amount cannot be negative")
    @DecimalMax(value = "99999999.99", message = "Amount is too large")
    private BigDecimal amountPaid;

    @Size(max = 500, message = "Note is too long")
    private String note;
}
