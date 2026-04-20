import React, { useEffect, useState } from "react";

const ERROR_IMG_SRC =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg==";

type Props = React.ImgHTMLAttributes<HTMLImageElement> & {
  /** Birincil URL başarısız olursa (429, uzun prompt vb.) tek seferlik alternatif src */
  fallbackSrc?: string | null;
};

export function ImageWithFallback(props: Props) {
  const [didError, setDidError] = useState(false);
  const [activeSrc, setActiveSrc] = useState(props.src);

  useEffect(() => {
    setActiveSrc(props.src);
    setDidError(false);
  }, [props.src]);

  const handleError = () => {
    if (props.fallbackSrc && activeSrc !== props.fallbackSrc) {
      setActiveSrc(props.fallbackSrc);
      return;
    }
    setDidError(true);
  };

  const { src, fallbackSrc, alt, style, className, ...rest } = props;

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
      src={activeSrc ?? src}
      alt={alt}
      className={className}
      style={style}
      {...rest}
      onError={handleError}
    />
  );
}
