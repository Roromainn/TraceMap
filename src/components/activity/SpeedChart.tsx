import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { VictoryLine, VictoryChart, VictoryAxis, VictoryArea } from 'victory-native';
import { colors } from '../../utils/colors';
import { useSettingsStore } from '../../stores/settingsStore';
import { speedToUnit, formatSpeed, SPEED_UNIT_LABELS } from '../../utils/units';

interface SpeedChartProps {
  points: Array<{ speed_ms: number; timestamp: Date }>;
}

export function SpeedChart({ points }: SpeedChartProps) {
  const { speedUnit } = useSettingsStore();

  const data = useMemo(() => {
    const step = Math.max(1, Math.floor(points.length / 200));
    return points
      .filter((_, i) => i % step === 0)
      .map((p, i) => ({
        x: i,
        // Convertir selon l'unité choisie, cap à valeurs raisonnables
        y: Math.min(speedToUnit(Math.min(p.speed_ms, 20), speedUnit), 60),
      }));
  }, [points, speedUnit]);

  const validData = data.filter((d) => d.y > 0);
  const maxVal = validData.length > 0 ? Math.max(...validData.map((d) => d.y)) : 0;
  const avgVal = validData.length > 0
    ? validData.reduce((s, d) => s + d.y, 0) / validData.length
    : 0;

  if (maxVal === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Aucune donnée de vitesse</Text>
      </View>
    );
  }

  return (
    <View style={styles.container} testID="speed-chart">
      <View style={styles.legend}>
        <Text style={styles.legendItem}>
          <Text style={styles.legendValue}>{formatSpeed(points.reduce((s,p)=>s+p.speed_ms,0)/points.length, speedUnit)}</Text>
          <Text style={styles.legendLabel}> moy.</Text>
        </Text>
        <Text style={styles.legendItem}>
          <Text style={styles.legendValue}>{formatSpeed(Math.max(...points.map(p=>p.speed_ms)), speedUnit)}</Text>
          <Text style={styles.legendLabel}> max</Text>
        </Text>
        <Text style={styles.legendItem}>
          <Text style={styles.legendLabel}>{SPEED_UNIT_LABELS[speedUnit]}</Text>
        </Text>
      </View>
      <VictoryChart
        height={180}
        width={350}
        padding={{ top: 10, bottom: 35, left: 45, right: 15 }}
      >
        <VictoryAxis
          style={{
            axis: { stroke: colors.lightGray },
            tickLabels: { fill: 'transparent' }, // Masquer les labels X (trop denses)
          }}
        />
        <VictoryAxis
          dependentAxis
          tickFormat={(t: number) => `${t.toFixed(0)}`}
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
              fillOpacity: 0.15,
              stroke: colors.primary,
              strokeWidth: 2,
            },
          }}
          interpolation="monotoneX"
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
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  legendItem: {
    textAlign: 'center',
  },
  legendValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  legendLabel: {
    fontSize: 12,
    color: colors.darkGray,
  },
  empty: {
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  emptyText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
});
