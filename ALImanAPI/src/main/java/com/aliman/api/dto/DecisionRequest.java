package com.aliman.api.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class DecisionRequest {
    @NotNull
    private Long timesheetId;
    @NotNull
    private Boolean approve;
    private String rejectionReason;
}
