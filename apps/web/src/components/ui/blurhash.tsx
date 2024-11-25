import { useEffect, useState } from "react";

import { decode } from "blurhash";

interface BlurhashProps {
  hash: string;
  width?: number;
  height?: number;
  punch?: number;
  className?: string;
}

export function Blurhash({
  hash,
  width = 32,
  height = 32,
  punch = 1,
  className,
}: BlurhashProps) {
  const [url, setUrl] = useState<string>();
  console.log(hash);

  useEffect(() => {
    let isMounted = true;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const pixels = decode(hash, width, height, punch);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const imageData = ctx.createImageData(width, height);
    imageData.data.set(pixels);
    ctx.putImageData(imageData, 0, 0);

    if (isMounted) {
      setUrl(canvas.toDataURL());
    }

    return () => {
      isMounted = false;
    };
  }, [hash, width, height, punch]);

  if (!hash) return null;

  return url ? (
    <div
      className={className}
      style={{
        backgroundImage: `url(${url})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    />
  ) : null;
}
