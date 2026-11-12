import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import { PageLayout } from "../components/layout/PageLayout";
import type { PageType } from "../App";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import { completeCreditPurchase } from "../api/credits";
import { apiErrorDisplayMessage } from "../api/client";
import { SELECTED_PACKAGE_KEY } from "../data/creditPackages";
import { PATHS } from "../navigation/paths";
import { formatTemplate } from "../language";

interface PaymentReturnPageProps {
  onNavigate?: (page: PageType) => void;
}

type ReturnStatus = "loading" | "success" | "error";

export function PaymentReturnPage({ onNavigate }: PaymentReturnPageProps) {
  const { t } = useLanguage();
  const p = t.payment;
  const { token } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<ReturnStatus>("loading");
  const [resultHours, setResultHours] = useState(0);

  useEffect(() => {
    const sessionId = searchParams.get("sessionId");
    const paymentStatus = searchParams.get("status");

    // Oturum çerezle geri yüklendiğinde token null'dır; istek çerezle doğrulanır.
    if (!sessionId || paymentStatus !== "success") {
      setStatus("error");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const result = await completeCreditPurchase(sessionId, token);
        if (cancelled) return;
        localStorage.removeItem(SELECTED_PACKAGE_KEY);
        setResultHours(result.displayHours);
        setStatus("success");
      } catch (err) {
        if (cancelled) return;
        console.error(apiErrorDisplayMessage(err, p.failedMessage));
        setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams, token, p.failedMessage]);

  return (
    <PageLayout onNavigate={onNavigate}>
      <PaymentReturnContent
        status={status}
        resultHours={resultHours}
        p={p}
        onDashboard={() =>
          onNavigate ? onNavigate("dashboard") : navigate(PATHS.dashboard)
        }
        onRetry={() => navigate(PATHS.payment)}
      />
    </PageLayout>
  );
}

function PaymentReturnContent({
  status,
  resultHours,
  p,
  onDashboard,
  onRetry,
}: {
  status: ReturnStatus;
  resultHours: number;
  p: {
    processingTitle: string;
    successTitle: string;
    successMessage: string;
    failedTitle: string;
    failedMessage: string;
    backToDashboard: string;
    retry: string;
  };
  onDashboard: () => void;
  onRetry: () => void;
}) {
  return (
    <div className="max-w-lg mx-auto px-4 pt-32 pb-16">
      <Card className="rounded-2xl border-0 p-10 text-center shadow-lg">
        {status === "loading" && (
          <>
            <Loader2 className="mx-auto mb-6 h-16 w-16 animate-spin text-primary" />
            <h2 className="text-xl font-semibold">{p.processingTitle}</h2>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle className="mx-auto mb-6 h-16 w-16 text-green-500" />
            <h2 className="mb-3 text-2xl font-semibold">{p.successTitle}</h2>
            <p className="mb-8 text-muted-foreground">
              {formatTemplate(p.successMessage, { hours: resultHours })}
            </p>
            <Button
              className="w-full bg-gradient-to-r from-blue-500 to-blue-700 text-white"
              onClick={onDashboard}
            >
              {p.backToDashboard}
            </Button>
          </>
        )}
        {status === "error" && (
          <>
            <XCircle className="mx-auto mb-6 h-16 w-16 text-destructive" />
            <h2 className="mb-3 text-2xl font-semibold">{p.failedTitle}</h2>
            <p className="mb-8 text-muted-foreground">{p.failedMessage}</p>
            <Button className="w-full" onClick={onRetry}>
              {p.retry}
            </Button>
          </>
        )}
      </Card>
    </div>
  );
}
