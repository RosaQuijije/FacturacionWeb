import { useFocusEffect } from '@react-navigation/native';
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Modal,
} from 'react-native';
import { Picker } from '@react-native-picker/picker'; // para combos
import { Cliente, getClientes, saveCliente, deleteCliente } from '../api/api';
import { COLORS } from '../styles/global';

export default function ClienteScreen() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState<Cliente>({
    tipoIdentificacion: 'C',
    numIdentificacion: '',
    nombre: '',
    apellido: '',
    direccion: '',
    email: '',
    telefono: '',
    estado: 'A',
  });
  const [editing, setEditing] = useState<number | null>(null);
  const [error, setError] = useState<string>('');

  // Función para cargar clientes
  const fetchClientes = async () => {
    try {
      const data = await getClientes();
      setClientes(data);
    } catch (error) {
      console.log('Error cargando clientes:', error);
    }
  };

  // Se ejecuta cada vez que la pantalla entra en foco
  useFocusEffect(
    useCallback(() => {
      fetchClientes();
    }, [])
  );

  // Abrir modal para crear o editar
  const openForm = (cliente?: Cliente) => {
    setError('');
    if (cliente) {
      setForm(cliente);
      setEditing(cliente.idCliente!);
    } else {
      setForm({
        tipoIdentificacion: 'C',
        numIdentificacion: '',
        nombre: '',
        apellido: '',
        direccion: '',
        email: '',
        telefono: '',
        estado: 'A',
      });
      setEditing(null);
    }
    setModalVisible(true);
  };

  // Guardar cliente (crear o actualizar)
  const handleSave = async () => {
    // Validar campos obligatorios
    if (
      !form.tipoIdentificacion ||
      !form.numIdentificacion ||
      !form.nombre ||
      !form.apellido ||
      !form.email ||
      !form.telefono ||
      !form.direccion
    ) {
      setError('Todos los campos son obligatorios');
      return;
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setError('Ingrese un correo electrónico válido');
      return;
    }

    // Validar teléfono (solo números y al menos 7 dígitos)
    const phoneRegex = /^[0-9]{7,15}$/;
    if (!phoneRegex.test(form.telefono)) {
      setError('Ingrese un número de teléfono válido (7-15 dígitos)');
      return;
    }

    try {
      await saveCliente({ ...form, idCliente: editing ?? undefined });
      setModalVisible(false);
      fetchClientes();
    } catch (error) {
      console.log('Error guardando cliente:', error);
    }
  };

  // Eliminar cliente
  const handleDelete = async (id: number) => {
    try {
      await deleteCliente(id);
      fetchClientes();
    } catch (error) {
      console.log('Error eliminando cliente:', error);
    }
  };

  // Diccionario para mostrar textos legibles
  const tipoIdentLabels: Record<string, string> = {
    C: 'Cédula',
    P: 'Pasaporte',
    R: 'RUC',
  };
  const estadoLabels: Record<string, string> = {
    A: 'Activo',
    I: 'Inactivo',
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mantenedor de cliente</Text>

      {/* Lista de clientes */}
      <FlatList
        data={clientes}
        keyExtractor={(item) => item.idCliente!.toString()}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View>
              <Text style={styles.itemText}>
                {item.nombre} {item.apellido}
              </Text>
              <Text style={styles.subItemText}>
                {tipoIdentLabels[item.tipoIdentificacion]}: {item.numIdentificacion}
              </Text>
              <Text style={styles.subItemText}>
                {estadoLabels[item.estado]}
              </Text>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.edit}
                onPress={() => openForm(item)}
              >
                <Text style={styles.actionText}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.delete}
                onPress={() => handleDelete(item.idCliente!)}
              >
                <Text style={styles.actionText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListFooterComponent={() => (
          <TouchableOpacity style={styles.newButton} onPress={() => openForm()}>
            <Text style={styles.newButtonText}>Crear nuevo cliente</Text>
          </TouchableOpacity>
        )}
      />

      {/* Modal de formulario */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>
              {editing ? 'Editar Cliente' : 'Crear Cliente'}
            </Text>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {/* Combo tipoIdentificacion 
            <Text style={styles.label}>Tipo de Identificación</Text>*/}
            <Picker
              selectedValue={form.tipoIdentificacion}
              onValueChange={(value:string) =>
                setForm({ ...form, tipoIdentificacion: value })
              }
              style={styles.picker}
              itemStyle={styles.pickerItem}
            >
              <Picker.Item label="Cédula" value="C" />
              <Picker.Item label="Pasaporte" value="P" />
              <Picker.Item label="RUC" value="R" />
            </Picker>

            {/* Número de identificación */}
            <TextInput
              style={styles.input}
              placeholder="Número de Identificación"
              value={form.numIdentificacion}
              onChangeText={(text) => setForm({ ...form, numIdentificacion: text })}
            />

            {/* Resto de campos */}
            <TextInput
              style={styles.input}
              placeholder="Nombre"
              value={form.nombre}
              onChangeText={(text) => setForm({ ...form, nombre: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Apellido"
              value={form.apellido}
              onChangeText={(text) => setForm({ ...form, apellido: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Dirección"
              value={form.direccion}
              onChangeText={(text) => setForm({ ...form, direccion: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={form.email}
              onChangeText={(text) => setForm({ ...form, email: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Teléfono"
              value={form.telefono}
              onChangeText={(text) => setForm({ ...form, telefono: text })}
            />

            {/* Combo estado 
            <Text style={styles.label}>Estado</Text>*/}
            <Picker
              selectedValue={form.estado}
              onValueChange={(value:string) => setForm({ ...form, estado: value })}
              style={styles.picker}
              itemStyle={styles.pickerItem}
            >
              <Picker.Item label="Activo" value="A" />
              <Picker.Item label="Inactivo" value="I" />
            </Picker>

            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: COLORS.secondary }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: COLORS.primary }]}
                onPress={handleSave}
              >
                <Text style={styles.modalButtonText}>
                  {editing ? 'Actualizar' : 'Guardar'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: COLORS.white },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 20,
    textAlign: 'center',
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderColor: COLORS.secondary,
  },
  itemText: { fontSize: 18, fontWeight: 'bold' },
  subItemText: { fontSize: 14, color: COLORS.secondary },
  actions: { flexDirection: 'row' },
  edit: {
    marginRight: 10,
    backgroundColor: COLORS.secondary,
    padding: 5,
    borderRadius: 5,
  },
  delete: { backgroundColor: '#ff4d4d', padding: 5, borderRadius: 5 },
  actionText: { color: COLORS.white },
  newButton: {
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 15,
  },
  newButtonText: { color: COLORS.white, fontWeight: 'bold', fontSize: 16 },

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
    width: '85%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: COLORS.primary,
  },
  errorText: { color: 'red', marginBottom: 10, textAlign: 'center' },
  label: { marginBottom: 5, fontWeight: 'bold', color: COLORS.primary },
  input: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  picker: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 8,
    marginBottom: 10,
    height: 50, 
  },
  pickerItem: {
    fontSize: 20,      //tamaño de texto de las opciones
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  modalButtonText: { color: COLORS.white, fontWeight: 'bold', fontSize: 16 },
});
