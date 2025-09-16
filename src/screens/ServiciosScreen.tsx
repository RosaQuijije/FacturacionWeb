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
  ScrollView,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { COLORS } from '../styles/global';
import {
  getServices,
  saveService,
  deleteService,
  Servicio,
  Catalogo,
  getCatalogos,
  Cliente,
  getClientes,
  saveCliente,
} from '../api/api';

// ---------- Utilidad para fechas ----------
const formatDate = (dateString?: string): string => {
  if (!dateString) return '';
  // Si ya viene en formato yyyy-mm-dd, lo devolvemos directo
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString;
  }
  // Si viene en ISO (con T y hora)
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0]; // <-- fuerza YYYY-MM-DD
};

export default function ServiceScreen() {
  const [services, setServices] = useState<Servicio[]>([]);
  const [catalogos, setCatalogos] = useState<Catalogo[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [clienteModalVisible, setClienteModalVisible] = useState(false);
  const [form, setForm] = useState<Partial<Servicio>>({
    idCliente: undefined,
    idCatalogo: undefined,
    fechaDesde: '',
    fechaHasta: '',
    estado: 'A',
    porcentajeDescuento: 0,
    precioUnitario: 0,
    porcentajeIva: 0,
    valorDescuento: 0,
    subtotal: 0,
    valorIva: 0,
    total: 0,
  });
  const [editing, setEditing] = useState<number | null>(null);
  const [error, setError] = useState<string>('');

  const [clienteForm, setClienteForm] = useState<Cliente>({
    tipoIdentificacion: 'C',
    numIdentificacion: '',
    nombre: '',
    apellido: '',
    direccion: '',
    email: '',
    telefono: '',
    estado: 'A',
  });

  // -------------------- Cargar datos --------------------
  const fetchServices = async () => {
    try {
      const data = await getServices();
      setServices(data.filter((s) => s.estado === 'A'));
    } catch (error) {
      console.log('Error cargando servicios:', error);
    }
  };

  const fetchCatalogos = async () => {
    try {
      const data = await getCatalogos();
      setCatalogos(data.filter((c) => c.tipo === 'S' && c.estado === 'A'));
    } catch (error) {
      console.log('Error cargando catálogos:', error);
    }
  };

  const fetchClientes = async () => {
    try {
      const data = await getClientes();
      setClientes(data.filter((c) => c.estado === 'A'));
    } catch (error) {
      console.log('Error cargando clientes:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      const fetchAll = async () => {
        await fetchClientes();
        await fetchCatalogos();
        await fetchServices();
      };
      fetchAll();
    }, [])
  );

  // -------------------- Función recálculo totales --------------------
  const recalcTotales = (formData: Partial<Servicio>): Partial<Servicio> => {
    const idCatalogo = Number(formData.idCatalogo);
    const catalogo = catalogos.find((c) => Number(c.idCatalogo) === idCatalogo);

    if (!catalogo) {
      return {
        ...formData,
        precioUnitario: 0,
        porcentajeIva: 0,
        valorDescuento: 0,
        subtotal: 0,
        valorIva: 0,
        total: 0,
      };
    }

    const precioUnitario = Number(catalogo.precio) || 0;
    const porcentajeIva = Number(catalogo.impuesto) || 0;
    const porcentajeDescuento = formData.porcentajeDescuento ?? 0;

    const valorDescuento = precioUnitario * (porcentajeDescuento / 100);
    const subtotal = precioUnitario - valorDescuento;
    const valorIva = subtotal * (porcentajeIva / 100);
    const total = subtotal + valorIva;

    return {
      ...formData,
      precioUnitario,
      porcentajeIva,
      valorDescuento,
      subtotal,
      valorIva,
      total,
    };
  };

  // -------------------- Modal Servicio --------------------
  const openForm = (service?: Servicio) => {
    setError('');
    if (service) {
      setForm(recalcTotales({
        ...service,
        fechaDesde: formatDate(service.fechaDesde),
        fechaHasta: formatDate(service.fechaHasta),
      }));
      setEditing(service.idServicio!);
    } else {
      setForm({
        idCliente: undefined,
        idCatalogo: undefined,
        fechaDesde: '',
        fechaHasta: '',
        estado: 'A',
        porcentajeDescuento: 0,
        precioUnitario: 0,
        porcentajeIva: 0,
        valorDescuento: 0,
        subtotal: 0,
        valorIva: 0,
        total: 0,
      });
      setEditing(null);
    }
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.idCliente) {
      setError('Seleccione un cliente');
      return;
    }
    if (!form.idCatalogo) {
      setError('Seleccione un catálogo');
      return;
    }
    if (!form.fechaDesde || !form.fechaHasta) {
      setError('Seleccione fechas');
      return;
    }

    const fechaDesde = new Date(form.fechaDesde);
    const fechaHasta = new Date(form.fechaHasta);
    const diffMeses =
      (fechaHasta.getFullYear() - fechaDesde.getFullYear()) * 12 +
      (fechaHasta.getMonth() - fechaDesde.getMonth());
    if (diffMeses < 1) {
      setError('El período debe ser mínimo 1 mes');
      return;
    }

    if (form.porcentajeDescuento! < 0 || form.porcentajeDescuento! > 100) {
      setError('Porcentaje de descuento debe ser entre 0 y 100');
      return;
    }

    try {
      await saveService({
        ...form,
        fechaDesde: form.fechaDesde ? formatDate(form.fechaDesde) : '',
        fechaHasta: form.fechaHasta ? formatDate(form.fechaHasta) : '',
        idServicio: editing ?? undefined,
      } as Servicio);

      setModalVisible(false);
      fetchServices();
    } catch (error) {
      console.log('Error guardando servicio:', error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteService(id);
      fetchServices();
    } catch (error) {
      console.log('Error eliminando servicio:', error);
    }
  };
  const [editingCliente, setEditingCliente] = useState<number | null>(null);
  // -------------------- Modal Cliente --------------------
  const openClienteModal = () => {
    if (form.idCliente) {
      const clienteSeleccionado = clientes.find(c => Number(c.idCliente) === Number(form.idCliente));
      if (clienteSeleccionado) {
        setClienteForm(clienteSeleccionado);
        setEditingCliente(clienteSeleccionado.idCliente!);
      } else {
        setClienteForm({
          tipoIdentificacion: 'C',
          numIdentificacion: '',
          nombre: '',
          apellido: '',
          direccion: '',
          email: '',
          telefono: '',
          estado: 'A',
        });
        setEditingCliente(null);
      }
    } else {
      setClienteForm({
        tipoIdentificacion: 'C',
        numIdentificacion: '',
        nombre: '',
        apellido: '',
        direccion: '',
        email: '',
        telefono: '',
        estado: 'A',
      });
      setEditingCliente(null);
    }

    // Pequeño delay para asegurar que clienteForm se actualice antes de abrir el modal
    setTimeout(() => {
      setClienteModalVisible(true);
    }, 0);
  };

  const handleSaveCliente = async () => {
    if (
      !clienteForm.tipoIdentificacion ||
      !clienteForm.numIdentificacion ||
      !clienteForm.nombre ||
      !clienteForm.apellido ||
      !clienteForm.email ||
      !clienteForm.telefono ||
      !clienteForm.direccion
    )
      return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(clienteForm.email)) return;

    const phoneRegex = /^[0-9]{7,15}$/;
    if (!phoneRegex.test(clienteForm.telefono)) return;

    try {
      await saveCliente(clienteForm);
      setClienteModalVisible(false);
      fetchClientes();
    } catch (error) {
      console.log('Error guardando cliente:', error);
    }
  };

  // -------------------- Render --------------------
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Proceso Servicios Recurrentes</Text>

      <FlatList
        data={services}
        keyExtractor={(item) => item.idServicio!.toString()}
        renderItem={({ item }) => {
          const cliente = clientes.find((c) => c.idCliente === item.idCliente);
          const catalogo = catalogos.find((c) => c.idCatalogo === item.idCatalogo);
          return (
            <View style={styles.item}>
              <View>
                <Text style={styles.itemText}>
                  {catalogo?.nombre} - Cliente:{' '}
                  {cliente ? `${cliente.nombre} ${cliente.apellido}` : 'Desconocido'}
                </Text>
                <Text style={styles.subItemText}>Total: ${item.total?.toFixed(2)}</Text>
                <Text style={styles.subItemText}>Estado: {item.estado === 'A' ? 'Activo' : 'Inactivo'}</Text>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity style={styles.edit} onPress={() => openForm(item)}>
                  <Text style={styles.actionText}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.delete} onPress={() => handleDelete(item.idServicio!)}>
                  <Text style={styles.actionText}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
        ListFooterComponent={() => (
          <TouchableOpacity style={styles.newButton} onPress={() => openForm()}>
            <Text style={styles.newButtonText}>Crear nuevo servicio</Text>
          </TouchableOpacity>
        )}
      />

      {/* Modal Servicio */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <ScrollView contentContainerStyle={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{editing ? 'Editar Servicio' : 'Crear Servicio'}</Text>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Text>Cliente</Text>
            <Picker
              selectedValue={form.idCliente}
              onValueChange={(value) => {
                setForm(prev => ({ ...prev, idCliente: value }));

                // Actualizamos clienteForm automáticamente
                const clienteSeleccionado = clientes.find(
                  c => Number(c.idCliente) === Number(value)
                );
                console.log('Picker seleccionó ID:', value, 'Cliente encontrado:', clienteSeleccionado);
                if (clienteSeleccionado) setClienteForm(clienteSeleccionado);
              }}
              style={styles.picker}
            >
            <Picker.Item label="Seleccione un cliente" value={undefined} />
              {clientes.map(c => (
                <Picker.Item key={c.idCliente} label={`${c.nombre} ${c.apellido}`} value={Number(c.idCliente)} />
              ))}
            </Picker>

            <TouchableOpacity style={styles.newButton} onPress={() => openClienteModal()}>
              <Text style={styles.newButtonText}>Crear/Editar Cliente</Text>
            </TouchableOpacity>

            <Text>Catálogo (Solo Servicios)</Text>
            <Picker
              selectedValue={form.idCatalogo}
              onValueChange={(value) => {
                const updatedForm = recalcTotales({ ...form, idCatalogo: value });
                setForm(updatedForm);
              }}
              style={styles.picker}
            >
              <Picker.Item label="Seleccione catálogo" value={undefined} />
              {catalogos.map((c) => (
                <Picker.Item key={c.idCatalogo} label={c.nombre} value={c.idCatalogo} />
              ))}
            </Picker>

            {/* Fechas adaptadas web */}
            <Text>Fecha Desde</Text>
            {Platform.OS === 'web' ? (
              <input
                type="date"
                value={form.fechaDesde ? new Date(form.fechaDesde).toISOString().split('T')[0] : ''}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, fechaDesde: e.target.value }));
                }}
                style={{ marginBottom: 10, padding: 8, borderRadius: 5, borderColor: COLORS.primary, borderWidth: 1 }}
              />
            ) : (
              <TextInput
                style={styles.input}
                value={form.fechaDesde || ''}
                placeholder="YYYY-MM-DD"
                onChangeText={(text) => setForm((prev) => ({ ...prev, fechaDesde: text }))}
              />
            )}

            <Text>Fecha Hasta</Text>
            {Platform.OS === 'web' ? (
              <input
                type="date"
                value={form.fechaHasta ? new Date(form.fechaHasta).toISOString().split('T')[0] : ''}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, fechaHasta: e.target.value }));
                }}
                style={{ marginBottom: 10, padding: 8, borderRadius: 5, borderColor: COLORS.primary, borderWidth: 1 }}
              />
            ) : (
              <TextInput
                style={styles.input}
                value={form.fechaHasta || ''}
                placeholder="YYYY-MM-DD"
                onChangeText={(text) => setForm((prev) => ({ ...prev, fechaHasta: text }))}
              />
            )}

            <Text>Porcentaje de Descuento (%)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={form.porcentajeDescuento?.toString()}
              onChangeText={(text) => setForm(recalcTotales({ ...form, porcentajeDescuento: parseFloat(text) || 0 }))}
            />

            {/* Totales calculados */}
            <Text>Precio Unitario: ${form.precioUnitario?.toFixed(2)}</Text>
            <Text>IVA (%): {form.porcentajeIva}</Text>
            <Text>Subtotal: ${form.subtotal?.toFixed(2)}</Text>
            <Text>Valor IVA: ${form.valorIva?.toFixed(2)}</Text>
            <Text>Valor Descuento: ${form.valorDescuento?.toFixed(2)}</Text>
            <Text>Total: ${form.total?.toFixed(2)}</Text>

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
        </ScrollView>
      </Modal>

      {/* Modal Cliente */}
      <Modal visible={clienteModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>
              {editingCliente ? 'Editar Cliente' : 'Crear Cliente'}
            </Text>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {/* Tipo de Identificación */}
            <Picker
              selectedValue={clienteForm.tipoIdentificacion}
              onValueChange={(value: string) =>
                setClienteForm({ ...clienteForm, tipoIdentificacion: value })
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
              value={clienteForm.numIdentificacion}
              onChangeText={(text) =>
                setClienteForm({ ...clienteForm, numIdentificacion: text })
              }
            />

            {/* Nombre y Apellido */}
            <TextInput
              style={styles.input}
              placeholder="Nombre"
              value={clienteForm.nombre}
              onChangeText={(text) =>
                setClienteForm({ ...clienteForm, nombre: text })
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Apellido"
              value={clienteForm.apellido}
              onChangeText={(text) =>
                setClienteForm({ ...clienteForm, apellido: text })
              }
            />

            {/* Dirección */}
            <TextInput
              style={styles.input}
              placeholder="Dirección"
              value={clienteForm.direccion}
              onChangeText={(text) =>
                setClienteForm({ ...clienteForm, direccion: text })
              }
            />

            {/* Email */}
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={clienteForm.email}
              onChangeText={(text) =>
                setClienteForm({ ...clienteForm, email: text })
              }
              keyboardType="email-address"
            />

            {/* Teléfono */}
            <TextInput
              style={styles.input}
              placeholder="Teléfono"
              value={clienteForm.telefono}
              onChangeText={(text) =>
                setClienteForm({ ...clienteForm, telefono: text })
              }
              keyboardType="numeric"
            />

            {/* Estado */}
            <Picker
              selectedValue={clienteForm.estado}
              onValueChange={(value: string) =>
                setClienteForm({ ...clienteForm, estado: value })
              }
              style={styles.picker}
              itemStyle={styles.pickerItem}
              enabled={false} 
            >
              <Picker.Item label="Activo" value="A" />
              <Picker.Item label="Inactivo" value="I" />
            </Picker>

            {/* Botones Cancelar / Guardar */}
            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: COLORS.secondary }]}
                onPress={() => setClienteModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: COLORS.primary }]}
                onPress={handleSaveCliente}
              >
                <Text style={styles.modalButtonText}>
                  {editingCliente ? 'Actualizar' : 'Guardar'}
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
  title: { fontSize: 30, fontWeight: 'bold', color: COLORS.primary, marginBottom: 20, textAlign: 'center' },
  item: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, borderBottomWidth: 1, borderColor: COLORS.secondary },
  itemText: { fontSize: 18, fontWeight: 'bold' },
  subItemText: { fontSize: 14, color: COLORS.secondary },
  actions: { flexDirection: 'row' },
  edit: { marginRight: 10, backgroundColor: COLORS.secondary, padding: 5, borderRadius: 5 },
  delete: { backgroundColor: '#ff4d4d', padding: 5, borderRadius: 5 },
  actionText: { color: COLORS.white },
  newButton: { backgroundColor: COLORS.primary, padding: 12, borderRadius: 8, alignItems: 'center', marginVertical: 8 },
  newButtonText: { color: COLORS.white, fontWeight: 'bold', fontSize: 16, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { backgroundColor: COLORS.white, padding: 20, borderRadius: 15, width: '85%' },
  modalTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 15, textAlign: 'center', color: COLORS.primary },
  errorText: { color: 'red', marginBottom: 10, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: COLORS.primary, borderRadius: 8, padding: 10, marginBottom: 10 },
  picker: { borderWidth: 1, borderColor: COLORS.primary, borderRadius: 8, marginBottom: 10, height: 50 },
  pickerItem: { fontSize: 20 },
  modalButtonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  modalButton: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center', marginHorizontal: 5 },
  modalButtonText: { color: COLORS.white, fontWeight: 'bold' },
});
