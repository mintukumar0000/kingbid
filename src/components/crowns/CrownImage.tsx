import Image from "next/image";

const SIZES = {
  xs: 22,
  sm: 32,
  md: 44,
  lg: 64,
  xl: 88,
  hero: 112,
} as const;

export type CrownImageSize = keyof typeof SIZES;

export function CrownImage({
  size = "md",
  className = "",
  float = false,
  glow = false,
}: {
  size?: CrownImageSize;
  className?: string;
  float?: boolean;
  glow?: boolean;
}) {
  const px = SIZES[size];

  return (
    <span
      className={[
        "kingdom-crown-wrap",
        float && "kingdom-crown-float",
        glow && "kingdom-crown-glow",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <Image
        src="/crown-gold.png"
        alt=""
        width={px}
        height={px}
        className="kingdom-crown-img"
        aria-hidden
        priority={size === "hero" || size === "xl"}
      />
    </span>
  );
}
