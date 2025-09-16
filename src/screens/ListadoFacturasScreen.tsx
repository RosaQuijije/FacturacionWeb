import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Factura, getFacturas, saveFactura, Cliente, getClientes, Catalogo, getCatalogos } from '../api/api';
import { COLORS } from '../styles/global';

export default function ListadoFacturasScreen() {
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [catalogos, setCatalogos] = useState<Catalogo[]>([]);
  const [mensajeModal, setMensajeModal] = useState<string>('');
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [expandedFacturaIds, setExpandedFacturaIds] = useState<number[]>([]); 
  const closeButtonRef = useRef<any>(null);

  const fetchClientes = async () => {
    try {
      const data = await getClientes();
      setClientes(data.filter(c => c.estado === 'A'));
    } catch (error) {
      console.error("Error al obtener clientes", error);
    }
  };

  const fetchCatalogos = async () => {
    try {
      const data = await getCatalogos();
      setCatalogos(data.filter(c => c.estado === 'A'));
    } catch (error) {
      console.error("Error al obtener catálogos", error);
    }
  };

  const fetchFacturas = async () => {
    try {
      const data = await getFacturas();
      const ordenadas = data.sort((a, b) => (b.idFactura || 0) - (a.idFactura || 0));
      setFacturas(ordenadas || []);
    } catch (error) {
      console.error("Error al obtener facturas", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchClientes();
      fetchCatalogos();
      fetchFacturas();
    }, [])
  );

  const anularFactura = async (factura: Factura) => {
    if (!factura.idFactura) return;
    try {
      await saveFactura({ ...factura, estado: 'I' });
      setMensajeModal(`La factura ${factura.idFactura} ha sido anulada correctamente.`);
      setModalVisible(true);
      fetchFacturas();
    } catch (error) {
      console.error('Error al anular factura', error);
      setMensajeModal('No se pudo anular la factura');
      setModalVisible(true);
    }
  };

  const getClienteNombre = (idCliente: number) => {
    const cliente = clientes.find(c => c.idCliente === idCliente);
    return cliente ? `${cliente.nombre} ${cliente.apellido}` : 'Desconocido';
  };

  const getCatalogoNombre = (idCatalogo: number) => {
    const cat = catalogos.find(c => c.idCatalogo === idCatalogo);
    return cat ? cat.nombre : `ID ${idCatalogo}`;
  };

  const toggleFacturaExpand = (id: number) => {
    if (expandedFacturaIds.includes(id)) {
      setExpandedFacturaIds(expandedFacturaIds.filter(fId => fId !== id));
    } else {
      setExpandedFacturaIds([...expandedFacturaIds, id]);
    }
  };

  const formaPagoTexto = (formaPago: 'SUSF' | 'TC' | 'OUSF') => {
    switch (formaPago) {
      case 'OUSF': return 'OTROS CON UTILIZACIÓN DEL SISTEMA FINANCIERO';
      case 'SUSF': return 'SIN UTILIZACIÓN DEL SISTEMA FINANCIERO';
      case 'TC': return 'TARJETA DE CRÉDITO';
      default: return formaPago;
    }
  };

  useEffect(() => {
    if (modalVisible && closeButtonRef.current) {
      const timer = setTimeout(() => { closeButtonRef.current?.focus?.(); }, 300);
      return () => clearTimeout(timer);
    }
  }, [modalVisible]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ alignItems: 'center', paddingBottom: 20 }}>
      <Text style={styles.title}>Listado de Facturas</Text>

      {facturas.length === 0 ? (
        <Text style={{ marginTop: 20, color: 'gray' }}>No hay facturas disponibles</Text>
      ) : (
        facturas.map((f) => {
          const totalLineas = (f.detalles ?? []).reduce((s, d) => s + (d.totalLinea || 0), 0);
          const cantidadArticulos = (f.detalles ?? []).reduce((s, d) => s + (d.cantidad || 0), 0);
          const isExpanded = expandedFacturaIds.includes(f.idFactura || 0);

          return (
            <View key={f.idFactura} style={styles.card}>
              <TouchableOpacity onPress={() => toggleFacturaExpand(f.idFactura || 0)}>
                <Text style={styles.facturaHeader}>
                  Factura #{f.idFactura} - Cliente: {getClienteNombre(f.idCliente)} ({f.estado === 'A' ? 'Activo' : 'Anulado'})
                </Text>
                <Text>Cantidad vendida: {cantidadArticulos}</Text>
                <Text>Total: ${totalLineas.toFixed(2)}</Text>
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.detallesContainer}>
                  <Text style={styles.detalleTexto}>Forma de Pago: {formaPagoTexto(f.formaPago)}</Text>
                  <Text style={styles.detalleTexto}>Comentario: {f.comentario}</Text>
                  <Text style={[styles.detalleTexto, { marginBottom: 5 }]}>Productos / Servicios:</Text>
                  {(f.detalles ?? []).map((d, i) => (
                    <View key={i} style={styles.articuloCard}>
                      <Text style={styles.articuloNombre}>{getCatalogoNombre(d.idCatalogo)}</Text>
                      <Text>Cantidad: {d.cantidad}</Text>
                      <Text>Precio Unitario: ${d.precioUnitario}</Text>
                      <Text>Total Línea: ${d.totalLinea.toFixed(2)}</Text>
                    </View>
                  ))}
                  <TouchableOpacity
                    style={[styles.button, { backgroundColor: f.estado === 'A' ? '#ff4d4d' : '#ccc', marginTop: 5 }]}
                    onPress={() => anularFactura(f)}
                    disabled={f.estado !== 'A'}
                  >
                    <Text style={styles.buttonText}>Anular</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })
      )}

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalText}>{mensajeModal}</Text>
            <TouchableOpacity
              ref={closeButtonRef}
              style={[styles.button, { marginTop: 10, backgroundColor: COLORS.primary }]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.buttonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  card: {
    width: '90%',
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    marginVertical: 10,
    elevation: 2,
  },
  facturaHeader: { fontWeight: 'bold', fontSize: 16, marginBottom: 5 },
  detallesContainer: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#ddd' },
  detalleTexto: { fontSize: 14, marginBottom: 3 },
  articuloCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 8,
    marginVertical: 5,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
  },
  articuloNombre: { fontWeight: 'bold', marginBottom: 3 },
  title: { fontSize: 20, fontWeight: 'bold', marginVertical: 10, color: COLORS.primary, textAlign: 'center' },
  button: { padding: 10, borderRadius: 5, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { width: '80%', backgroundColor: '#fff', padding: 20, borderRadius: 10, alignItems: 'center' },
  modalText: { fontSize: 16, textAlign: 'center' },
});
