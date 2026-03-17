"use client";

import { useMemo } from "react";

const FALLBACK_SECONDARY = "hsl(145, 100%, 47%)";
const FALLBACK_TERTIARY = "hsl(262, 81%, 65%)";
const FALLBACK_BORDER = "hsl(214.3, 32%, 91%)";

function getHslVar(name: string, fallback: string): string {
  if (typeof document === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim();
  if (!value) return fallback;
  return `hsl(${value})`;
}

/**
 * Resuelve las variables CSS del tema para usarlas en gráficos (Recharts).
 * Así los colores se aplican correctamente en SVG y se evitan barras/líneas blancas.
 */
export function useChartColors() {
  return useMemo(() => {
    return {
      secondary: getHslVar("secondary", FALLBACK_SECONDARY),
      tertiary: getHslVar("tertiary", FALLBACK_TERTIARY),
      chart1: getHslVar("chart-1", FALLBACK_SECONDARY),
      chart2: getHslVar("chart-2", FALLBACK_TERTIARY),
      chart3: getHslVar("chart-3", "hsl(175, 60%, 42%)"),
      chart4: getHslVar("chart-4", "hsl(35, 90%, 55%)"),
      chart5: getHslVar("chart-5", "hsl(320, 70%, 55%)"),
      border: getHslVar("border", FALLBACK_BORDER),
      chartHover: getHslVar("chart-hover", "hsl(222, 40%, 12%)"),
    };
  }, []);
}
