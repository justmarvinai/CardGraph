import Konva from 'konva';
import type { ChartNode } from '@/lib/types';
import { catmullRomPath, niceScale, type Point } from '@/lib/math';
import { formatTick, monthShort, parseDate } from '@/lib/format';
import { withAlpha } from '@/lib/palette';
import { fontStack } from '../fonts';
import type { RenderContext } from '../context';

let labelProbe: Konva.Text | null = null;

function measureAxisLabel(text: string, family: string, size: number): number {
  if (!text) return 0;
  if (!labelProbe) labelProbe = new Konva.Text({});
  labelProbe.setAttrs({ text, fontFamily: fontStack(family), fontSize: size, fontStyle: '700' });
  return labelProbe.getTextWidth();
}

/** Direction of the series — drives the automatic curve colour. */
export function chartTrend(node: ChartNode): 'up' | 'down' | 'flat' {
  if (node.rows.length < 2) return 'flat';
  const first = node.rows[0].value;
  const last = node.rows[node.rows.length - 1].value;
  if (last > first) return 'up';
  if (last < first) return 'down';
  return 'flat';
}

export function chartStroke(node: ChartNode, ctx: RenderContext): string {
  if (node.strokeMode === 'custom') return node.stroke;
  const trend = chartTrend(node);
  if (trend === 'down') return ctx.palette.negative;
  if (trend === 'up') return ctx.palette.positive;
  return ctx.palette.accent;
}

interface Plot {
  left: number;
  top: number;
  width: number;
  height: number;
}

function plotArea(node: ChartNode): Plot {
  const left = node.width * node.padding.left;
  const right = node.width * node.padding.right;
  const top = node.height * node.padding.top;
  const bottom = node.height * node.padding.bottom;
  return {
    left,
    top,
    width: Math.max(1, node.width - left - right),
    height: Math.max(1, node.height - top - bottom),
  };
}

/**
 * X labels follow the reference graphics: a date series shows day numbers and
 * swaps in the month abbreviation whenever the month changes; anything else is
 * printed verbatim. Labels that would collide are dropped.
 */
function xLabels(node: ChartNode): { text: string; bold: boolean }[] {
  const parsed = node.rows.map((r) => parseDate(r.label));
  const allDates = parsed.every(Boolean) && node.rows.length > 0;
  if (!allDates) return node.rows.map((r) => ({ text: r.label.toUpperCase(), bold: false }));

  const monthsSeen = new Set<number>();
  return parsed.map((d, i) => {
    const date = d!;
    const month = date.getMonth();
    const isNewMonth = !monthsSeen.has(month);
    monthsSeen.add(month);
    // A long series is labelled by month only, a short one by day.
    if (node.rows.length > 14) {
      return { text: isNewMonth ? monthShort(month) : '', bold: isNewMonth };
    }
    if (isNewMonth || i === 0) return { text: monthShort(month), bold: true };
    return { text: String(date.getDate()), bold: false };
  });
}

export function renderChart(node: ChartNode, ctx: RenderContext): Konva.Group {
  const group = new Konva.Group({
    id: node.id,
    x: node.x,
    y: node.y,
    rotation: node.rotation,
    opacity: node.opacity,
    listening: !node.locked,
  });

  if (node.showPanel) {
    group.add(
      new Konva.Rect({
        width: node.width,
        height: node.height,
        cornerRadius: node.panelRadius,
        fill: withAlpha(node.panelFill, node.panelOpacity),
      }),
    );
  }

  const plot = plotArea(node);
  const values = node.rows.map((r) => r.value);
  const scale = niceScale(
    values.length ? Math.min(...values) : 0,
    values.length ? Math.max(...values) : 1,
    node.tickCount,
  );
  const toY = (value: number) =>
    plot.top + plot.height - ((value - scale.min) / (scale.max - scale.min)) * plot.height;

  if (node.showGrid) {
    for (const tick of scale.ticks) {
      group.add(
        new Konva.Line({
          points: [plot.left, toY(tick), plot.left + plot.width, toY(tick)],
          stroke: withAlpha(node.gridColor, 0.12),
          strokeWidth: 1,
          listening: false,
        }),
      );
    }
  }

  if (node.showYAxis) {
    for (const tick of scale.ticks) {
      group.add(
        new Konva.Text({
          text: formatTick(tick, ctx.formatting),
          x: 0,
          y: toY(tick) - node.axisFontSize * 0.62,
          width: plot.left - node.width * 0.02,
          align: 'right',
          fontFamily: fontStack(node.axisFontFamily),
          fontSize: node.axisFontSize,
          fill: node.axisColor,
          listening: false,
        }),
      );
    }
  }

  const points: Point[] = node.rows.map((row, i) => ({
    x: plot.left + (node.rows.length === 1 ? plot.width / 2 : (i / (node.rows.length - 1)) * plot.width),
    y: toY(row.value),
  }));

  if (node.showXAxis && points.length) {
    const labels = xLabels(node);
    // Thin the labels on an even stride rather than greedily: dropping every
    // second one reads as a rhythm, dropping them as they happen to collide
    // reads as a mistake.
    const widest = labels.reduce(
      (max, label) =>
        Math.max(max, measureAxisLabel(label.text, node.axisFontFamily, node.axisFontSize)),
      0,
    );
    const spacing = points.length > 1 ? points[1].x - points[0].x : plot.width;
    const stride = Math.max(1, Math.ceil((widest * 1.2) / Math.max(1, spacing)));
    labels.forEach((label, i) => {
      if (!label.text) return;
      if (i % stride !== 0 && i !== labels.length - 1) return;
      // Never let the kept last label sit on top of its neighbour.
      if (i === labels.length - 1 && i % stride !== 0 && (i - (i % stride)) === i - 1) return;
      const x = points[i].x;
      const box = node.axisFontSize * 3;
      group.add(
        new Konva.Text({
          text: label.text,
          x: x - box / 2,
          y: plot.top + plot.height + node.height * 0.035,
          width: box,
          align: 'center',
          fontFamily: fontStack(node.axisFontFamily),
          fontSize: node.axisFontSize,
          fontStyle: label.bold ? '700' : '400',
          fill: node.axisColor,
          listening: false,
        }),
      );
    });
  }

  if (points.length >= 2) {
    const stroke = chartStroke(node, ctx);
    const data = node.smooth
      ? catmullRomPath(points)
      : `M ${points.map((p) => `${p.x} ${p.y}`).join(' L ')}`;

    if (node.glow > 0) {
      group.add(
        new Konva.Path({
          data,
          stroke,
          strokeWidth: node.strokeWidth,
          lineCap: 'round',
          lineJoin: 'round',
          opacity: 0.55,
          shadowColor: stroke,
          shadowBlur: node.glow,
          shadowOpacity: 1,
          listening: false,
        }),
      );
    }

    group.add(
      new Konva.Path({
        data,
        stroke,
        strokeWidth: node.strokeWidth,
        lineCap: 'round',
        lineJoin: 'round',
        listening: false,
      }),
    );
  }

  // Keeps the whole node clickable in the editor even where nothing is drawn.
  group.add(
    new Konva.Rect({ width: node.width, height: node.height, fill: 'transparent' }),
  );

  return group;
}
