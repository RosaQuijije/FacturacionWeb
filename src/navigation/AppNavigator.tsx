import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator, DrawerContentScrollView } from '@react-navigation/drawer';

import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import ClienteScreen from '../screens/ClienteScreen';
import CatalogoScreen from '../screens/CatalogoScreen';
import FacturaScreen from '../screens/FacturaScreen';
import ServicioScreen from '../screens/ServiciosScreen';
import ListadoFacturasScreen from '../screens/ListadoFacturasScreen';
import FacturaServiciosScreen from '../screens/FacturaServiciosScreen'; 

import { COLORS } from '../styles/global';

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

// Modal de logout
const LogoutModal = ({ visible, onConfirm, onCancel }: any) => (
  <Modal visible={visible} transparent animationType="fade">
    <View style={styles.modalOverlay}>
      <View style={styles.modalBox}>
        <Text style={styles.modalTitle}>Cerrar sesión</Text>
        <Text style={styles.modalMessage}>¿Desea cerrar sesión?</Text>
        <View style={styles.modalButtonRow}>
          <TouchableOpacity
            style={[styles.modalButton, { backgroundColor: COLORS.secondary }]}
            onPress={onCancel}
          >
            <Text style={styles.modalButtonText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modalButton, { backgroundColor: COLORS.primary }]}
            onPress={onConfirm}
          >
            <Text style={styles.modalButtonText}>Sí</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

// Drawer customizado
function CustomDrawerContent({ navigation, usuario }: any) {
  const [showMantenedores, setShowMantenedores] = useState(false);
  const [showProcesos, setShowProcesos] = useState(false);
  const [logoutVisible, setLogoutVisible] = useState(false);

  const handleLogoutConfirm = () => {
    setLogoutVisible(false);
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  return (
    <DrawerContentScrollView style={{ backgroundColor: COLORS.gradientEnd }}>
      {/* Encabezado */}
      <View
        style={{
          padding: 20,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Text style={[styles.menuButtonText, { color: COLORS.white, fontSize: 18 }]}>
          Menú Principal
        </Text>
      </View>

      <ScrollView style={{ paddingHorizontal: 20 }}>
        {/* Home */}
        <TouchableOpacity style={styles.menuButton} onPress={() => navigation.navigate('Home')}>
          <Text style={styles.menuButtonText}>Bienvenida</Text>
        </TouchableOpacity>

        {/* Mantenedores */}
        <TouchableOpacity
          style={styles.menuSectionButton}
          onPress={() => setShowMantenedores(!showMantenedores)}
        >
          <Text style={styles.menuSectionText}>Mantenedores</Text>
        </TouchableOpacity>
        {showMantenedores && (
          <View style={styles.subMenuContainer}>
            <TouchableOpacity style={styles.subMenuButton} onPress={() => navigation.navigate('Cliente')}>
              <Text style={styles.subMenuText}>Cliente</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.subMenuButton} onPress={() => navigation.navigate('Catalogo')}>
              <Text style={styles.subMenuText}>Catálogo</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Procesos */}
        <TouchableOpacity
          style={styles.menuSectionButton}
          onPress={() => setShowProcesos(!showProcesos)}
        >
          <Text style={styles.menuSectionText}>Procesos</Text>
        </TouchableOpacity>
        {showProcesos && (
          <View style={styles.subMenuContainer}>
            <TouchableOpacity style={styles.subMenuButton} onPress={() => navigation.navigate('Servicio')}>
              <Text style={styles.subMenuText}>Servicio recurrentes</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.subMenuButton} onPress={() => navigation.navigate('Facturar')}>
              <Text style={styles.subMenuText}>Crear factura</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.subMenuButton} onPress={() => navigation.navigate('FacturaServicios')}>
              <Text style={styles.subMenuText}>Crear factura servicios</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.subMenuButton} onPress={() => navigation.navigate('ListadoFacturas')}>
              <Text style={styles.subMenuText}>Anular Facturas</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Logout */}
        <TouchableOpacity
          style={[styles.menuButton, { backgroundColor: '#ff4d4d' }]}
          onPress={() => setLogoutVisible(true)}
        >
          <Text style={styles.menuButtonText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </ScrollView>

      <LogoutModal
        visible={logoutVisible}
        onConfirm={handleLogoutConfirm}
        onCancel={() => setLogoutVisible(false)}
      />
    </DrawerContentScrollView>
  );
}

// Drawer principal
function MainDrawer({ route }: any) {
  const { usuario } = route.params;

  return (
    <Drawer.Navigator
      initialRouteName="Home"
      screenOptions={{ headerShown: true }}
      drawerContent={(props) => <CustomDrawerContent {...props} usuario={usuario} />}
    >
      <Drawer.Screen
        name="Home"
        component={HomeScreen}
        initialParams={{ usuario }}
        options={{
          headerStyle: { backgroundColor: COLORS.primary },
          headerTintColor: COLORS.white,
          headerTitle: 'Menú Principal',
          headerRight: () => (
            <Text style={{ marginRight: 15, fontWeight: 'bold', color: COLORS.white }}>
              Usuario: {usuario}
            </Text>
          ),
        }}
      />
      <Drawer.Screen name="Cliente" component={ClienteScreen} />
      <Drawer.Screen name="Catalogo" component={CatalogoScreen} />
      <Drawer.Screen name="Facturar" component={FacturaScreen} />
      <Drawer.Screen name="FacturaServicios" component={FacturaServiciosScreen} options={{ title: 'Facturar Servicios' }} />
      <Drawer.Screen name="Servicio" component={ServicioScreen} />
      <Drawer.Screen name="ListadoFacturas" component={ListadoFacturasScreen} options={{ title: 'Anular Facturas' }} />
    </Drawer.Navigator>
  );
}

// Stack principal
export default function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Main" component={MainDrawer} />
    </Stack.Navigator>
  );
}

// Estilos
const styles = StyleSheet.create({
  welcomeText: { fontWeight: 'bold', fontSize: 16, marginBottom: 15, color: COLORS.white },
  menuButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 10,
    marginVertical: 5,
  },
  menuButtonText: { color: COLORS.white, fontWeight: 'bold', fontSize: 20 },
  menuSectionButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    marginVertical: 5,
  },
  menuSectionText: { fontWeight: 'bold', fontSize: 20, color: COLORS.white },
  subMenuContainer: { paddingLeft: 15, marginVertical: 5, backgroundColor: COLORS.white, borderRadius: 8 },
  subMenuButton: { paddingVertical: 8, paddingHorizontal: 10, marginVertical: 2 },
  subMenuText: { fontSize: 20, color: '#333' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 15,
    width: '70%',
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  modalMessage: { fontSize: 40, marginBottom: 20, textAlign: 'center' },
  modalButtonRow: { flexDirection: 'row', justifyContent: 'space-between' },
  modalButton: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 10,
    justifyContent: 'center',
  },
  modalButtonText: { fontSize: 25, color: COLORS.white, fontWeight: 'bold', textAlign: 'center' },
});
