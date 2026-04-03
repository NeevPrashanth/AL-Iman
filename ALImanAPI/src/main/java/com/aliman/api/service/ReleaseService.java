package com.aliman.api.service;

import com.aliman.api.domain.ReleaseDate;
import com.aliman.api.domain.TimesheetRelease;
import com.aliman.api.domain.User;
import com.aliman.api.dto.ReleaseRequest;
import com.aliman.api.repository.TimesheetReleaseRepository;
import com.aliman.api.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ReleaseService {
    private final TimesheetReleaseRepository releaseRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    @Transactional
    public TimesheetRelease createRelease(ReleaseRequest request, Long createdByUserId) {
        User creator = userRepository.findById(createdByUserId)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        TimesheetRelease release = releaseRepository.findByMonthYear(request.getMonthYear())
                .orElseGet(TimesheetRelease::new);
        release.setMonthYear(request.getMonthYear());
        release.setCreatedBy(creator);

        List<LocalDate> dates = request.getWorkDates() == null || request.getWorkDates().isEmpty()
                ? defaultSaturdays(request.getMonthYear())
                : request.getWorkDates();

        // Normalize request dates and keep first-seen order to make updates idempotent.
        Set<LocalDate> requestedDates = new LinkedHashSet<>(dates);

        if (release.getReleaseDates() == null) {
            release.setReleaseDates(new ArrayList<>());
        }

        // Remove dates no longer present in the latest request.
        release.getReleaseDates().removeIf(rd -> !requestedDates.contains(rd.getWorkDate()));

        // Add only missing dates, keep existing ones.
        Set<LocalDate> existingDates = new LinkedHashSet<>();
        for (ReleaseDate rd : release.getReleaseDates()) {
            existingDates.add(rd.getWorkDate());
        }
        for (LocalDate d : requestedDates) {
            if (!existingDates.contains(d)) {
                ReleaseDate rd = new ReleaseDate();
                rd.setRelease(release);
                rd.setWorkDate(d);
                release.getReleaseDates().add(rd);
            }
        }

        TimesheetRelease saved = releaseRepository.save(release);
        emailService.sendReleaseNotice(saved);
        return saved;
    }

    private List<LocalDate> defaultSaturdays(LocalDate monthYear) {
        YearMonth ym = YearMonth.from(monthYear);
        LocalDate first = ym.atDay(1);
        List<LocalDate> saturdays = new ArrayList<>();
        LocalDate d = first;
        while (d.getMonth() == ym.getMonth()) {
            if (d.getDayOfWeek() == DayOfWeek.SATURDAY) {
                saturdays.add(d);
            }
            d = d.plusDays(1);
        }
        return saturdays;
    }
}
