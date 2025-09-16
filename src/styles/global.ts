import { StyleSheet, Platform } from 'react-native';

// Colores centrales de la app
export const COLORS = {
  primary: '#00BFFF', // azul brillante
  secondary: '#87CEFA', // azul claro
  background: '#F5F5F5',
  text: '#333333',
  white: '#FFFFFF',
  black: '#000000', 
  gradientStart: '#1E3C72',  // inicio degradado azul
  gradientEnd: '#2A5298',    // fin degradado azul
};

// Box shadow compatible web y shadow para móvil
const shadow = Platform.select({
  web: {
    boxShadow: '0px 2px 6px rgba(0,0,0,0.3)',
  },
  default: {
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 5,
  },
});

export const GLOBAL = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.secondary,
    marginBottom: 10,
  },
  text: {
    fontSize: 16,
    color: COLORS.text,
  },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
    ...shadow,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    ...shadow,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '600',
  },
  formContainer: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 30,
    borderRadius: 25,
    width: '85%',
    maxWidth: 400,
    alignSelf: 'center',
    ...shadow,
  },
});
