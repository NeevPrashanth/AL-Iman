package com.aliman.api.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class ReleaseRequest {
    /**
     * First day of month.
     */
    @NotNull
    private LocalDate monthYear;
    /**
     * Optional custom Saturday list; if empty, service will auto-generate 4 Saturdays.
     */
    private List<LocalDate> workDates;
}
