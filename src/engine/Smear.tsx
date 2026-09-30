import React from "react";

/** Horizontal motion smear: ghost copies trailing the motion (reference whip transition). */
export const Smear: React.FC<{ x: number; amount: number; children: React.ReactNode }> = ({
  x,
  amount,
  children,
}) => {
  const copies = amount > 0.03 ? 9 : 0;
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {Array.from({ length: copies }).map((_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            inset: 0,
            transform: `translateX(${x + (i + 1) * amount * 55}px) scaleX(${1 + amount * 0.25})`,
            opacity: amount * 0.16 * (1 - i / copies),
            filter: `blur(${3 + i * 1.5}px)`,
          }}
        >
          {children}
        </div>
      ))}
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `translateX(${x}px) scaleX(${1 + amount * 0.15})`,
          filter: amount > 0.03 ? `blur(${amount * 5}px)` : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
};
