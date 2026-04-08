import React from 'react';
import { View, StyleSheet } from 'react-native';
import { VictoryLine, VictoryChart, VictoryAxis } from 'victory-native';
import { colors } from '../../utils/colors';

interface ElevationChartProps {
  points: Array<{ altitude_m: number }>;
}

export function ElevationChart({ points }: ElevationChartProps) {
  const data = points.map((point, index) => ({
    x: index,
    y: point.altitude_m,
  }));

  return (
    <View style={styles.container} testID="elevation-chart">
      <VictoryChart
        height={200}
        width={350}
        padding={{ top: 20, bottom: 40, left: 50, right: 20 }}
      >
        <VictoryAxis
          style={{
            axis: { stroke: colors.lightGray },
            tickLabels: { fill: colors.darkGray, fontSize: 10 },
          }}
        />
        <VictoryAxis
          dependentAxis
          style={{
            axis: { stroke: colors.lightGray },
            tickLabels: { fill: colors.darkGray, fontSize: 10 },
          }}
        />
        <VictoryLine
          data={data}
          style={{
            data: { stroke: colors.primary, strokeWidth: 2 },
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
    paddingVertical: 16,
  },
});
