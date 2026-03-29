package com.aliman.api.domain;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "timesheet_entries",
       uniqueConstraints = @UniqueConstraint(columnNames = {"timesheet_id", "work_date"}))
@Data
public class TimesheetEntry {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Timesheet timesheet;

    @Column(name = "work_date", nullable = false)
    private LocalDate workDate;

    @Column(nullable = false)
    private BigDecimal hoursWorked = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "ENUM('WORK','HOLIDAY','SICK')")
    private EntryType entryType = EntryType.WORK;

    private String comment;
    private String previousComment;
    private OffsetDateTime createdAt = OffsetDateTime.now();
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    public enum EntryType {
        WORK, HOLIDAY, SICK
    }
}
