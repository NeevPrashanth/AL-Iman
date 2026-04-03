package com.aliman.api.dto;

import com.aliman.api.domain.Timesheet;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ApprovedTimesheetDownloadDto(
        Long timesheetId,
        LocalDate monthYear,
        Timesheet.Status status,
        BigDecimal totalHours
) {
}

