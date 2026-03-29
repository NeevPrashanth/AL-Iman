package com.aliman.api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class ContractorRequest {
    @NotBlank
    private String fullName;
    @Email
    private String email;
    private String phone;
    private String address;
    private String niNumber;
    @NotNull
    private BigDecimal hourlyRate;
    @NotBlank
    private String roleTitle;
    @NotNull
    private LocalDate startDate;
    private LocalDate endDate;
    private String changeReason;
}
