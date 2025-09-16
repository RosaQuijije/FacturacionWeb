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
import { Picker } from '@react-native-picker/picker';
import { COLORS } from '../styles/global';
import { saveCatalogo, getCatalogos, deleteCatalogo, Catalogo } from '../api/api';

export default function CatalogoScreen() {
  const [catalogos, setCatalogos] = useState<Catalogo[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({
    nombre: '',
    precio: '',
    cantidad: '',
    impuesto: 0,
    tipo: 'P',
    estado: 'A',
  });
  const [editing, setEditing] = useState<number | null>(null);
  const [error, setError] = useState<string>('');

  // Cargar catálogo
  const fetchCatalogos = async () => {
    try {
      const data = await getCatalogos();
      setCatalogos(data);
    } catch (error) {
      console.log('Error cargando catálogo:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchCatalogos();
    }, [])
  );

  // Abrir modal
  const openForm = (catalogo?: Catalogo) => {
    setError('');
    if (catalogo) {
      setForm({
        nombre: catalogo.nombre,
        precio: catalogo.precio.toString(),
        cantidad: catalogo.cantidad.toString(),
        impuesto: catalogo.impuesto,
        tipo: catalogo.tipo,
        estado: catalogo.estado,
      });
      setEditing(catalogo.idCatalogo!);
    } else {
      setForm({ nombre: '', precio: '', cantidad: '', impuesto: 0, tipo: 'P', estado: 'A' });
      setEditing(null);
    }
    setModalVisible(true);
  };

  // Guardar catálogo
  const handleSave = async () => {
    if (!form.nombre.trim()) {
      setError('El nombre es obligatorio');
      return;
    }
    if (!form.precio || isNaN(parseFloat(form.precio)) || parseFloat(form.precio) <= 0) {
      setError('El precio debe ser un número válido mayor que 0');
      return;
    }
    if (!form.cantidad || isNaN(parseInt(form.cantidad))) {
      setError('La cantidad debe ser un número entero válido');
      return;
    }

    const cantidadNum = parseInt(form.cantidad);

    // Validación según tipo
    if (form.tipo === 'S' && cantidadNum !== 1) {
      setError('Para servicios, la cantidad debe ser 1');
      return;
    }
    if (form.tipo === 'P' && cantidadNum < 0) {
      setError('Para productos, la cantidad debe ser igual o mayor a 0');
      return;
    }

    try {
      await saveCatalogo({
        ...form,
        idCatalogo: editing ?? undefined,
        precio: parseFloat(form.precio),
        cantidad: cantidadNum,
      });
      setModalVisible(false);
      fetchCatalogos();
    } catch (error) {
      console.log('Error guardando catálogo:', error);
    }
  };

  // Eliminar catálogo
  const handleDelete = async (id: number) => {
    try {
      await deleteCatalogo(id);
      fetchCatalogos();
    } catch (error) {
      console.log('Error eliminando catálogo:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mantenedor de catálogo</Text>

      {/* Lista de productos/servicios */}
      <FlatList
        data={catalogos}
        keyExtractor={(item) => item.idCatalogo!.toString()}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View>
              <Text style={styles.itemText}>
                {item.tipo === 'P' ? 'Producto' : 'Servicio'} - {item.nombre} (${item.precio})
              </Text>
              <Text style={styles.subItemText}>
                Estado: {item.estado === 'A' ? 'Activo' : 'Inactivo'}
              </Text>
              <Text style={styles.subItemText}>
                Cantidad disponible: {item.cantidad}
              </Text>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity style={styles.edit} onPress={() => openForm(item)}>
                <Text style={styles.actionText}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.delete} onPress={() => handleDelete(item.idCatalogo!)}>
                <Text style={styles.actionText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListFooterComponent={() => (
          <TouchableOpacity style={styles.newButton} onPress={() => openForm()}>
            <Text style={styles.newButtonText}>Crear nuevo</Text>
          </TouchableOpacity>
        )}
      />

      {/* Modal formulario */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{editing ? 'Editar Catálogo' : 'Crear Catálogo'}</Text>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {/* Tipo */}
            <Picker
              selectedValue={form.tipo}
              onValueChange={(value) => setForm({ ...form, tipo: value })}
              style={styles.picker}
              itemStyle={styles.pickerItem}
            >
              <Picker.Item label="Producto" value="P" />
              <Picker.Item label="Servicio" value="S" />
            </Picker>

            <TextInput
              style={styles.input}
              placeholder="Nombre"
              value={form.nombre}
              onChangeText={(text) => setForm({ ...form, nombre: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Precio"
              keyboardType="numeric"
              value={form.precio}
              onChangeText={(text) => setForm({ ...form, precio: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Cantidad"
              keyboardType="numeric"
              value={form.cantidad}
              onChangeText={(text) => setForm({ ...form, cantidad: text })}
            />

            {/* Impuesto */}
            <Picker
              selectedValue={form.impuesto}
              onValueChange={(value) => setForm({ ...form, impuesto: value })}
              style={styles.picker}
              itemStyle={styles.pickerItem}
            >
              <Picker.Item label="15%" value={15} />
              <Picker.Item label="0%" value={0} />
            </Picker>

            {/* Estado */}
            <Picker
              selectedValue={form.estado}
              onValueChange={(value) => setForm({ ...form, estado: value })}
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
                <Text style={styles.modalButtonText}>{editing ? 'Actualizar' : 'Guardar'}</Text>
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
  title: { fontSize: 30, fontWeight: 'bold', color: COLORS.primary, marginBottom: 20, textAlign: 'center' },
  item: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, borderBottomWidth: 1, borderColor: COLORS.secondary },
  itemText: { fontSize: 18 },
  subItemText: { fontSize: 14, color: COLORS.secondary },
  actions: { flexDirection: 'row' },
  edit: { marginRight: 10, backgroundColor: COLORS.secondary, padding: 5, borderRadius: 5 },
  delete: { backgroundColor: '#ff4d4d', padding: 5, borderRadius: 5 },
  actionText: { color: COLORS.white },
  newButton: { backgroundColor: COLORS.primary, paddingVertical: 15, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginVertical: 15 },
  newButtonText: { color: COLORS.white, fontWeight: 'bold', fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { backgroundColor: COLORS.white, padding: 20, borderRadius: 15, width: '85%' },
  modalTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 15, textAlign: 'center', color: COLORS.primary },
  errorText: { color: 'red', marginBottom: 10, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: COLORS.primary, borderRadius: 8, padding: 10, marginBottom: 10 },
  picker: { borderWidth: 1, borderColor: COLORS.primary, borderRadius: 8, marginBottom: 10, height: 50, justifyContent: 'center' },
  pickerItem: { fontSize: 18 },
  modalButtonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  modalButton: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center', marginHorizontal: 5 },
  modalButtonText: { color: COLORS.white, fontWeight: 'bold', fontSize: 16 },
});
