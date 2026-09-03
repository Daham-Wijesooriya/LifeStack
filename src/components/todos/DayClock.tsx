import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import { Text } from '@/components/ui';
import type { Todo } from '@/db/schema';
import { hhmmToMinutes, nowHHmm, todayISO } from '@/lib/date';
import { pickAccentColor, useAccentPalette } from '@/theme/accentPalette';
import { useTheme } from '@/theme/ThemeProvider';

export interface DayClockProps {
  dateISO: string;
  /** Already filtered to this date's timed todos (dueDate === dateISO && startTime && endTime). */
  todos: Todo[];
  size: number;
}

const MIN_ARC_MINUTES = 20;
const RING_STROKE = 26;
const TICK_HOURS = [0, 6, 12, 18];
const TICK_LABELS: Record<number, string> = { 0: '12AM', 6: '6AM', 12: '12PM', 18: '6PM' };
/** Thin gap (degrees) between adjacent wedges — flat-capped + separated reads as a donut/pie chart instead of a clock's progress ring. */
const WEDGE_PAD_DEG = 1.4;

type LaneEntry = { id: number; startMin: number; endMin: number };

/**
 * Greedy interval partitioning: tasks that overlap in time get pushed into
 * separate "lanes" instead of sharing the exact same arc — otherwise a newly
 * added task whose slot overlaps an existing one just draws on top of it and
 * the ring visually doesn't change. Lanes are rendered as concentric
 * sub-rings inside the same fixed ring band, so the clock's overall size
 * never grows — it just subdivides to fit whatever is scheduled.
 */
function assignLanes(entries: LaneEntry[]): { laneById: Map<number, number>; laneCount: number } {
  const sorted = [...entries].sort((a, b) => a.startMin - b.startMin);
  const laneEnds: number[] = [];
  const laneById = new Map<number, number>();
  for (const entry of sorted) {
    let lane = laneEnds.findIndex((end) => end <= entry.startMin);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(entry.endMin);
    } else {
      laneEnds[lane] = entry.endMin;
    }
    laneById.set(entry.id, lane);
  }
  return { laneById, laneCount: Math.max(1, laneEnds.length) };
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

/** SVG path for a ring segment between two clock angles — a thick stroked arc, which (with flat caps + a small gap either side) reads as a donut-chart wedge rather than a filled pie slice. */
function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const clampedEnd = Math.min(endAngle, startAngle + 359.9);
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, clampedEnd);
  const largeArcFlag = clampedEnd - startAngle <= 180 ? 0 : 1;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
}

function minutesToAngle(minutes: number): number {
  return (minutes / 1440) * 360;
}

/**
 * Read-only 24-hour clock face: today's timed todos render as colored arcs
 * around the ring (positioned + sized by start/end time), with a live marker
 * for the current time. Purely a glance-able overview — all interaction
 * (checking off, editing, adding) happens in the checklist rendered below it.
 */
