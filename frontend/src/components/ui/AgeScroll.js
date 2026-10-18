import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

const QUICK_AGES = [1, 5, 12, 18, 25, 30, 40, 50, 60, 75];

const AgeScroll = ({
  selectedAge = 25,
  onSelect,
  minAge = 1,
  maxAge = 100,
  label = 'Select Age',
  accentColor = colors.cyan,
  style,
}) => {
  const scrollViewRef = useRef(null);
  const currentAge = parseInt(selectedAge) || 25;

  const ageList = [];
  for (let i = minAge; i <= maxAge; i++) {
    ageList.push(i);
  }

  // Scroll to selected age on load or change
  useEffect(() => {
    if (scrollViewRef.current) {
      const itemWidth = 54; // approximate item width + margin
      const index = Math.max(0, currentAge - minAge);
      const scrollPos = Math.max(0, index * itemWidth - 120);
      try {
        scrollViewRef.current.scrollTo({ x: scrollPos, animated: true });
      } catch (e) {}
    }
  }, [currentAge]);

  const handleStep = (delta) => {
    const next = Math.min(maxAge, Math.max(minAge, currentAge + delta));
    onSelect && onSelect(next.toString());
  };

  return (
    <View style={[styles.container, style]}>
      {/* Label and Selected Age Indicator */}
      <View style={styles.headerRow}>
        <View style={styles.labelGroup}>
          <Text style={styles.label}>{label}</Text>
          <View style={[styles.ageBadge, { backgroundColor: `${accentColor}20`, borderColor: accentColor }]}>
            <Text style={[styles.ageBadgeText, { color: accentColor }]}>
              {currentAge} {currentAge === 1 ? 'Year' : 'Years Old'}
            </Text>
          </View>
        </View>

        {/* Stepper buttons for quick adjustments */}
        <View style={styles.stepperRow}>
          <TouchableOpacity
            style={[styles.stepBtn, currentAge <= minAge && styles.stepBtnDisabled]}
            onPress={() => handleStep(-1)}
            disabled={currentAge <= minAge}
          >
            <Ionicons name="remove" size={16} color={currentAge <= minAge ? colors.textMuted : colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.stepBtn, currentAge >= maxAge && styles.stepBtnDisabled]}
            onPress={() => handleStep(1)}
            disabled={currentAge >= maxAge}
          >
            <Ionicons name="add" size={16} color={currentAge >= maxAge ? colors.textMuted : colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick age preset chips */}
      <View style={styles.presetsRow}>
        <Text style={styles.presetLabel}>Quick:</Text>
        <ScrollView 
          horizontal 
          nestedScrollEnabled={true}
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.presetsScroll}
        >
          {QUICK_AGES.map((qa) => {
            const isMatch = currentAge === qa;
            return (
              <TouchableOpacity
                key={qa}
                onPress={() => onSelect && onSelect(qa.toString())}
                style={[
                  styles.presetChip,
                  isMatch && { backgroundColor: accentColor, borderColor: accentColor }
                ]}
              >
                <Text style={[styles.presetChipText, isMatch && { color: '#080C14', fontWeight: '800' }]}>
                  {qa}y
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Horizontal Age Scroll Track */}
      <View style={styles.scrollTrackWrapper}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          nestedScrollEnabled={true}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {ageList.map((ageVal) => {
            const isSelected = ageVal === currentAge;

            return (
              <TouchableOpacity
                key={ageVal}
                activeOpacity={0.7}
                onPress={() => onSelect && onSelect(ageVal.toString())}
                style={[
                  styles.ageCard,
                  isSelected && [
                    styles.ageCardSelected,
                    { 
                      backgroundColor: accentColor,
                      borderColor: '#FFFFFF',
                      shadowColor: accentColor,
                    }
                  ],
                ]}
              >
                <Text style={[
                  styles.ageNumber,
                  isSelected && styles.ageNumberSelected
                ]}>
                  {ageVal}
                </Text>
                <Text style={[
                  styles.ageSub,
                  isSelected && styles.ageSubSelected
                ]}>
                  YRS
                </Text>

                {isSelected && (
                  <View style={styles.activeDot} />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  labelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  ageBadge: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  ageBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnDisabled: {
    opacity: 0.4,
  },
  presetsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 2,
  },
  presetLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    marginRight: 6,
    textTransform: 'uppercase',
  },
  presetsScroll: {
    gap: 6,
    flexDirection: 'row',
  },
  presetChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: colors.border,
  },
  presetChipText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  scrollTrackWrapper: {
    backgroundColor: colors.bgInput,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  scrollContent: {
    alignItems: 'center',
    gap: 8,
    flexDirection: 'row',
    paddingHorizontal: 4,
  },
  ageCard: {
    width: 48,
    height: 58,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ageCardSelected: {
    borderWidth: 1.5,
    elevation: 6,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    transform: [{ scale: 1.05 }],
  },
  ageNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  ageNumberSelected: {
    fontSize: 18,
    fontWeight: '900',
    color: '#080C14',
  },
  ageSub: {
    fontSize: 8,
    fontWeight: '700',
    color: colors.textMuted,
    marginTop: 1,
    letterSpacing: 0.5,
  },
  ageSubSelected: {
    color: '#080C14',
    fontWeight: '800',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#080C14',
    marginTop: 2,
  },
});

export default AgeScroll;
