package com.timebank.timebank.transaction;

import com.timebank.timebank.transaction.dto.TimeTransactionResponse;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TimeTransactionService {

    private final TimeTransactionRepository timeTransactionRepository;

    public TimeTransactionService(TimeTransactionRepository timeTransactionRepository) {
        this.timeTransactionRepository = timeTransactionRepository;
    }

    public List<TimeTransactionResponse> getMyTransactions(String email) {
        return timeTransactionRepository.findByUserEmailOrderByCreatedAtDesc(email)
                .stream()
                .map(tx -> new TimeTransactionResponse(
                        tx.getId(),
                        tx.getType(),
                        tx.getMinutes(),
                        tx.getDescription(),
                        tx.getExchangeRequest() != null ? tx.getExchangeRequest().getId() : null,
                        tx.getCreatedAt()
                ))
                .toList();
    }
}