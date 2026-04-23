package com.timebank.timebank.transaction;

import com.timebank.timebank.transaction.dto.TimeTransactionResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/transactions")
public class TimeTransactionController {

    private final TimeTransactionService timeTransactionService;

    public TimeTransactionController(TimeTransactionService timeTransactionService) {
        this.timeTransactionService = timeTransactionService;
    }

    @GetMapping("/mine")
    public ResponseEntity<List<TimeTransactionResponse>> getMyTransactions(Authentication authentication) {
        return ResponseEntity.ok(
                timeTransactionService.getMyTransactions(authentication.getName())
        );
    }
}