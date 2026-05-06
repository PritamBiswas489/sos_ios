/**
 * AudioVisualizer  —  Professional spectrum-bar visualiser
 *
 * Props:
 *   active  {boolean}  — animate when true, settle to flat when false
 *   color   {string}   — bar fill / accent colour
 *   label   {string}   — small caption rendered above the bars
 *   height  {number}   — bar area height (default 64)
 *   bars    {number}   — number of bars (default 32)
 */

import React, { useEffect, useRef, useMemo } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';

const DEFAULT_BARS   = 32;
const DEFAULT_HEIGHT = 64;
const MIN_BAR_H      = 3;
const BAR_GAP        = 1.5;
const PEAK_HOLD_MS   = 1300;
const REFLECT_H      = 14;

export default function AudioVisualizer({
  active  = false,
  color   = '#7c6ff7',
  label   = null,
  height  = DEFAULT_HEIGHT,
  bars: BAR_COUNT = DEFAULT_BARS,
}) {
  // One Animated.Value per bar — bar body height
  const animValues = useRef(
    Array.from({ length: BAR_COUNT }, () => new Animated.Value(MIN_BAR_H)),
  ).current;

  // Peak hold marker position per bar
  const peakValues = useRef(
    Array.from({ length: BAR_COUNT }, () => new Animated.Value(MIN_BAR_H)),
  ).current;

  // Pulsing dot in the label row
  const dotPulse = useRef(new Animated.Value(0.35)).current;

  // Pre-compute derived Animated values once — avoids re-creating on every render
  const capBottoms     = useRef(animValues.map(v => Animated.subtract(v, 3))).current;
  const peakBottoms    = useRef(peakValues.map(v => Animated.subtract(v, 2))).current;
  const reflectHeights = useRef(animValues.map(v => Animated.multiply(v, 0.30))).current;

  const barParams = useMemo(
    () =>
      Array.from({ length: BAR_COUNT }, (_, i) => ({
        maxFrac:  0.22 + Math.abs(Math.sin((i / BAR_COUNT) * Math.PI)) * 0.78,
        duration: 260 + Math.floor(Math.random() * 500),
        delay:    Math.floor((i / BAR_COUNT) * 170),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const runningAnims = useRef([]);
  const peakTimers   = useRef([]);

  useEffect(() => {
    runningAnims.current.forEach(a => a.stop?.());
    runningAnims.current = [];
    peakTimers.current.forEach(clearTimeout);
    peakTimers.current = [];

    if (active) {
      // Pulse the live dot
      const dotAnim = Animated.loop(
        Animated.sequence([
          Animated.timing(dotPulse, { toValue: 1.0, duration: 650, useNativeDriver: true }),
          Animated.timing(dotPulse, { toValue: 0.3, duration: 650, useNativeDriver: true }),
        ]),
      );
      dotAnim.start();
      runningAnims.current.push(dotAnim);

      animValues.forEach((val, i) => {
        const { maxFrac, duration, delay } = barParams[i];
        const maxH    = MIN_BAR_H + (height - MIN_BAR_H) * maxFrac;
        const troughH = MIN_BAR_H + (maxH - MIN_BAR_H) * 0.10;

        // Snap peak to max, then drop after hold time
        peakValues[i].setValue(maxH);
        peakTimers.current[i] = setTimeout(() => {
          Animated.timing(peakValues[i], {
            toValue:  troughH,
            duration: 700,
            useNativeDriver: false,
          }).start();
        }, PEAK_HOLD_MS + i * 25);

        const anim = Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(val, { toValue: maxH,    duration,                useNativeDriver: false }),
            Animated.timing(val, { toValue: troughH, duration: duration * 0.7, useNativeDriver: false }),
          ]),
        );
        anim.start();
        runningAnims.current.push(anim);
      });
    } else {
      Animated.timing(dotPulse, { toValue: 0.35, duration: 300, useNativeDriver: true }).start();
      [...animValues, ...peakValues].forEach(val => {
        const s = Animated.timing(val, { toValue: MIN_BAR_H, duration: 420, useNativeDriver: false });
        s.start();
        runningAnims.current.push(s);
      });
    }

    return () => {
      runningAnims.current.forEach(a => a.stop?.());
      peakTimers.current.forEach(clearTimeout);
    };
  }, [active, height]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <View style={[styles.wrapper, active && styles.wrapperActive]}>
      {/* Label row */}
      {label && (
        <View style={styles.labelRow}>
          <Animated.View style={[styles.liveDot, { backgroundColor: color, opacity: dotPulse }]} />
          <Text style={styles.labelText}>{label}</Text>
        </View>
      )}

      {/* Bar area */}
      <View style={[styles.barsArea, { height }]}>
        {animValues.map((val, i) => (
          <View key={i} style={[styles.barCol, { height }]}>
            {/* Body */}
            <Animated.View style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              height: val,
              backgroundColor: color,
              opacity: 0.50 + (i % 5) * 0.06,
              borderTopLeftRadius: 2,
              borderTopRightRadius: 2,
            }} />
            {/* Bright top cap */}
            <Animated.View style={{
              position: 'absolute', bottom: capBottoms[i], left: 0, right: 0,
              height: 3,
              backgroundColor: color,
              borderTopLeftRadius: 2,
              borderTopRightRadius: 2,
            }} />
            {/* Peak hold marker */}
            <Animated.View style={{
              position: 'absolute', bottom: peakBottoms[i], left: 0, right: 0,
              height: 2,
              backgroundColor: color,
              opacity: 0.80,
            }} />
          </View>
        ))}
      </View>

      {/* Separator */}
      <View style={styles.separator} />

      {/* Reflection */}
      <View style={[styles.reflectArea, { height: REFLECT_H }]}>
        {reflectHeights.map((rh, i) => (
          <Animated.View key={i} style={{
            height: rh,
            flex: 1,
            marginHorizontal: BAR_GAP / 2,
            backgroundColor: color,
            opacity: 0.09,
            borderBottomLeftRadius: 2,
            borderBottomRightRadius: 2,
          }} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#17171a',
    borderRadius:    12,
    borderWidth:     1,
    borderColor:     '#2a2a30',
    paddingHorizontal: 10,
    paddingTop:        10,
    paddingBottom:     0,
    overflow:          'hidden',
  },
  wrapperActive: {
    borderColor: '#3a3a48',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           6,
    marginBottom:  8,
  },
  liveDot: {
    width:        6,
    height:       6,
    borderRadius: 3,
  },
  labelText: {
    fontSize:      10,
    fontWeight:    '700',
    color:         '#6b6b7a',
    textTransform: 'uppercase',
    letterSpacing: 0.9,
  },
  barsArea: {
    flexDirection: 'row',
    alignItems:    'flex-end',
  },
  barCol: {
    flex:             1,
    marginHorizontal: BAR_GAP / 2,
  },
  separator: {
    height:          1,
    backgroundColor: '#23232a',
    marginTop:       1,
  },
  reflectArea: {
    flexDirection: 'row',
    alignItems:    'flex-start',
  },
});

