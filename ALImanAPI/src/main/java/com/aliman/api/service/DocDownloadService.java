package com.aliman.api.service;

import com.aliman.api.domain.Role;
import com.aliman.api.domain.Timesheet;
import com.aliman.api.domain.TimesheetEntry;
import com.aliman.api.domain.User;
import com.aliman.api.dto.ApprovedTimesheetDownloadDto;
import com.aliman.api.repository.TimesheetRepository;
import com.aliman.api.repository.UserRepository;
import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.Image;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;

import static org.springframework.http.HttpStatus.FORBIDDEN;
import static org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
@RequiredArgsConstructor
public class DocDownloadService {
    private static final DateTimeFormatter MONTH_FMT = DateTimeFormatter.ofPattern("MMMM yyyy");
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd-MMM-yy");

    private final TimesheetRepository timesheetRepository;
    private final UserRepository userRepository;

    public List<ApprovedTimesheetDownloadDto> listApprovedTimesheetsForUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));
        List<Timesheet> timesheets = isManagerOrAdmin(user)
                ? timesheetRepository.findByStatusOrderByUpdatedAtDesc(Timesheet.Status.APPROVED)
                : timesheetRepository.findByContractorIdAndStatusOrderByUpdatedAtDesc(
                        getContractorIdOrThrow(user), Timesheet.Status.APPROVED);

        return timesheets.stream()
                .map(t -> new ApprovedTimesheetDownloadDto(
                        t.getId(),
                        t.getRelease().getMonthYear(),
                        t.getStatus(),
                        calculateTotalHours(t)))
                .toList();
    }

    public byte[] generateApprovedTimesheetPdf(Long timesheetId, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));
        Timesheet timesheet = timesheetRepository.findById(timesheetId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Timesheet not found"));
        authorizeAccess(user, timesheet);
        if (timesheet.getStatus() != Timesheet.Status.APPROVED) {
            throw new ResponseStatusException(FORBIDDEN, "Only approved timesheets can be downloaded");
        }

        try {
            return renderTimesheetPdf(timesheet);
        } catch (Exception ex) {
            throw new ResponseStatusException(INTERNAL_SERVER_ERROR, "Unable to generate PDF", ex);
        }
    }

    private byte[] renderTimesheetPdf(Timesheet timesheet) throws DocumentException, IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4, 24, 24, 20, 20);
        PdfWriter.getInstance(document, out);
        document.open();

        addLogo(document);
        addTitle(document);
        addMetaTable(document, timesheet);
        addEntryTable(document, timesheet);
        addTotalsBlock(document, timesheet);

        document.close();
        return out.toByteArray();
    }

    private void addLogo(Document document) throws IOException, DocumentException {
        ClassPathResource logoResource = new ClassPathResource("static/logo.png");
        if (!logoResource.exists()) {
            return;
        }
        Image logo = Image.getInstance(logoResource.getURL());
        logo.scaleToFit(170, 110);
        logo.setAlignment(Element.ALIGN_CENTER);
        document.add(logo);
    }

    private void addTitle(Document document) throws DocumentException {
        Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16);
        Paragraph title = new Paragraph("MONTHLY TIME SHEET", titleFont);
        title.setAlignment(Element.ALIGN_CENTER);
        title.setSpacingAfter(12f);
        document.add(title);
    }

    private void addMetaTable(Document document, Timesheet timesheet) throws DocumentException {
        PdfPTable meta = new PdfPTable(new float[]{1.2f, 1.8f, 1.2f, 1.8f});
        meta.setWidthPercentage(100);
        meta.setSpacingAfter(10f);

        addMetaRow(meta, "Employee Name", safe(timesheet.getContractor().getFullName()), "Employee Role", safe(timesheet.getContractor().getRoleTitle()));
        addMetaRow(meta, "Email Address", safe(timesheet.getContractor().getEmail()), "Contact Number", safe(timesheet.getContractor().getPhone()));
        addMetaRow(meta, "NI Number", safe(timesheet.getContractor().getNiNumber()), "Rate Per Hour", "GBP " + safeMoney(timesheet.getContractor().getHourlyRate()));
        addMetaRow(meta, "Month Ending", timesheet.getRelease().getMonthYear().format(MONTH_FMT), "Line Manager", timesheet.getApprover() != null ? safe(timesheet.getApprover().getFullName()) : "N/A");

        document.add(meta);
    }

    private void addEntryTable(Document document, Timesheet timesheet) throws DocumentException {
        PdfPTable table = new PdfPTable(new float[]{1.4f, 1f, 1f, 2.2f});
        table.setWidthPercentage(100);
        table.setSpacingAfter(10f);

        addHeaderCell(table, "Date");
        addHeaderCell(table, "Entry Type");
        addHeaderCell(table, "Hours Worked");
        addHeaderCell(table, "Comment");

        List<TimesheetEntry> rows = timesheet.getEntries() == null ? List.of() : timesheet.getEntries().stream()
                .sorted(Comparator.comparing(TimesheetEntry::getWorkDate))
                .toList();

        for (TimesheetEntry entry : rows) {
            addDataCell(table, entry.getWorkDate() != null ? entry.getWorkDate().format(DATE_FMT) : "");
            addDataCell(table, entry.getEntryType() != null ? entry.getEntryType().name() : "");
            addDataCell(table, safeMoney(entry.getHoursWorked()));
            addDataCell(table, safe(entry.getComment()));
        }

        document.add(table);
    }

    private void addTotalsBlock(Document document, Timesheet timesheet) throws DocumentException {
        BigDecimal totalHours = calculateTotalHours(timesheet);
        BigDecimal hourlyRate = timesheet.getContractor().getHourlyRate() != null ? timesheet.getContractor().getHourlyRate() : BigDecimal.ZERO;
        BigDecimal gross = totalHours.multiply(hourlyRate).setScale(2, RoundingMode.HALF_UP);

        PdfPTable totals = new PdfPTable(new float[]{1.5f, 1f});
        totals.setWidthPercentage(45);
        totals.setHorizontalAlignment(Element.ALIGN_RIGHT);
        totals.setSpacingAfter(12f);

        addTotalsRow(totals, "Total Monthly Hours", safeMoney(totalHours));
        addTotalsRow(totals, "Gross Salary", "GBP " + safeMoney(gross));

        document.add(totals);
    }

    private void addMetaRow(PdfPTable table, String l1, String v1, String l2, String v2) {
        addLabelCell(table, l1 + ":");
        addValueCell(table, v1);
        addLabelCell(table, l2 + ":");
        addValueCell(table, v2);
    }

    private void addTotalsRow(PdfPTable table, String label, String value) {
        PdfPCell left = new PdfPCell(new Phrase(label, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10)));
        left.setPadding(6f);
        left.setBackgroundColor(new java.awt.Color(242, 242, 242));
        table.addCell(left);

        PdfPCell right = new PdfPCell(new Phrase(value, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10)));
        right.setPadding(6f);
        right.setHorizontalAlignment(Element.ALIGN_RIGHT);
        table.addCell(right);
    }

    private void addHeaderCell(PdfPTable table, String text) {
        PdfPCell cell = new PdfPCell(new Phrase(text, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10)));
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        cell.setPadding(6f);
        cell.setBackgroundColor(new java.awt.Color(223, 223, 223));
        table.addCell(cell);
    }

    private void addDataCell(PdfPTable table, String text) {
        PdfPCell cell = new PdfPCell(new Phrase(safe(text), FontFactory.getFont(FontFactory.HELVETICA, 10)));
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        cell.setPadding(6f);
        table.addCell(cell);
    }

    private void addLabelCell(PdfPTable table, String text) {
        PdfPCell cell = new PdfPCell(new Phrase(text, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10)));
        cell.setBorder(Rectangle.NO_BORDER);
        cell.setPadding(5f);
        table.addCell(cell);
    }

    private void addValueCell(PdfPTable table, String text) {
        PdfPCell cell = new PdfPCell(new Phrase(safe(text), FontFactory.getFont(FontFactory.HELVETICA, 10)));
        cell.setPadding(5f);
        cell.setBorder(Rectangle.BOTTOM);
        table.addCell(cell);
    }

    private void authorizeAccess(User user, Timesheet timesheet) {
        if (isManagerOrAdmin(user)) {
            return;
        }
        Long contractorId = getContractorIdOrThrow(user);
        if (!contractorId.equals(timesheet.getContractor().getId())) {
            throw new ResponseStatusException(FORBIDDEN, "You are not allowed to download this timesheet");
        }
    }

    private Long getContractorIdOrThrow(User user) {
        if (user.getContractor() == null || user.getContractor().getId() == null) {
            throw new ResponseStatusException(FORBIDDEN, "No contractor profile is linked to this user");
        }
        return user.getContractor().getId();
    }

    private boolean isManagerOrAdmin(User user) {
        Role role = user.getRole();
        if (role == null || role.getCode() == null) {
            return false;
        }
        String code = role.getCode().toUpperCase();
        return "LINE_MANAGER".equals(code) || "ADMIN".equals(code);
    }

    private BigDecimal calculateTotalHours(Timesheet timesheet) {
        if (timesheet.getEntries() == null || timesheet.getEntries().isEmpty()) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        return timesheet.getEntries().stream()
                .map(entry -> entry.getHoursWorked() == null ? BigDecimal.ZERO : entry.getHoursWorked())
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }

    private String safeMoney(BigDecimal value) {
        BigDecimal safe = value == null ? BigDecimal.ZERO : value;
        return safe.setScale(2, RoundingMode.HALF_UP).toPlainString();
    }
}
