package com.aliman.api.dto;

import com.aliman.api.domain.TimesheetEntry;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class TimesheetEntryRequest {
    @NotNull
    private LocalDate workDate;
    @NotNull
    private BigDecimal hoursWorked;
    @NotNull
    private TimesheetEntry.EntryType entryType;
    private String comment;
}
