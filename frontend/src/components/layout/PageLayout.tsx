import type { ReactNode } from "react";
import type { PageType } from "../../App";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { cn } from "../ui/utils";

interface PageLayoutProps {
  children: ReactNode;
  onNavigate?: (page: PageType) => void;
  className?: string;
  /** Tam ekran sayfalar (mesajlar): alt footer gizlenir, içerik kalan yüksekliği doldurur */
  hideFooter?: boolean;
}

export function PageLayout({
  children,
  onNavigate,
  className,
  hideFooter = false,
}: PageLayoutProps) {
  return (
    <div
      className={cn(
        "flex flex-col bg-background text-foreground antialiased transition-colors",
        /* hideFooter: tam yükseklik sütunu; taşma yok — çocuklar flex + min-h-0 ile kalan yüksekliği alır */
        hideFooter
          ? "page-layout min-h-0 flex-1 overflow-hidden overscroll-none"
          : "min-h-dvh shrink-0",
        className,
      )}
    >
      <Navbar onNavigate={onNavigate} />
      <main
        className={cn(
          /* Footer'lı sayfalarda main içeriğe göre büyür (min-h-0 içeriği sıkıştırıp footer'ı üstüne bindiriyordu) */
          "flex w-full max-w-full flex-1 flex-col",
          /* pt-16: fixed navbar (h-16) — yükseklik düşümü yalnızca layout’ta; Messages içinde tekrarlanmaz */
          hideFooter &&
            "page-layout-main flex min-h-0 flex-1 flex-col overflow-hidden overscroll-none pt-16",
        )}
      >
        {children}
      </main>
      {!hideFooter ? <Footer /> : null}
    </div>
  );
}
