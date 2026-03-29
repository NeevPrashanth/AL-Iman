package com.aliman.api.domain;

import jakarta.persistence.*;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.List;

@Entity
@Table(name = "timesheets",
       uniqueConstraints = @UniqueConstraint(columnNames = {"contractor_id", "release_id"}))
@Data
public class Timesheet {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    private Contractor contractor;

    @ManyToOne(optional = false)
    private TimesheetRelease release;

    @Enumerated(EnumType.STRING)
    private Status status = Status.DRAFT;

    @ManyToOne
    private User approver;

    private OffsetDateTime approvedAt;
    private String rejectionReason;
    private OffsetDateTime createdAt = OffsetDateTime.now();
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    @OneToMany(mappedBy = "timesheet", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<TimesheetEntry> entries;

    public enum Status {
        DRAFT, SUBMITTED, APPROVED, REJECTED
    }
}
