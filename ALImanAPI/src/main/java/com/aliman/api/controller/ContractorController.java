package com.aliman.api.controller;

import com.aliman.api.domain.Contractor;
import com.aliman.api.dto.ContractorRequest;
import com.aliman.api.service.ContractorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/contractors")
@RequiredArgsConstructor
public class ContractorController {
    private final ContractorService contractorService;

    @GetMapping
    public List<Contractor> list(@RequestParam(value = "q", required = false) String q,
                                 @RequestParam(value = "active", required = false) Boolean active) {
        return contractorService.list(q, active);
    }

    @PostMapping
    public Contractor create(@Valid @RequestBody ContractorRequest request) {
        return contractorService.create(request);
    }

    @PutMapping("/{id}")
    public Contractor update(@PathVariable Long id, @Valid @RequestBody ContractorRequest request) {
        return contractorService.update(id, request);
    }
}
