import React, { useState } from "react";

const ERROR_IMG_SRC =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg==";

type Props = React.ImgHTMLAttributes<HTMLImageElement> & {
  /** Birincil URL başarısız olursa (429, uzun prompt vb.) tek seferlik alternatif src */
  fallbackSrc?: string | null;
  /** Tüm kaynaklar başarısız olunca gösterilecek öğe (varsayılan: genel görsel ikonu) */
  errorFallback?: React.ReactNode;
};

export function ImageWithFallback(props: Props) {
  const [erroredSourceKey, setErroredSourceKey] = useState<string | null>(null);
  const sourceKey = `${props.src ?? ""}|${props.fallbackSrc ?? ""}`;
  const didError = erroredSourceKey === sourceKey;

  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    if (props.fallbackSrc && e.currentTarget.dataset.fallbackApplied !== "1") {
      e.currentTarget.dataset.fallbackApplied = "1";
      e.currentTarget.src = props.fallbackSrc;
      return;
    }
    setErroredSourceKey(sourceKey);
  };

  const { src, alt, style, className, errorFallback, fallbackSrc: _fallbackSrc, ...rest } = props;
  void _fallbackSrc;

  if (didError && errorFallback) {
    return <>{errorFallback}</>;
  }

  return didError ? (
    <div
      className={`inline-block bg-muted text-center align-middle text-muted-foreground ${className ?? ""}`}
      style={style}
    >
      <div className="flex items-center justify-center w-full h-full">
        <img src={ERROR_IMG_SRC} alt="Error loading image" {...rest} data-original-url={src} />
      </div>
    </div>
  ) : (
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      {...rest}
      onError={handleError}
    />
  );
}
