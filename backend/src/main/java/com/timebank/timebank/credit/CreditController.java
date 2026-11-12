package com.timebank.timebank.credit;

import com.timebank.timebank.credit.dto.CreditCheckoutRequest;
import com.timebank.timebank.credit.dto.CreditCheckoutResponse;
import com.timebank.timebank.credit.dto.CreditPurchaseCompleteResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/credits")
public class CreditController {

    private final CreditPurchaseService creditPurchaseService;

    public CreditController(CreditPurchaseService creditPurchaseService) {
        this.creditPurchaseService = creditPurchaseService;
    }

    /** Satın alma ekranı açık mı (demo / kapalı). */
    @GetMapping("/availability")
    public ResponseEntity<com.timebank.timebank.credit.dto.CreditPurchaseAvailabilityResponse> availability() {
        return ResponseEntity.ok(creditPurchaseService.availability());
    }

    /** Ödeme oturumu başlat — harici banka/PSP URL'si veya demo mod bilgisi döner */
    @PostMapping("/checkout")
    public ResponseEntity<CreditCheckoutResponse> checkout(
            @Valid @RequestBody CreditCheckoutRequest req,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                creditPurchaseService.startCheckout(authentication.getName(), req.getPackageId())
        );
    }

    /** Ödeme tamamlandıktan sonra krediyi hesaba işle (demo veya return URL sonrası) */
    @PostMapping("/complete/{sessionId}")
    public ResponseEntity<CreditPurchaseCompleteResponse> complete(
            @PathVariable String sessionId,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                creditPurchaseService.completeCheckout(authentication.getName(), sessionId)
        );
    }
}
