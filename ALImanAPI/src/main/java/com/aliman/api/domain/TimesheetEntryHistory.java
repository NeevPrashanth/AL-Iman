package com.aliman.api.domain;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "timesheet_entry_history")
@Data
public class TimesheetEntryHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    private TimesheetEntry entry;

    private String comment;
    private BigDecimal hoursWorked;
    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "ENUM('WORK','HOLIDAY','SICK')")
    private TimesheetEntry.EntryType entryType;
    private OffsetDateTime snapshotAt = OffsetDateTime.now();
}
