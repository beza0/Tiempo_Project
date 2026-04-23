package com.timebank.timebank.exchange.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public class CreateExchangeRequestRequest {

    @NotBlank(message = "Mesaj boş olamaz")
    @Size(max = 1000, message = "Mesaj en fazla 1000 karakter olabilir")
    private String message;

    /** Rezervasyon süresi (dakika). Örn. 1 saat = 60. Oturum başına süre ile uyumlu olmalı. */
    @Min(value = 30, message = "Süre en az 30 dakika olmalı")
    @Max(value = 14400, message = "Süre en fazla 240 saat olabilir")
    private int bookedMinutes;

    /** Oturum başlangıç zamanı (ISO-8601 UTC veya offset). */
    @NotNull(message = "Oturum tarihi ve saati zorunludur")
    private Instant scheduledStartAt;

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public int getBookedMinutes() {
        return bookedMinutes;
    }

    public void setBookedMinutes(int bookedMinutes) {
        this.bookedMinutes = bookedMinutes;
    }

    public Instant getScheduledStartAt() {
        return scheduledStartAt;
    }

    public void setScheduledStartAt(Instant scheduledStartAt) {
        this.scheduledStartAt = scheduledStartAt;
    }
}