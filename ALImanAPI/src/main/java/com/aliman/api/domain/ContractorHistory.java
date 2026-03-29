package com.aliman.api.domain;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "contractor_history")
@Data
public class ContractorHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    private Contractor contractor;

    private OffsetDateTime snapshotAt = OffsetDateTime.now();

    private String fullName;
    private String email;
    private String phone;
    private String address;
    private String niNumber;
    private BigDecimal hourlyRate;
    private String roleTitle;
    private LocalDate startDate;
    private LocalDate endDate;
    private Boolean active;
    private String changeReason;
}
