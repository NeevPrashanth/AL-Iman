package com.aliman.api.controller;

import com.aliman.api.domain.Event;
import com.aliman.api.dto.EventRequest;
import com.aliman.api.service.EventService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class EventController {
    private final EventService eventService;

    @GetMapping
    public List<Event> list() {
        return eventService.list();
    }

    @PostMapping
    public Event create(@Valid @RequestBody EventRequest request, @RequestHeader("X-User-Id") Long userId) {
        return eventService.create(request, userId);
    }
}
