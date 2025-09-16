import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { login, LoginResponse } from '../api/api';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GLOBAL, COLORS } from '../styles/global';
import { Modal } from 'react-native';

const { width } = Dimensions.get('window');

// Tipado navegación
type RootStackParamList = {
  Login: undefined;
  Main: { usuario: string };   
  Clientes: undefined;
  Catalogos: undefined;
  Facturas: undefined;
  Servicios: undefined;
};

type LoginScreenProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

// Componente CustomAlert
const CustomAlert = ({
  visible,
  title,
  message,
  onClose,
}: {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
}) => (
  <Modal visible={visible} transparent animationType="fade">
    <View style={styles.alertOverlay}>
      <View style={styles.alertBox}>
        <Text style={styles.alertTitle}>{title}</Text>
        <Text style={styles.alertMessage}>{message}</Text>
        <TouchableOpacity style={styles.alertButton} onPress={onClose}>
          <Text style={styles.alertButtonText}>Cerrar</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

export default function LoginScreen() {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const navigation = useNavigation<LoginScreenProp>();

  // Estados para CustomAlert
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');

  const showAlert = (title: string, message: string) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertVisible(true);
  };

  const handleLogin = async () => {
    try {
      const data: LoginResponse = await login(usuario, password);

      if (data.mensaje === 'Login exitoso') {
        //showAlert('', data.mensaje);
        //setTimeout(() => navigation.replace('Main'), 500); // muestra alerta antes de redirigir
        navigation.replace('Main', { usuario });
      } else {
        showAlert('Error', data.mensaje || 'Error desconocido');
      }
    } catch (error: any) {
      if (error.response?.data?.mensaje) {
        showAlert('', error.response.data.mensaje);
      } else if (error.message) {
        showAlert('Error', error.message);
      } else {
        showAlert('Error', 'No se pudo conectar con el servidor');
      }
    }
  };

  return (
    <LinearGradient
      colors={[COLORS.gradientStart, COLORS.gradientEnd]}
      style={GLOBAL.container}
    >
      <View style={styles.centerContainer}>
        <Text style={styles.corporateTitle}>TIGO</Text>
        <Text style={styles.corporateSubtitle}>Sistema de Facturación Web</Text>

        <View style={GLOBAL.formContainer}>
          <FontAwesome
            name="lock"
            size={60}
            color={COLORS.primary}
            style={{ alignSelf: 'center', marginBottom: 20 }}
          />

          <Text style={GLOBAL.title}>Iniciar Sesión</Text>

          <TextInput
            placeholder="Usuario"
            value={usuario}
            onChangeText={setUsuario}
            style={GLOBAL.input}
            placeholderTextColor="#ccc"
          />

          <TextInput
            placeholder="Contraseña"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={GLOBAL.input}
            placeholderTextColor="#ccc"
          />

          <TouchableOpacity style={GLOBAL.button} onPress={handleLogin}>
            <Text style={GLOBAL.buttonText}>Login</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Custom Alert */}
      <CustomAlert
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        onClose={() => setAlertVisible(false)}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  corporateTitle: {
    fontSize: 100,
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 5,
  },
  corporateSubtitle: {
    fontSize: 50,
    color: COLORS.secondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertBox: {
    backgroundColor: COLORS.white,
    padding: 25,
    borderRadius: 15,
    width: width * 0.8,
    maxWidth: 400,
    alignItems: 'center',
  },
  alertTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  alertMessage: { fontSize: 16, textAlign: 'center', marginBottom: 20 },
  alertButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  alertButtonText: { color: COLORS.white, fontWeight: 'bold' },
});
