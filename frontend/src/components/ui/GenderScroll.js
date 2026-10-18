import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

const GENDER_OPTIONS = [
  {
    id: 'male',
    label: 'Male',
    symbol: '♂',
    icon: 'man',
    color: '#00C9FF',
    desc: 'Adult / Child',
  },
  {
    id: 'female',
    label: 'Female',
    symbol: '♀',
    icon: 'woman',
    color: '#EC4899',
    desc: 'Adult / Child',
  },
  {
    id: 'other',
    label: 'Other',
    symbol: '⚧',
    icon: 'people',
    color: '#A855F7',
    desc: 'Non-binary / Other',
  },
];

const GenderScroll = ({ 
  selectedGender = 'male', 
  onSelect, 
  label = 'Select Gender',
  accentColor = colors.cyan,
  style 
}) => {
  return (
    <View style={[styles.container, style]}>
      {label ? (
        <View style={styles.labelRow}>
          <Text style={styles.label}>{label}</Text>
          <View style={[styles.activeBadge, { borderColor: accentColor }]}>
            <Text style={[styles.activeBadgeText, { color: accentColor }]}>
              {selectedGender.toUpperCase()}
            </Text>
          </View>
        </View>
      ) : null}

      <ScrollView
        horizontal
        nestedScrollEnabled={true}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {GENDER_OPTIONS.map((item) => {
          const isSelected = selectedGender.toLowerCase() === item.id;
          const activeItemColor = item.color || accentColor;

          return (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.7}
              onPress={() => onSelect && onSelect(item.id)}
              style={[
                styles.genderCard,
                isSelected && [
                  styles.genderCardSelected,
                  { 
                    borderColor: activeItemColor, 
                    backgroundColor: `${activeItemColor}1A` // ~10% opacity
                  }
                ],
              ]}
            >
              <View style={[
                styles.iconContainer, 
                isSelected && { backgroundColor: activeItemColor }
              ]}>
                <Ionicons 
                  name={item.icon} 
                  size={20} 
                  color={isSelected ? '#080C14' : colors.textSecondary} 
                />
              </View>

              <View style={styles.textContainer}>
                <View style={styles.titleRow}>
                  <Text style={[
                    styles.genderTitle,
                    isSelected && { color: '#FFFFFF', fontWeight: '800' }
                  ]}>
                    {item.label}
                  </Text>
                  <Text style={[styles.symbolText, { color: activeItemColor }]}>
                    {item.symbol}
                  </Text>
                </View>
                <Text style={styles.descText}>{item.desc}</Text>
              </View>

              {isSelected && (
                <View style={[styles.checkBadge, { backgroundColor: activeItemColor }]}>
                  <Ionicons name="checkmark" size={12} color="#080C14" />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  activeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  activeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  scrollContent: {
    paddingVertical: 4,
    gap: 10,
    flexDirection: 'row',
  },
  genderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgInput,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingVertical: 10,
    paddingHorizontal: 14,
    minWidth: 130,
    position: 'relative',
  },
  genderCardSelected: {
    borderWidth: 1.5,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  textContainer: {
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  genderTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  symbolText: {
    fontSize: 14,
    fontWeight: '700',
  },
  descText: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  checkBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default GenderScroll;
