import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';

const CustomDrawer = (props) => {
  const { user, logout } = useAuth();
  
  const roleColor = {
    patient: colors.cyan,
    doctor: colors.green,
    asha: colors.purple,
    admin: colors.orange,
  }[props.role] || colors.cyan;

  return (
    <View style={styles.container}>
      <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 0 }}>
        <View style={styles.header}>
          <Text style={styles.appName}>AAROGYA</Text>
          <View style={[styles.avatar, { borderColor: roleColor }]}>
            <Text style={[styles.avatarText, { color: roleColor }]}>
              {user?.role?.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.name}>{user?.id}</Text>
          <Text style={styles.role}>{user?.role?.toUpperCase()}</Text>
        </View>
        <View style={styles.list}>
          <DrawerItemList {...props} />
        </View>
      </DrawerContentScrollView>

      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Ionicons name="log-out-outline" size={22} color={colors.red} />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 30,
    backgroundColor: colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  avatarText: { fontSize: 24, fontWeight: '800' },
  name: { color: colors.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 4 },
  role: { color: colors.textSecondary, fontSize: 11, fontWeight: '600', letterSpacing: 1 },
  appName: { color: '#00C9FF', fontSize: 20, fontWeight: '900', letterSpacing: 3, marginBottom: 12 },
  list: { paddingTop: 20 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  logoutText: { color: colors.red, fontSize: 15, fontWeight: '600', marginLeft: 12 },
});

export default CustomDrawer;
