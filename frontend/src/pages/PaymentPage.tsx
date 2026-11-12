import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Check,
  CheckCircle,
  Info,
  Loader2,
  XCircle,
} from "lucide-react";
import { PageLayout } from "../components/layout/PageLayout";
import type { PageType } from "../App";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import { formatTemplate } from "../language";
import {
  completeCreditPurchase,
  fetchCreditPurchaseAvailability,
  startCreditCheckout,
} from "../api/credits";
import { apiErrorDisplayMessage } from "../api/client";
import {
  SELECTED_PACKAGE_KEY,
  type CreditPackage,
} from "../data/creditPackages";
import "../styles/payment.css";

interface PaymentPageProps {
  onNavigate?: (page: PageType) => void;
}

type PaymentStatus = "form" | "processing" | "success" | "error";

type PaymentLocale = typeof import("../language/locale/tr").tr.payment;

export function PaymentPage({ onNavigate }: PaymentPageProps) {
  const { t } = useLanguage();
  const p = t.payment;
  const { token, isAuthenticated } = useAuth();
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(
    null,
  );
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("form");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resultHours, setResultHours] = useState(0);
  const [resultAmount, setResultAmount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let pkg: CreditPackage | null = null;
    try {
      const raw = localStorage.getItem(SELECTED_PACKAGE_KEY);
      if (raw) pkg = JSON.parse(raw) as CreditPackage;
    } catch {
      /* ignore */
    }
    if (!pkg) {
      onNavigate?.("buy-credits");
      return;
    }
    // Satın alma kapalıysa (gerçek ödeme altyapısı yok) paket ekranına dön: orada açıklama gösterilir.
    void fetchCreditPurchaseAvailability(token)
      .then((a) => {
        if (cancelled) return;
        if (!a.purchaseEnabled) {
          onNavigate?.("buy-credits");
          return;
        }
        setSelectedPackage(pkg);
      })
      .catch(() => {
        if (!cancelled) onNavigate?.("buy-credits");
      });
    return () => {
      cancelled = true;
    };
  }, [onNavigate, token]);

  /**
   * Yalnızca demo mod: sunucu ödeme almadan kredi ekler. Gerçek ödeme altyapısı bağlandığında
   * kart bilgisi bu sayfada değil, ödeme sağlayıcısının sayfasında girilir. Önceden burada
   * hiçbir yere gönderilmeyen bir kart formu ve %10 rastgele "hata" vardı.
   */
  const confirmDemoPurchase = async () => {
    if (!selectedPackage || !isAuthenticated) return;
    setErrorMessage(null);
    setPaymentStatus("processing");
    try {
      const session = await startCreditCheckout(selectedPackage.id, token);
      const result = await completeCreditPurchase(session.sessionId, token);
      try {
        localStorage.removeItem(SELECTED_PACKAGE_KEY);
      } catch {
        /* ignore */
      }
      setResultHours(result.displayHours);
      setResultAmount(result.amountTry);
      setPaymentStatus("success");
    } catch (err) {
      setErrorMessage(apiErrorDisplayMessage(err, p.failedMessage));
      setPaymentStatus("error");
    }
  };

  const handleRetry = () => {
    setPaymentStatus("form");
    setErrorMessage(null);
  };

  if (!selectedPackage) {
    return <PaymentPageLoading />;
  }

  const features =
    p.packageFeatures?.[
      selectedPackage.id as keyof typeof p.packageFeatures
    ] ?? [];

  return (
    <PageLayout onNavigate={onNavigate} className="payment-page">
      <div className="payment-page__wrap">
        {paymentStatus !== "success" && (
          <PaymentPageHeader p={p} onBack={() => onNavigate?.("buy-credits")} />
        )}

        {paymentStatus === "form" && (
          <div className="payment-page__grid">
            <div className="payment-card">
              <span className="payment-badge payment-badge--secure">
                <Info className="h-3.5 w-3.5" aria-hidden />
                {p.demoBadge}
              </span>
              <p className="payment-form__footer-note" style={{ textAlign: "left" }}>
                {p.demoNotice}
              </p>
              <button
                type="button"
                className="payment-form__submit"
                disabled={!isAuthenticated}
                onClick={() => void confirmDemoPurchase()}
              >
                {formatTemplate(p.demoConfirm, {
                  hours: selectedPackage.hours,
                })}
              </button>
              {!isAuthenticated && (
                <p className="payment-form__footer-note text-red-600">
                  {p.authRequired}
                </p>
              )}
            </div>
            <OrderSummary p={p} pkg={selectedPackage} features={features} />
          </div>
        )}

        {paymentStatus === "processing" && <ProcessingStatus p={p} />}

        {paymentStatus === "success" && (
          <SuccessStatus
            p={p}
            hours={resultHours}
            amount={resultAmount}
            onDashboard={() => onNavigate?.("dashboard")}
          />
        )}

        {paymentStatus === "error" && (
          <PaymentErrorLayout
            p={p}
            pkg={selectedPackage}
            features={features}
            message={errorMessage ?? p.failedMessage}
            onRetry={handleRetry}
            onBack={() => onNavigate?.("buy-credits")}
          />
        )}
      </div>
    </PageLayout>
  );
}

function PaymentPageLoading() {
  return (
    <div className="payment-page__loading" role="status" aria-live="polite">
      <Loader2 className="payment-page__loading-icon" />
    </div>
  );
}

function PaymentPageHeader({
  p,
  onBack,
}: {
  p: Pick<PaymentLocale, "back" | "title" | "subtitle">;
  onBack: () => void;
}) {
  return (
    <header className="payment-page__header">
      <button type="button" className="payment-page__back" onClick={onBack}>
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {p.back}
      </button>
      <h1 className="payment-page__title">{p.title}</h1>
      <p className="payment-page__subtitle">{p.subtitle}</p>
    </header>
  );
}