export function DayClock({ dateISO, todos, size }: DayClockProps) {
  const { colors } = useTheme();
  const accentPalette = useAccentPalette();
  const isToday = dateISO === todayISO();
  const [nowMinutes, setNowMinutes] = useState(() => hhmmToMinutes(nowHHmm()));

  useEffect(() => {
    if (!isToday) return;
    const interval = setInterval(() => setNowMinutes(hhmmToMinutes(nowHHmm())), 60_000);
    return () => clearInterval(interval);
  }, [isToday]);

  const center = size / 2;
  const radius = size / 2 - 31;
  const ringOuterRadius = radius + RING_STROKE / 2;

  const laneInfo = useMemo(() => {
    const entries = todos.map((todo) => {
      const startMin = hhmmToMinutes(todo.startTime ?? '00:00');
      const endMin = Math.max(hhmmToMinutes(todo.endTime ?? '00:00'), startMin + MIN_ARC_MINUTES);
      return { id: todo.id, startMin, endMin };
    });
    return assignLanes(entries);
  }, [todos]);

  const scheduledCount = todos.length;
  const doneCount = todos.filter((t) => t.completed).length;

  return (
    <View style={{ width: size, height: size }}>
      {/* Soft circular backdrop — lifts the donut off the screen background like a card instead of floating as a bare outline. */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: center - ringOuterRadius,
          top: center - ringOuterRadius,
          width: ringOuterRadius * 2,
          height: ringOuterRadius * 2,
          borderRadius: ringOuterRadius,
          backgroundColor: colors.surface,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.12,
          shadowRadius: 12,
          elevation: 4,
        }}
      />

      <Svg width={size} height={size}>
        {/* Background track — the donut's empty-time base, wedges lay on top */}
        <Circle cx={center} cy={center} r={radius} stroke={colors.border} strokeWidth={RING_STROKE} fill="none" />

        {/* Todo wedges — each task gets its own stable accent color; overlapping tasks split into concentric sub-rings so adding one never just hides another */}
        {todos.map((todo) => {
          const color = pickAccentColor(todo.id, accentPalette);
          const startMin = hhmmToMinutes(todo.startTime ?? '00:00');
          const endMin = Math.max(hhmmToMinutes(todo.endTime ?? '00:00'), startMin + MIN_ARC_MINUTES);
          const lane = laneInfo.laneById.get(todo.id) ?? 0;
          const laneThickness = RING_STROKE / laneInfo.laneCount;
          const laneRadius = radius - RING_STROKE / 2 + laneThickness * (lane + 0.5);
          const laneStrokeWidth = laneInfo.laneCount > 1 ? Math.max(3, laneThickness - 2) : RING_STROKE;
          const startAngle = minutesToAngle(startMin);
          const endAngle = minutesToAngle(endMin);
          const pad = Math.min(WEDGE_PAD_DEG, (endAngle - startAngle) / 4);
          const path = describeArc(center, center, laneRadius, startAngle + pad, endAngle - pad);
          return (
            <Path
              key={todo.id}
              d={path}
              stroke={color}
              strokeWidth={laneStrokeWidth}
              strokeLinecap="butt"
              fill="none"
              opacity={todo.completed ? 0.35 : 0.95}
            />
          );
        })}

        {/* Live "now" marker — a translucent hand from the center pivot out to the ring, so it points at the current time without sitting on top of a wedge like a solid dot would */}
        {isToday
          ? (() => {
              const angle = minutesToAngle(nowMinutes);
              const tail = polarToCartesian(center, center, 12, angle);
              const tip = polarToCartesian(center, center, ringOuterRadius, angle);
              return (
                <>
                  <Line
                    x1={tail.x}
                    y1={tail.y}
                    x2={tip.x}
                    y2={tip.y}
                    stroke={colors.danger}
                    strokeWidth={2}
                    strokeLinecap="round"
                    opacity={0.45}
                  />
                  <Circle cx={center} cy={center} r={4} fill={colors.danger} opacity={0.45} />
                </>
              );
            })()
          : null}
      </Svg>

      {/* Hour labels, positioned outside the ring */}
      {TICK_HOURS.map((hour) => {
        const pos = polarToCartesian(center, center, radius + RING_STROKE / 2 + 16, hour * 15);
        return (
          <Text
            key={hour}
            variant="xs"
            color="muted"
            weight="medium"
            style={{
              position: 'absolute',
              left: pos.x - 16,
              top: pos.y - 7,
              width: 32,
              textAlign: 'center',
              fontSize: 10,
              letterSpacing: 0.4,
              opacity: 0.75,
            }}
          >
            {TICK_LABELS[hour]}
          </Text>
        );
      })}

      {/* Center summary */}
      <View pointerEvents="none" className="absolute inset-0 items-center justify-center">
        {scheduledCount > 0 ? (
          <>
            <Text variant="2xl" weight="bold" style={{ fontVariant: ['tabular-nums'] }}>
              {doneCount}/{scheduledCount}
            </Text>
            <Text
              variant="xs"
              color="secondary"
              weight="medium"
              style={{ textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 }}
            >
              scheduled done
            </Text>
          </>
        ) : (
          <Text variant="sm" color="muted" className="px-lg text-center">
            Nothing scheduled
          </Text>
        )}
      </View>
    </View>
  );
}
