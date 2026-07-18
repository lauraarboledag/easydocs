import { useState, useEffect } from "react";

export default function AnalogClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const hours = time.getHours();
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();

  const secondDeg = seconds * 6;
  const minuteDeg = minutes * 6 + seconds * 0.1;
  const hourDeg = (hours % 12) * 30 + minutes * 0.5;

  const cx = 60;
  const cy = 60;
  const r = 54;

  const dateStr = time.toLocaleDateString("es-CO", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });

  const timeStr = time.toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Puntos de las horas
  const hourDots = Array.from({ length: 12 }, (_, i) => {
    const angle = (i * 30 - 90) * (Math.PI / 180);
    const dotR = i % 3 === 0 ? 3.5 : 2;
    const dist = i % 3 === 0 ? 46 : 47;
    return {
      x: cx + dist * Math.cos(angle),
      y: cy + dist * Math.sin(angle),
      r: dotR,
      major: i % 3 === 0,
    };
  });

  // Función para calcular punta de manecilla
  const handPoint = (deg, length) => {
    const angle = (deg - 90) * (Math.PI / 180);
    return {
      x: cx + length * Math.cos(angle),
      y: cy + length * Math.sin(angle),
    };
  };

  const hourTip = handPoint(hourDeg, 28);
  const minuteTip = handPoint(minuteDeg, 38);
  const secondTip = handPoint(secondDeg, 42);
  const secondTail = handPoint(secondDeg + 180, 10);

  return (
    <div
      className="rounded-xl border p-5"
      style={{
        backgroundColor: "var(--bg-secondary)",
        borderColor: "var(--border-color)",
      }}
    >
      <p
        className="font-semibold text-sm mb-4"
        style={{ color: "var(--text-primary)" }}
      >
        Hora actual
      </p>

      <div className="flex items-center gap-5">
        {/* SVG Reloj */}
        <svg width="120" height="120" viewBox="0 0 120 120">
          {/* Círculo exterior */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="var(--bg-primary)"
            stroke="var(--border-color)"
            strokeWidth="2"
          />

          {/* Puntos de horas */}
          {hourDots.map((dot, i) => (
            <circle
              key={i}
              cx={dot.x}
              cy={dot.y}
              r={dot.r}
              fill={
                dot.major ? "var(--color-primary)" : "var(--text-secondary)"
              }
              opacity={dot.major ? 1 : 0.4}
            />
          ))}

          {/* Manecilla horas */}
          <line
            x1={cx}
            y1={cy}
            x2={hourTip.x}
            y2={hourTip.y}
            stroke="var(--text-primary)"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* Manecilla minutos */}
          <line
            x1={cx}
            y1={cy}
            x2={minuteTip.x}
            y2={minuteTip.y}
            stroke="var(--text-primary)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Manecilla segundos */}
          <line
            x1={secondTail.x}
            y1={secondTail.y}
            x2={secondTip.x}
            y2={secondTip.y}
            stroke="var(--color-primary)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />

          {/* Centro */}
          <circle cx={cx} cy={cy} r={3} fill="var(--color-primary)" />
          <circle cx={cx} cy={cy} r={1.5} fill="var(--bg-secondary)" />
        </svg>

        {/* Info digital */}
        <div>
          <p
            className="text-2xl font-bold font-mono tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            {timeStr}
          </p>
          <p
            className="text-xs mt-1 capitalize"
            style={{ color: "var(--text-secondary)" }}
          >
            {dateStr}
          </p>
        </div>
      </div>
    </div>
  );
}
