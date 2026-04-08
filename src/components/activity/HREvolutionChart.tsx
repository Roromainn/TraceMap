import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { VictoryLine, VictoryChart, VictoryAxis, VictoryArea } from 'victory-native';
import { colors } from '../../utils/colors';

interface HREvolutionChartProps {
  points: Array<{ heart_rate: number | null; timestamp: Date }>;
}

export function HREvolutionChart({ points }: HREvolutionChartProps) {
  // Filtrer les points avec FC valide
  const hrPoints = useMemo(
    () => points.filter((p): p is { heart_rate: number; timestamp: Date } => p.heart_rate !== null),
    [points]
  );

  // Down-sampling pour perf (max 200 points)
  const data = useMemo(() => {
    if (hrPoints.length === 0) return [];
    
    const step = Math.max(1, Math.floor(hrPoints.length / 200));
    return hrPoints
      .filter((_, i) => i % step === 0)
      .map((p, i) => ({
        x: i,
        y: p.heart_rate,
      }));
  }, [hrPoints]);

  if (hrPoints.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>💓</Text>
        <Text style={styles.emptyText}>Aucune donnée de fréquence cardiaque</Text>
      </View>
    );
  }

  const minHR = Math.min(...hrPoints.map((p) => p.heart_rate));
  const maxHR = Math.max(...hrPoints.map((p) => p.heart_rate));
  const avgHR = Math.round(hrPoints.reduce((s, p) => s + p.heart_rate, 0) / hrPoints.length);

  // Zones de couleur pour le gradient
  const getHRColor = (hr: number) => {
    const pct = hr / 200; // Assume max HR ~200
    if (pct < 0.6) return colors.hrZone1;
    if (pct < 0.7) return colors.hrZone2;
    if (pct < 0.8) return colors.hrZone3;
    if (pct < 0.9) return colors.hrZone4;
    return colors.hrZone5;
  };

  return (
    <View style={styles.container} testID="hr-evolution-chart">
      {/* Stats résumé */}
      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Min</Text>
          <Text style={[styles.statValue, { color: colors.hrZone2 }]}>{minHR}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Moy</Text>
          <Text style={[styles.statValue, { color: colors.hrZone3 }]}>{avgHR}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Max</Text>
          <Text style={[styles.statValue, { color: colors.hrZone5 }]}>{maxHR}</Text>
        </View>
      </View>

      <VictoryChart
        height={200}
        width={350}
        padding={{ top: 10, bottom: 35, left: 45, right: 15 }}
      >
        <VictoryAxis
          style={{
            axis: { stroke: colors.lightGray },
            tickLabels: { fill: 'transparent' },
          }}
        />
        <VictoryAxis
          dependentAxis
          tickFormat={(t: number) => `${t}`}
          style={{
            axis: { stroke: colors.lightGray },
            tickLabels: { fill: colors.darkGray, fontSize: 10 },
            grid: { stroke: colors.lightGray, strokeDasharray: '4,4' },
          }}
        />
        <VictoryArea
          data={data}
          style={{
            data: {
              fill: '#FB923C',
              fillOpacity: 0.2,
              stroke: colors.primary,
              strokeWidth: 2,
            },
          }}
          interpolation="natural"
        />
      </VictoryChart>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    paddingTop: 8,
    paddingBottom: 8,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  empty: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
});
