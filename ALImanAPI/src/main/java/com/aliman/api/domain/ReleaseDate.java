package com.aliman.api.domain;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;

@Entity
@Table(name = "release_dates",
       uniqueConstraints = @UniqueConstraint(columnNames = {"release_id", "work_date"}))
@Data
public class ReleaseDate {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "release_id")
    @com.fasterxml.jackson.annotation.JsonIgnore
    @lombok.ToString.Exclude
    @lombok.EqualsAndHashCode.Exclude
    private TimesheetRelease release;

    @Column(name = "work_date", nullable = false)
    private LocalDate workDate;
}
