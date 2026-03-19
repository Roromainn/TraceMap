import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { VictoryBar, VictoryChart, VictoryAxis } from 'victory-native';
import { colors } from '../../utils/colors';

interface HRZonesChartProps {
  points: Array<{ heart_rate: number | null }>;
  maxHR?: number; // BPM max théorique (défaut 190)
}

// Zones de FC selon % de FC max
const HR_ZONES = [
  { zone: 1, label: 'Z1\n50-60%', color: colors.hrZone1, min: 0.50, max: 0.60 },
  { zone: 2, label: 'Z2\n60-70%', color: colors.hrZone2, min: 0.60, max: 0.70 },
  { zone: 3, label: 'Z3\n70-80%', color: colors.hrZone3, min: 0.70, max: 0.80 },
  { zone: 4, label: 'Z4\n80-90%', color: colors.hrZone4, min: 0.80, max: 0.90 },
  { zone: 5, label: 'Z5\n90%+',   color: colors.hrZone5, min: 0.90, max: 1.10 },
];

export function HRZonesChart({ points, maxHR = 190 }: HRZonesChartProps) {
  const hrPoints = useMemo(
    () => points.filter((p): p is { heart_rate: number } & typeof p => p.heart_rate !== null),
    [points]
  );

  const zoneData = useMemo(() => {
    return HR_ZONES.map((zone) => {
      const count = hrPoints.filter((p) => {
        const pct = p.heart_rate / maxHR;
        return pct >= zone.min && pct < zone.max;
      }).length;
      // Convertir en minutes (on suppose 1 point ≈ 1 seconde en moyenne)
      const minutes = Math.round(count / 60);
      return { x: zone.label, y: minutes, color: zone.color, zone: zone.zone };
    });
  }, [hrPoints, maxHR]);

  const totalMinutes = zoneData.reduce((s, d) => s + d.y, 0);

  if (hrPoints.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>💓</Text>
        <Text style={styles.emptyText}>Aucune donnée de fréquence cardiaque</Text>
        <Text style={styles.emptySubtext}>Importez un fichier GPX avec données FC (Garmin, Polar…)</Text>
      </View>
    );
  }

  return (
    <View style={styles.container} testID="hr-zones-chart">
      <View style={styles.summary}>
        <Text style={styles.summaryText}>
          FC moy. <Text style={styles.summaryValue}>
            {Math.round(hrPoints.reduce((s, p) => s + p.heart_rate, 0) / hrPoints.length)} bpm
          </Text>
        </Text>
      </View>

      <VictoryChart
        height={200}
        width={350}
        domainPadding={{ x: 20 }}
        padding={{ top: 10, bottom: 50, left: 45, right: 15 }}
      >
        <VictoryAxis
          style={{
            axis: { stroke: colors.lightGray },
            tickLabels: { fill: colors.darkGray, fontSize: 9 },
          }}
        />
        <VictoryAxis
          dependentAxis
          tickFormat={(t: number) => `${t}min`}
          style={{
            axis: { stroke: colors.lightGray },
            tickLabels: { fill: colors.darkGray, fontSize: 10 },
            grid: { stroke: colors.lightGray, strokeDasharray: '4,4' },
          }}
        />
        {zoneData.map((d) => (
          <VictoryBar
            key={d.zone}
            data={[d]}
            style={{ data: { fill: d.color, width: 30 } }}
            cornerRadius={{ top: 4 }}
          />
        ))}
      </VictoryChart>

      {/* Légende des zones */}
      <View style={styles.legend}>
        {HR_ZONES.map((z) => (
          <View key={z.zone} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: z.color }]} />
            <Text style={styles.legendLabel}>Z{z.zone}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    paddingTop: 8,
  },
  summary: {
    alignItems: 'center',
    marginBottom: 4,
  },
  summaryText: {
    fontSize: 13,
    color: colors.darkGray,
  },
  summaryValue: {
    fontWeight: '700',
    color: colors.hrZone4,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 24,
    paddingBottom: 12,
    marginTop: -8,
  },
  legendItem: {
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    fontSize: 10,
    color: colors.darkGray,
  },
  empty: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.darkGray,
    marginBottom: 4,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});
