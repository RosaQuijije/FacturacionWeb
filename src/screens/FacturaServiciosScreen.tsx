import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient'; // <-- CORREGIDO
import { useFocusEffect } from '@react-navigation/native';
import { Servicio, getServices, Cliente, getClientes, Catalogo, getCatalogos, saveFactura, saveService } from '../api/api';
import { COLORS } from '../styles/global';

export default function ServiciosRecurrentesScreen() {
  const [services, setServices] = useState<Servicio[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [catalogos, setCatalogos] = useState<Catalogo[]>([]);
  const [popup, setPopup] = useState<{ visible: boolean; mensaje: string }>({ visible: false, mensaje: '' });

  const hoy = new Date();

  const fetchAll = async () => {
    try {
      const serviciosData = await getServices();
      const clientesData = await getClientes();
      const catalogosData = await getCatalogos();

      setClientes(clientesData.filter(c => c.estado === 'A'));
      setCatalogos(catalogosData.filter(c => c.estado === 'A' && c.tipo === 'S'));

      const recurrentes = serviciosData.filter(s => {
        const fechaDesdeObj = new Date(s.fechaDesde);
        const fechaHastaObj = new Date(s.fechaHasta);
        return fechaDesdeObj <= hoy && fechaHastaObj >= hoy;
      });

      recurrentes.sort((a, b) => (b.idServicio! - a.idServicio!));
      setServices(recurrentes);
    } catch (error) {
      console.log('Error cargando datos:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchAll();
    }, [])
  );

  const generarFactura = async (service: Servicio) => {
    const fechaDesdeObj = new Date(service.fechaDesde);
    const fechaHastaObj = new Date(service.fechaHasta);

    if (fechaDesdeObj > hoy || fechaHastaObj < hoy) {
      setPopup({ visible: true, mensaje: 'El servicio no está dentro del rango de fechas válido para facturar.' });
      return;
    }

    if (service.fechaFacturacion) {
      const fechaFactObj = new Date(service.fechaFacturacion);
      if (fechaFactObj.getMonth() === hoy.getMonth() && fechaFactObj.getFullYear() === hoy.getFullYear()) {
        setPopup({ visible: true, mensaje: 'Este servicio ya fue facturado este mes.' });
        return;
      }
    }

    try {
      const facturaCreada = await saveFactura({
        idCliente: service.idCliente!,
        fecha: hoy.toISOString(),
        estado: 'A',
        formaPago: 'OUSF',
        comentario: '',
        detalles: [{
          idCatalogo: service.idCatalogo!,
          cantidad: 1,
          precioUnitario: service.precioUnitario,
          porcentajeIva: service.porcentajeIva,
          porcentajeDescuento: service.porcentajeDescuento ?? 0,
          subtotalLinea: service.subtotal,
          valorIva: service.valorIva,
          valorDescuento: service.valorDescuento,
          totalLinea: service.total
        }]
      });

      await saveService({ 
        ...service, 
        fechaFacturacion: hoy.toISOString(), 
        idServicio: service.idServicio 
      });

      setPopup({ visible: true, mensaje: `Factura generada correctamente. ID Factura: ${facturaCreada.idFactura}` });
      fetchAll();
    } catch (error) {
      console.log('Error generando factura:', error);
      setPopup({ visible: true, mensaje: 'No se pudo generar la factura.' });
    }
  };

  const renderItem = ({ item }: { item: Servicio }) => {
    const cliente = clientes.find(c => c.idCliente === item.idCliente);
    const catalogo = catalogos.find(c => c.idCatalogo === item.idCatalogo);

    const yaFacturadoEsteMes = item.fechaFacturacion 
      ? new Date(item.fechaFacturacion).getMonth() === hoy.getMonth() &&
        new Date(item.fechaFacturacion).getFullYear() === hoy.getFullYear()
      : false;

    const formatDate = (fecha?: string) => fecha ? new Date(fecha).toLocaleDateString('es-ES') : '-';

    return (
      <LinearGradient
        colors={['#e0f7fa', '#ffffff']}
        style={styles.itemGradient as any} // <-- necesario para TypeScript
      >
        <Text style={styles.itemTitle}>{catalogo?.nombre}</Text>
        <Text style={styles.labelValue}>ID Servicio: {item.idServicio}</Text>
        <Text style={styles.labelValue}>Cliente: {cliente ? `${cliente.nombre} ${cliente.apellido}` : 'Desconocido'}</Text>
        <Text style={styles.labelValue}>Fecha Desde: {formatDate(item.fechaDesde)}</Text>
        <Text style={styles.labelValue}>Fecha Hasta: {formatDate(item.fechaHasta)}</Text>
        <Text style={styles.labelValue}>Fecha Facturación: {formatDate(item.fechaFacturacion)}</Text>
        <Text style={styles.labelValue}>Total: ${item.total?.toFixed(2)}</Text>
        <Text style={styles.labelValue}>Estado: {yaFacturadoEsteMes ? '✔ Facturado este mes' : 'Activo'}</Text>

        <TouchableOpacity
          style={[styles.button, yaFacturadoEsteMes && styles.buttonDisabled]}
          onPress={() => generarFactura(item)}
          disabled={yaFacturadoEsteMes}
        >
          <Text style={styles.buttonText}>{yaFacturadoEsteMes ? 'Facturado' : 'Generar Factura'}</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Servicios Recurrentes del Mes</Text>
      <FlatList
        data={services}
        keyExtractor={item => item.idServicio!.toString()}
        renderItem={renderItem}
      />

      <Modal transparent visible={popup.visible} animationType="fade">
        <View style={styles.popupOverlay}>
          <View style={styles.popupBox}>
            <Text style={styles.popupText}>{popup.mensaje}</Text>
            <TouchableOpacity style={styles.button} onPress={() => setPopup({ visible: false, mensaje: '' })}>
              <Text style={styles.buttonText}>Aceptar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: COLORS.white },
  title: { fontSize: 24, fontWeight: 'bold', color: COLORS.primary, marginBottom: 15, textAlign: 'center' },
  itemGradient: { padding: 12, borderRadius: 12, marginBottom: 10, elevation: 3 },
  itemTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 4, color: COLORS.primary },
  labelValue: { fontSize: 16, color: '#000000', marginVertical: 1 },
  button: { backgroundColor: COLORS.primary, padding: 10, borderRadius: 5, marginTop: 8, alignItems: 'center' },
  buttonText: { color: COLORS.white, fontWeight: 'bold' },
  buttonDisabled: { backgroundColor: '#999' },
  popupOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  popupBox: { backgroundColor: COLORS.white, padding: 20, borderRadius: 10, width: '80%', alignItems: 'center' },
  popupText: { fontSize: 16, marginBottom: 15, textAlign: 'center' },
});