function OrderSummary({
  p,
  pkg,
  features,
}: {
  p: PaymentLocale;
  pkg: CreditPackage;
  features: string[];
}) {
  const discountAmount = pkg.originalPrice - pkg.discountedPrice;

  return (
    <div className="payment-card">
      <h2 className="payment-summary__title">{p.orderSummary}</h2>

      <div className="payment-summary__row">
        <span>{p.packageLabel}</span>
        <span className="payment-summary__value">
          {pkg.hours} {p.hourUnit}
        </span>
      </div>

      {pkg.discount > 0 && (
        <>
          <div className="payment-summary__divider" />
          <DiscountSummaryRows
            p={p}
            pkg={pkg}
            discountAmount={discountAmount}
          />
        </>
      )}

      <div className="payment-summary__divider" />

      <div className="payment-summary__total">
        <span>{p.total}</span>
        <span className="payment-summary__total-price">
          {pkg.discountedPrice} ₺
        </span>
      </div>

      <div className="payment-summary__divider" />

      <h3 className="payment-summary__features-title">{p.includedTitle}</h3>
      <ul className="payment-summary__features">
        {features.map((feature, i) => (
          <li key={i} className="payment-summary__feature">
            <Check className="payment-summary__check" strokeWidth={2.5} />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DiscountSummaryRows({
  p,
  pkg,
  discountAmount,
}: {
  p: PaymentLocale;
  pkg: CreditPackage;
  discountAmount: number;
}) {
  return (
    <>
      <div className="payment-summary__row payment-summary__row--old">
        <span>{p.listPrice}</span>
        <span className="payment-summary__value">{pkg.originalPrice} ₺</span>
      </div>
      <div className="payment-summary__row payment-summary__row--discount">
        <span>{p.discountLabel}</span>
        <span className="payment-summary__value">-{discountAmount} ₺</span>
      </div>
    </>
  );
}

function ProcessingStatus({
  p,
}: {
  p: Pick<PaymentLocale, "processingTitle" | "processingMessage">;
}) {
  return (
    <div className="payment-card payment-status">
      <div className="payment-status__icon-wrap">
        <Loader2 className="payment-status__icon payment-status__icon--spin" />
      </div>
      <h2 className="payment-status__title">{p.processingTitle}</h2>
      <p className="payment-status__message">{p.processingMessage}</p>
      <div className="payment-status__bar">
        <div className="payment-status__bar-fill" />
      </div>
    </div>
  );
}

function SuccessStatus({
  p,
  hours,
  amount,
  onDashboard,
}: {
  p: Pick<
    PaymentLocale,
    | "successTitle"
    | "successMessage"
    | "amountLabel"
    | "creditLabel"
    | "hourUnit"
    | "backToDashboard"
  >;
  hours: number;
  amount: number;
  onDashboard: () => void;
}) {
  return (
    <div className="payment-card payment-status">
      <div className="payment-status__icon-wrap">
        <CheckCircle className="payment-status__icon text-green-500" />
      </div>
      <h2 className="payment-status__title">{p.successTitle}</h2>
      <p className="payment-status__message">
        {formatTemplate(p.successMessage, { hours })}
      </p>
      <div className="payment-status__details">
        <div className="payment-status__detail-row">
          <span>{p.amountLabel}</span>
          <strong>{amount} ₺</strong>
        </div>
        <div className="payment-status__detail-row">
          <span>{p.creditLabel}</span>
          <strong>
            {hours} {p.hourUnit}
          </strong>
        </div>
      </div>
      <button
        type="button"
        className="payment-status__btn payment-status__btn--success"
        onClick={onDashboard}
      >
        {p.backToDashboard}
      </button>
    </div>
  );
}

function PaymentErrorLayout({
  p,
  pkg,
  features,
  message,
  onRetry,
  onBack,
}: {
  p: PaymentLocale;
  pkg: CreditPackage;
  features: string[];
  message: string;
  onRetry: () => void;
  onBack: () => void;
}) {
  return (
    <div className="payment-page__grid">
      <ErrorPanel p={p} message={message} onRetry={onRetry} onBack={onBack} />
      <OrderSummary p={p} pkg={pkg} features={features} />
    </div>
  );
}

function ErrorPanel({
  p,
  message,
  onRetry,
  onBack,
}: {
  p: PaymentLocale;
  message: string;
  onRetry: () => void;
  onBack: () => void;
}) {
  return (
    <div className="payment-card">
      <span className="payment-badge payment-badge--failed">
        <XCircle className="h-3.5 w-3.5" aria-hidden />
        {p.failedBadge}
      </span>

      <div style={{ textAlign: "left" }}>
        <div
          className="payment-status__icon-wrap"
          style={{ justifyContent: "flex-start" }}
        >
          <XCircle className="payment-status__icon text-red-500" />
        </div>
        <h2 className="payment-status__title">{p.failedTitle}</h2>
        <p className="payment-status__message">{message}</p>

        <div className="payment-status__reasons">
          <p className="payment-status__reasons-title">{p.failureReasonsTitle}</p>
          <ul>
            {p.failureReasons.map((reason, i) => (
              <li key={i}>{reason}</li>
            ))}
          </ul>
        </div>

        <div className="payment-status__actions payment-status__actions--row">
          <button
            type="button"
            className="payment-status__btn payment-status__btn--primary"
            onClick={onRetry}
          >
            {p.retry}
          </button>
          <button
            type="button"
            className="payment-status__btn payment-status__btn--outline"
            onClick={onBack}
          >
            {p.backToPackages}
          </button>
        </div>
      </div>
    </div>
  );
}
