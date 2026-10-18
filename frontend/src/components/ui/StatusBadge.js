import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

const STATUS_CONFIG = {
  pending:   { label: 'Pending',   color: colors.orange,  bg: 'rgba(245,158,11,0.15)' },
  confirmed: { label: 'Confirmed', color: colors.cyan,    bg: 'rgba(0,201,255,0.15)' },
  completed: { label: 'Completed', color: colors.green,   bg: 'rgba(0,242,169,0.15)' },
  cancelled: { label: 'Cancelled', color: colors.red,     bg: 'rgba(239,68,68,0.15)' },
  LOW:       { label: 'LOW',       color: colors.green,   bg: 'rgba(0,242,169,0.15)' },
  MEDIUM:    { label: 'MEDIUM',    color: colors.orange,  bg: 'rgba(245,158,11,0.15)' },
  HIGH:      { label: 'HIGH',      color: colors.red,     bg: 'rgba(239,68,68,0.15)' },
  CRITICAL:  { label: 'CRITICAL',  color: '#fff',         bg: 'rgba(239,68,68,0.8)' },
};

const StatusBadge = ({ status, style }) => {
  const cfg = STATUS_CONFIG[status] || { label: status, color: colors.textMuted, bg: colors.bgCard };
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }, style]}>
      <Text style={[styles.text, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});

export default StatusBadge;
