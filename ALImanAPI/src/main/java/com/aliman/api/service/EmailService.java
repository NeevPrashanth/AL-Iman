package com.aliman.api.service;

import com.aliman.api.domain.Timesheet;
import com.aliman.api.domain.TimesheetRelease;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {
    private final JavaMailSender mailSender;

    public void sendReleaseNotice(TimesheetRelease release) {
        // Stub: wire real recipients via repository
        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setTo("demo@aliman.local");
        msg.setSubject("Timesheet released for " + release.getMonthYear());
        msg.setText("Timesheet window opened. Dates: " + release.getReleaseDates());
        //mailSender.send(msg);
    }

    public void sendDecision(Timesheet timesheet) {
        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setTo(timesheet.getContractor().getEmail());
        msg.setSubject("Timesheet " + timesheet.getStatus());
        msg.setText("Timesheet status: " + timesheet.getStatus() + " Reason: " + timesheet.getRejectionReason());
       // mailSender.send(msg);
    }
}
