import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../../utils/colors';

interface ReplayPlayerProps {
  points: Array<{
    lat: number;
    lng: number;
    altitude_m: number;
    speed_ms: number;
    heart_rate: number | null;
    timestamp: Date;
  }>;
  onPositionChange?: (position: {
    lat: number;
    lng: number;
    altitude_m: number;
    speed_ms: number;
    heart_rate: number | null;
    progress: number;
  }) => void;
}

export default function ReplayPlayer({ points, onPositionChange }: ReplayPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const animationRef = useRef<Animated.Value>(new Animated.Value(0)).current;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const totalPoints = points.length;
  const progress = totalPoints > 0 ? (currentIndex / totalPoints) * 100 : 0;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Update position when playing
  useEffect(() => {
    if (isPlaying && currentIndex < totalPoints - 1) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => {
          const next = prev + 1;
          if (next >= totalPoints) {
            setIsPlaying(false);
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
            }
            return prev;
          }

          const point = points[next];
          onPositionChange?.({
            lat: point.lat,
            lng: point.lng,
            altitude_m: point.altitude_m,
            speed_ms: point.speed_ms,
            heart_rate: point.heart_rate,
            progress: (next / totalPoints) * 100,
          });

          return next;
        });
      }, 1000 / playbackSpeed);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, playbackSpeed, currentIndex, totalPoints, points, onPositionChange]);

  const handlePlayPause = () => {
    if (currentIndex >= totalPoints - 1) {
      // Restart from beginning
      setCurrentIndex(0);
    }
    setIsPlaying(!isPlaying);
  };

  const handleRestart = () => {
    setIsPlaying(false);
    setCurrentIndex(0);
  };

  const handleSpeedChange = () => {
    const speeds = [1, 2, 5, 10, 30];
    const currentIndex = speeds.indexOf(playbackSpeed);
    const nextIndex = (currentIndex + 1) % speeds.length;
    setPlaybackSpeed(speeds[nextIndex]);
  };

  const handleSeek = (direction: 'forward' | 'backward') => {
    const step = 10;
    setCurrentIndex((prev) => {
      if (direction === 'forward') {
        return Math.min(prev + step, totalPoints - 1);
      } else {
        return Math.max(prev - step, 0);
      }
    });
  };

  const formatTime = (index: number) => {
    if (points.length === 0) return '0:00';
    const point = points[index];
    const elapsed = (point.timestamp.getTime() - points[0].timestamp.getTime()) / 1000;
    const minutes = Math.floor(elapsed / 60);
    const seconds = Math.floor(elapsed % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const currentPoint = points[currentIndex];

  return (
    <View style={styles.container}>
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <View style={styles.timeRow}>
          <Text style={styles.timeText}>{formatTime(currentIndex)}</Text>
          <Text style={styles.timeText}>{formatTime(totalPoints - 1)}</Text>
        </View>
      </View>

      {/* Current Stats */}
      {currentPoint && (
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <MaterialIcons name="speed" size={16} color={colors.primary} />
            <Text style={styles.statValue}>
              {currentPoint.speed_ms > 0 ? (currentPoint.speed_ms * 3.6).toFixed(1) : '--'} km/h
            </Text>
          </View>
          {currentPoint.heart_rate && (
            <View style={styles.statItem}>
              <MaterialIcons name="favorite" size={16} color={colors.error} />
              <Text style={styles.statValue}>{currentPoint.heart_rate} bpm</Text>
            </View>
          )}
          <View style={styles.statItem}>
            <MaterialIcons name="trending-up" size={16} color={colors.primary} />
            <Text style={styles.statValue}>{currentPoint.altitude_m.toFixed(0)}m</Text>
          </View>
        </View>
      )}

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlButton} onPress={() => handleSeek('backward')}>
          <MaterialIcons name="replay-10" size={24} color={colors.onSurface} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.controlButton, styles.playButton]} onPress={handlePlayPause}>
          <MaterialIcons
            name={isPlaying ? 'pause' : 'play-arrow'}
            size={32}
            color={colors.white}
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton} onPress={() => handleSeek('forward')}>
          <MaterialIcons name="forward-10" size={24} color={colors.onSurface} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton} onPress={handleRestart}>
          <MaterialIcons name="replay" size={24} color={colors.onSurface} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.controlButton, styles.speedButton]} onPress={handleSpeedChange}>
          <Text style={styles.speedText}>{playbackSpeed}x</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 16,
    padding: 16,
    gap: 16,
  },
  progressContainer: {
    gap: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    fontSize: 12,
    fontFamily: 'Lexend',
    fontWeight: '600',
    color: colors.onSurfaceVariant,
    fontVariant: ['tabular-nums'],
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statValue: {
    fontSize: 14,
    fontFamily: 'Lexend',
    fontWeight: '700',
    color: colors.onSurface,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surfaceContainerHigh,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
  },
  speedButton: {
    backgroundColor: colors.primary,
  },
  speedText: {
    fontSize: 14,
    fontFamily: 'Lexend',
    fontWeight: '800',
    color: colors.white,
  },
});
