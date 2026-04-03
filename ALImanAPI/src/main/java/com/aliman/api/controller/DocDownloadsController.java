package com.aliman.api.controller;

import com.aliman.api.dto.ApprovedTimesheetDownloadDto;
import com.aliman.api.service.DocDownloadService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/doc-downloads")
@RequiredArgsConstructor
public class DocDownloadsController {
    private final DocDownloadService docDownloadService;

    @GetMapping("/timesheets/approved")
    public List<ApprovedTimesheetDownloadDto> listApproved(Principal principal) {
        return docDownloadService.listApprovedTimesheetsForUser(principal.getName());
    }

    @GetMapping("/timesheets/{timesheetId}/pdf")
    public ResponseEntity<byte[]> downloadTimesheetPdf(@PathVariable Long timesheetId, Principal principal) {
        byte[] pdf = docDownloadService.generateApprovedTimesheetPdf(timesheetId, principal.getName());
        String filename = "approved-timesheet-" + timesheetId + ".pdf";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDisposition(ContentDisposition.attachment()
                .filename(filename, StandardCharsets.UTF_8)
                .build());

        return ResponseEntity.ok()
                .headers(headers)
                .body(pdf);
    }
}
