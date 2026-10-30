import { ImageResponse } from "next/og";

export const alt =
  "Angola em dados: indicadores do Banco Mundial e comparação com os países vizinhos";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const ANGOLA = "#0D3B66";
const OCRE = "#F2A900";
const INK = "#12202E";
const MUTED = "#4F6072";

// Linha decorativa (não representa dados reais).
const SHAPE = [38, 46, 42, 60, 56, 78, 70, 52, 64, 96, 86, 108, 94, 118];
const CHART_W = 1056;
const CHART_H = 150;
const PAD = 14;

function linePoints() {
  const max = Math.max(...SHAPE);
  const min = Math.min(...SHAPE);
  return SHAPE.map((value, index) => ({
    x: PAD + (index / (SHAPE.length - 1)) * (CHART_W - PAD * 2),
    y: CHART_H - PAD - ((value - min) / (max - min)) * (CHART_H - PAD * 2),
  }));
}

export default function OpengraphImage() {
  const points = linePoints();
  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");
  const last = points[points.length - 1];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#EEF1F4",
          color: INK,
          padding: "64px 72px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 30, color: MUTED }}>
            Indicadores públicos do Banco Mundial
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 128,
              lineHeight: 1.05,
              color: ANGOLA,
              marginTop: 14,
              whiteSpace: "nowrap",
            }}
          >
            Angola em dados
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 38,
              color: MUTED,
              marginTop: 14,
              whiteSpace: "nowrap",
            }}
          >
            Como evolui o país, e como se compara com os vizinhos.
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <svg
            width={CHART_W}
            height={CHART_H}
            viewBox={`0 0 ${CHART_W} ${CHART_H}`}
          >
            <line
              x1={PAD}
              y1={CHART_H - 2}
              x2={CHART_W - PAD}
              y2={CHART_H - 2}
              stroke="#CDD6DF"
              strokeWidth={2}
            />
            <path
              d={path}
              fill="none"
              stroke={ANGOLA}
              strokeWidth={6}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            <circle cx={last.x} cy={last.y} r={11} fill={OCRE} stroke={ANGOLA} strokeWidth={4} />
          </svg>
          <div
            style={{
              display: "flex",
              marginTop: 18,
              fontSize: 28,
              color: MUTED,
              whiteSpace: "nowrap",
            }}
          >
            PIB · Inflação · População · Desemprego · Eletricidade · Internet
          </div>
        </div>
      </div>
    ),
    size,
  );
}
