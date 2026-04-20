package com.timebank.timebank.common;

/**
 * Hesap var ancak e-posta doğrulanmamış — giriş reddedilir.
 */
public class EmailVerificationRequiredException extends RuntimeException {

    public EmailVerificationRequiredException() {
        super("E-posta adresiniz henüz doğrulanmadı. Gelen kutunuzu kontrol edin veya doğrulama e-postasını yeniden isteyin.");
    }
}
