package com.aliman.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class EventRequest {
    @NotBlank
    private String title;
    private String description;
    private String location;
    @NotNull
    private LocalDate eventDate;
    private LocalTime startTime;
    private LocalTime endTime;
}
