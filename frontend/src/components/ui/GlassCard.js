import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

const GlassCard = ({ children, style, accent }) => (
  <View style={[styles.card, accent && styles.cardAccent, style]}>
    {children}
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.cyan,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  cardAccent: {
    borderColor: colors.borderAccent,
    shadowOpacity: 0.18,
  },
});

export default GlassCard;
