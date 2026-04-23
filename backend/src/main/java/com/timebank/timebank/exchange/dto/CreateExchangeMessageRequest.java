package com.timebank.timebank.exchange.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CreateExchangeMessageRequest {

    @NotBlank(message = "Mesaj boş olamaz")
    @Size(max = 2000, message = "Mesaj en fazla 2000 karakter olabilir")
    private String body;

    public String getBody() {
        return body;
    }

    public void setBody(String body) {
        this.body = body;
    }
}
