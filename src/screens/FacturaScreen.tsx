import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useFocusEffect } from '@react-navigation/native';
import { Cliente, getClientes, saveCliente, Catalogo, getCatalogos, Factura, saveFactura, DetalleFactura } from '../api/api';
import { COLORS } from '../styles/global';

export default function FacturaScreen() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [catalogos, setCatalogos] = useState<Catalogo[]>([]);
  const [factura, setFactura] = useState<Factura>({
    idCliente: 0,
    fecha: new Date().toISOString().split('T')[0],
    estado: 'A',
    formaPago: 'SUSF',
    comentario: '',
    detalles: [],
  });
  const [clienteModalVisible, setClienteModalVisible] = useState(false);
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
  const [editingCliente, setEditingCliente] = useState<number | null>(null);
  const [mensajeError, setMensajeError] = useState<string>('');

  // Modal de éxito
  const [modalExitoVisible, setModalExitoVisible] = useState(false);
  const [idFacturaCreada, setIdFacturaCreada] = useState<number | null>(null);

  const fetchClientes = async () => {
    const data = await getClientes();
    setClientes(data.filter(c => c.estado === 'A'));
  };

  const fetchCatalogos = async () => {
    const data = await getCatalogos();
    setCatalogos(data.filter(c => c.estado === 'A'));
  };

  useFocusEffect(
    useCallback(() => {
      fetchClientes();
      fetchCatalogos();
    }, [])
  );

  // ------------------ Detalles ------------------
  const agregarLinea = () => {
    const catalogo = catalogos[0];
    if (!catalogo) return;
    const linea: DetalleFactura = {
      idCatalogo: catalogo.idCatalogo!,
      cantidad: 1,
      precioUnitario: catalogo.precio,
      porcentajeIva: catalogo.impuesto,
      porcentajeDescuento: 0,
      subtotalLinea: catalogo.precio,
      valorIva: catalogo.precio * (catalogo.impuesto / 100),
      valorDescuento: 0,
      totalLinea: catalogo.precio * (1 + catalogo.impuesto / 100),
    };
    setFactura(prev => ({ ...prev, detalles: [...prev.detalles, linea] }));
  };

  const actualizarLinea = (index: number, campo: keyof DetalleFactura, valor: number) => {
    setFactura(prev => {
      const detalles = [...prev.detalles];
      const linea = { ...detalles[index] };
      const catalogo = catalogos.find(c => c.idCatalogo === linea.idCatalogo);
      if (catalogo?.tipo === 'S' && campo === 'cantidad') valor = 1;
      linea[campo] = valor;

      const cantidad = linea.cantidad ?? 1;
      const precioUnitario = linea.precioUnitario;
      const porcentajeIva = linea.porcentajeIva;
      const porcentajeDescuento = linea.porcentajeDescuento;
      const valorDescuento = precioUnitario * (porcentajeDescuento / 100) * cantidad;
      const subtotalLinea = precioUnitario * cantidad - valorDescuento;
      const valorIva = subtotalLinea * (porcentajeIva / 100);
      const totalLinea = subtotalLinea + valorIva;

      linea.subtotalLinea = subtotalLinea;
      linea.valorDescuento = valorDescuento;
      linea.valorIva = valorIva;
      linea.totalLinea = totalLinea;

      detalles[index] = linea;
      return { ...prev, detalles };
    });
  };

  const eliminarLinea = (index: number) => {
    setFactura(prev => ({ ...prev, detalles: prev.detalles.filter((_, i) => i !== index) }));
  };

  // ------------------ Cliente Modal ------------------
  const abrirClienteModal = () => {
    if (factura.idCliente) {
      const c = clientes.find(c => c.idCliente === factura.idCliente);
      if (c) {
        setClienteForm(c);
        setEditingCliente(c.idCliente!);
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
    setClienteModalVisible(true);
  };

  const guardarCliente = async () => {
    if (!clienteForm.nombre || !clienteForm.apellido) {
      setMensajeError('Nombre y apellido son obligatorios');
      return;
    }
    await saveCliente(clienteForm);
    setClienteModalVisible(false);
    fetchClientes();
  };

  // ------------------ Guardar Factura ------------------
  const guardarFactura = async () => {
    if (!factura.idCliente) {
      setMensajeError('Seleccione un cliente');
      return;
    }
    if (factura.detalles.length === 0) {
      setMensajeError('Agregue al menos una línea');
      return;
    }
    setMensajeError('');
    try {
      const facturaAEnviar = {
        ...factura,
        fecha: new Date().toISOString(),
        detalles: factura.detalles.map(d => ({
          idCatalogo: d.idCatalogo,
          cantidad: Number(d.cantidad),
          precioUnitario: Number(d.precioUnitario),
          porcentajeIva: Number(d.porcentajeIva),
          porcentajeDescuento: Number(d.porcentajeDescuento),
          subtotalLinea: Number(d.subtotalLinea),
          valorIva: Number(d.valorIva),
          valorDescuento: Number(d.valorDescuento),
          totalLinea: Number(d.totalLinea),
        }))
      };

      const facturaCreada = await saveFactura(facturaAEnviar);
      setIdFacturaCreada(facturaCreada.idFactura ?? null);
      setModalExitoVisible(true);

      setFactura({
        idCliente: 0,
        fecha: new Date().toISOString().split('T')[0],
        estado: 'A',
        formaPago: 'SUSF',
        comentario: '',
        detalles: [],
      });

    } catch (error) {
      console.log('Error al guardar factura', error);
      setMensajeError('No se pudo guardar la factura');
    }
  };

  // ------------------ Totales ------------------
  const totalSubtotal = factura.detalles.reduce((s, d) => s + d.subtotalLinea, 0);
  const totalIva = factura.detalles.reduce((s, d) => s + d.valorIva, 0);
  const totalDescuento = factura.detalles.reduce((s, d) => s + d.valorDescuento, 0);
  const totalGeneral = factura.detalles.reduce((s, d) => s + d.totalLinea, 0);

  // ------------------ Render ------------------
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ alignItems: 'center', paddingBottom: 20 }}>
      <View style={styles.card}>
        <Text style={styles.title}>Crear Factura</Text>
        {mensajeError ? <Text style={{ color: 'red', marginBottom: 5 }}>{mensajeError}</Text> : null}

        <Text>Cliente</Text>
        <Picker
          selectedValue={factura.idCliente}
          onValueChange={(v) => setFactura({ ...factura, idCliente: Number(v) })}
          style={[styles.picker, { height: 50 }]}
        >
          <Picker.Item label="Seleccione un cliente" value={0} />
          {clientes.map(c => (<Picker.Item key={c.idCliente} label={`${c.nombre} ${c.apellido}`} value={c.idCliente} />))}
        </Picker>

        <TouchableOpacity style={styles.button} onPress={abrirClienteModal}>
          <Text style={styles.buttonText}>{editingCliente ? 'Editar Cliente' : 'Crear Cliente'}</Text>
        </TouchableOpacity>

        <Text>Fecha</Text>
        <TextInput style={styles.input} value={factura.fecha} editable={false} />

        <Text>Forma de Pago</Text>
        <Picker
          selectedValue={factura.formaPago}
          onValueChange={(v) => setFactura({ ...factura, formaPago: v })}
          style={[styles.picker, { height: 50 }]}
        >
          <Picker.Item label="SIN UTILIZACIÓN DEL SISTEMA FINANCIERO" value="SUSF" />
          <Picker.Item label="TARJETA DE CRÉDITO" value="TC" />
          <Picker.Item label="OTROS CON UTILIZACIÓN DEL SISTEMA FINANCIERO" value="OUSF" />
        </Picker>

        <Text>Comentario</Text>
        <TextInput style={styles.input} value={factura.comentario} onChangeText={(t) => setFactura({ ...factura, comentario: t })} />

        <Text style={{ fontWeight: 'bold', marginTop: 10 }}>Detalles</Text>
        <ScrollView style={{ maxHeight: 400, marginVertical: 5 }}>
          {factura.detalles.map((d, i) => (
            <View key={i} style={styles.detalleCard}>
              <Text>Producto/Servicio</Text>
              <Picker
                selectedValue={d.idCatalogo}
                onValueChange={(v) => {
                  const catalogo = catalogos.find(c => c.idCatalogo === Number(v));
                  if (!catalogo) return;
                  actualizarLinea(i, 'idCatalogo', Number(v));
                  actualizarLinea(i, 'precioUnitario', catalogo.precio);
                  actualizarLinea(i, 'porcentajeIva', catalogo.impuesto);
                }}
                style={[styles.picker, { height: 50 }]}
              >
                {catalogos.map(c => (<Picker.Item key={c.idCatalogo} label={c.nombre} value={c.idCatalogo} />))}
              </Picker>

              <Text>Cantidad</Text>
              <TextInput style={styles.input} value={d.cantidad.toString()} keyboardType="numeric"
                onChangeText={t => actualizarLinea(i, 'cantidad', parseInt(t) || 1)}
              />

              <Text>% Descuento</Text>
              <TextInput style={styles.input} value={d.porcentajeDescuento.toString()} keyboardType="numeric"
                onChangeText={t => actualizarLinea(i, 'porcentajeDescuento', parseFloat(t) || 0)}
              />

              <Text>Precio Unitario: ${d.precioUnitario.toFixed(2)}</Text>
              <Text>IVA: {d.porcentajeIva}%</Text>
              <Text>Subtotal: ${d.subtotalLinea.toFixed(2)}</Text>
              <Text>Valor IVA: ${d.valorIva.toFixed(2)}</Text>
              <Text>Valor Descuento: ${d.valorDescuento.toFixed(2)}</Text>
              <Text>Total Línea: ${d.totalLinea.toFixed(2)}</Text>
              <TouchableOpacity style={[styles.button, { backgroundColor: '#ff4d4d' }]} onPress={() => eliminarLinea(i)}><Text style={styles.buttonText}>Eliminar Línea</Text></TouchableOpacity>
            </View>
          ))}
        </ScrollView>

        <TouchableOpacity style={styles.button} onPress={agregarLinea}><Text style={styles.buttonText}>Agregar Línea</Text></TouchableOpacity>

        <Text style={{ fontWeight: 'bold', marginTop: 10 }}>Totales Generales:</Text>
        <Text>Subtotal: ${totalSubtotal.toFixed(2)}</Text>
        <Text>Valor IVA: ${totalIva.toFixed(2)}</Text>
        <Text>Valor Descuento: ${totalDescuento.toFixed(2)}</Text>
        <Text>Total General: ${totalGeneral.toFixed(2)}</Text>

        <TouchableOpacity style={[styles.button, { marginTop: 10 }]} onPress={guardarFactura}><Text style={styles.buttonText}>Guardar Factura</Text></TouchableOpacity>
      </View>

      {/* Modal Cliente */}
      <Modal visible={clienteModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{editingCliente ? 'Editar Cliente' : 'Crear Cliente'}</Text>
            <TextInput style={styles.input} placeholder="Nombre" value={clienteForm.nombre} onChangeText={t => setClienteForm({ ...clienteForm, nombre: t })} />
            <TextInput style={styles.input} placeholder="Apellido" value={clienteForm.apellido} onChangeText={t => setClienteForm({ ...clienteForm, apellido: t })} />
            <TextInput style={styles.input} placeholder="Email" value={clienteForm.email} onChangeText={t => setClienteForm({ ...clienteForm, email: t })} />
            <TextInput style={styles.input} placeholder="Teléfono" value={clienteForm.telefono} onChangeText={t => setClienteForm({ ...clienteForm, telefono: t })} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <TouchableOpacity style={[styles.button, { flex: 1, marginRight: 5 }]} onPress={() => setClienteModalVisible(false)}><Text style={styles.buttonText}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.button, { flex: 1 }]} onPress={guardarCliente}><Text style={styles.buttonText}>Guardar</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Éxito */}
      <Modal visible={modalExitoVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>¡Factura Creada!</Text>
            <Text style={{ textAlign: 'center', marginVertical: 10 }}>
              La factura se creó correctamente{ idFacturaCreada ? ` con ID: ${idFacturaCreada}` : '' }.
            </Text>
            <TouchableOpacity style={styles.button} onPress={() => setModalExitoVisible(false)}>
              <Text style={styles.buttonText}>Aceptar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
}

// ------------------ Styles ------------------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  card: { width: '90%', padding: 15, backgroundColor: '#f9f9f9', borderRadius: 10, marginVertical: 10, elevation: 2 },
  detalleCard: { width: '100%', borderWidth: 1, borderColor: '#ccc', padding: 8, marginBottom: 5, borderRadius: 5, backgroundColor: '#fff' },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: COLORS.primary, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#8ecae6', borderRadius: 5, padding: 8, marginBottom: 5, backgroundColor: '#fff' },
  button: { backgroundColor: COLORS.primary, padding: 10, borderRadius: 5, alignItems: 'center', marginTop: 5 },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  picker: { borderWidth: 1, borderColor: '#8ecae6', borderRadius: 5, marginBottom: 5, backgroundColor: '#fff', fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { width: '80%', backgroundColor: '#fff', padding: 20, borderRadius: 10 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
});
