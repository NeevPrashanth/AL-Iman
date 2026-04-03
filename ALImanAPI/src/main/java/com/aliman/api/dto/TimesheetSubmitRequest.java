package com.aliman.api.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class TimesheetSubmitRequest {
    private Long contractorId;
    @NotNull
    private Long releaseId;
    @NotNull
    private List<TimesheetEntryRequest> entries;
}
