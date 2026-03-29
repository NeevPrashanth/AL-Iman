package com.aliman.api.domain;

import jakarta.persistence.*;
import lombok.Data;

import java.time.OffsetDateTime;

@Entity
@Table(name = "email_audit")
@Data
public class EmailAudit {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String recipient;
    private String subject;

    @Column(columnDefinition = "TEXT")
    private String payload;

    private OffsetDateTime sentAt = OffsetDateTime.now();
    private String category;
}
