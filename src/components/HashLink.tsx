"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function scrollToHash(hash: string) {
  const el = document.getElementById(hash);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    window.history.replaceState(null, "", `#${hash}`);
  }
}

export function HashLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const hashIdx = href.indexOf("#");
  const path = hashIdx >= 0 ? href.slice(0, hashIdx) || "/" : href;
  const hash = hashIdx >= 0 ? href.slice(hashIdx + 1) : "";

  function onClick(e: React.MouseEvent) {
    if (!hash) return;
    const onSamePage = path === pathname || (path === "/" && pathname === "/");
    if (onSamePage) {
      e.preventDefault();
      scrollToHash(hash);
    }
  }

  return (
    <Link href={href} onClick={onClick} className={className}>
      {children}
    </Link>
  );
}
