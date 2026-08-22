"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";

export function SuccessConfetti() {
  useEffect(() => {
    const end = Date.now() + 1200;
    (function frame() {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 60,
        origin: { x: 0 },
        colors: ["#e55b3c", "#f07155", "#22a06b"],
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 60,
        origin: { x: 1 },
        colors: ["#e55b3c", "#f07155", "#22a06b"],
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  }, []);
  return null;
}
