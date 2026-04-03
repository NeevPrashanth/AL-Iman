package com.aliman.api.domain;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

@Entity
@Table(name = "timesheet_releases")
@Data
public class TimesheetRelease {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Store as first day of month for uniqueness.
     */
    @Column(nullable = false, unique = true)
    private LocalDate monthYear;

    @ManyToOne(optional = false)
    @JoinColumn(name = "created_by")
    private User createdBy;

    private OffsetDateTime releasedAt = OffsetDateTime.now();

    @OneToMany(mappedBy = "release", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @lombok.ToString.Exclude
    @lombok.EqualsAndHashCode.Exclude
    private List<ReleaseDate> releaseDates;
}
