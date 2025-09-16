import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, ScrollView, Dimensions } from 'react-native';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { getFacturas, getServices, getClientes, Factura, Servicio, Cliente } from '../api/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function HomeScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;

  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 5, useNativeDriver: true }),
    ]).start();
  }, []);

  const fetchData = async () => {
    try {
      const [facturasData, serviciosData, clientesData] = await Promise.all([
        getFacturas(),
        getServices(),
        getClientes(),
      ]);
      setFacturas(facturasData);
      setServicios(serviciosData);
      setClientes(clientesData);
    } catch (error) {
      console.error('Error cargando datos', error);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // refrescar cada 10s
    return () => clearInterval(interval);
  }, []);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // --- Facturas por Cliente ---
  const facturasPorCliente = facturas.reduce<Record<number, number>>((acc, factura) => {
    const total = factura.detalles.reduce((sum, d) => sum + d.totalLinea, 0);
    acc[factura.idCliente] = (acc[factura.idCliente] || 0) + total;
    return acc;
  }, {});

  const dataFacturas = {
    labels: Object.keys(facturasPorCliente).map(id => {
      const cliente = clientes.find(c => c.idCliente === Number(id));
      return cliente ? `${cliente.nombre} ${cliente.apellido}` : `Cliente ${id}`;
    }),
    datasets: [
      {
        label: 'Facturas',
        data: Object.values(facturasPorCliente),
        backgroundColor: '#4caf50',
        borderRadius: 5,
        barPercentage: 0.6,
      },
    ],
  };

  // --- Servicios Recurrentes vs Pendientes (Mes Actual) ---
  const primerDiaMes = new Date(currentYear, currentMonth, 1);
  const ultimoDiaMes = new Date(currentYear, currentMonth + 1, 0);

  // Filtrar servicios cuyo mes actual esté dentro de [fechaDesde, fechaHasta]
  const serviciosMesActual = servicios.filter(s => {
    const fechaDesde = new Date(s.fechaDesde);
    const fechaHasta = new Date(s.fechaHasta);
    return fechaDesde <= ultimoDiaMes && fechaHasta >= primerDiaMes;
  });

  // Recurrentes: servicios de este mes con fechaFacturacion en este mes
  const recurrentes = serviciosMesActual.filter(s => {
    if (!s.fechaFacturacion) return false;
    const fechaFact = new Date(s.fechaFacturacion);
    return fechaFact.getFullYear() === currentYear && fechaFact.getMonth() === currentMonth;
  }).length;

  // Pendientes: servicios de este mes sin fechaFacturacion en este mes
  const pendientes = serviciosMesActual.filter(s => {
    if (!s.fechaFacturacion) return true;
    const fechaFact = new Date(s.fechaFacturacion);
    return !(fechaFact.getFullYear() === currentYear && fechaFact.getMonth() === currentMonth);
  }).length;

  const totalServiciosMes = recurrentes + pendientes;

  const dataServicios = {
    labels: ['Mes Actual'],
    datasets: [
      {
        label: 'Recurrentes',
        data: [recurrentes],
        backgroundColor: '#2196f3',
        borderRadius: 5,
        barPercentage: 0.5,
      },
      {
        label: 'Pendientes',
        data: [pendientes],
        backgroundColor: '#f44336',
        borderRadius: 5,
        barPercentage: 0.5,
      },
    ],
  };

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 1000, easing: 'easeOutQuart' },
    plugins: {
      legend: { position: 'top' },
      title: { display: false },
      tooltip: {
        callbacks: {
          label: function (context) {
            const value = context.raw as number;
            if (context.dataset.label === 'Facturas') {
              // Redondear a 2 decimales
              return `${context.dataset.label}: ${value.toFixed(2)}`;
            }
            if (context.dataset.label === 'Pendientes') {
              const percentage = totalServiciosMes
                ? ((value / totalServiciosMes) * 100).toFixed(1)
                : '0';
              return `${context.dataset.label}: ${value} (${percentage}%)`;
            }
            return `${context.dataset.label}: ${value}`;
          },
        },
      },
    },
    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
  };

  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;
  const chartHeight = 400;

  return (
    <ScrollView contentContainerStyle={[styles.scrollContainer, { minHeight: screenHeight }]}>
      <View style={styles.header}>
        <Animated.Text style={[styles.logoText, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          TIGO
        </Animated.Text>
        <Text style={styles.subText}>Sistema de Facturación Web</Text>
      </View>

      <View style={styles.dashboard}>
        <Text style={styles.chartTitle}>Facturas por Cliente</Text>
        <View style={{ height: chartHeight, width: screenWidth * 0.9 }}>
          <Bar data={dataFacturas} options={options} />
        </View>
      </View>

      <View style={styles.dashboard}>
        <Text style={styles.chartTitle}>Servicios Recurrentes vs Pendientes (Mes Actual)</Text>
        <View style={{ height: chartHeight, width: screenWidth * 0.9 }}>
          <Bar data={dataServicios} options={options} />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  header: {
    marginBottom: 40,
    alignItems: 'center',
  },
  logoText: {
    fontSize: 100,
    fontWeight: 'bold',
    color: '#2196f3',
    textAlign: 'center',
  },
  subText: {
    fontSize: 40,
    color: '#2196f3',
    marginTop: 10,
    textAlign: 'center',
  },
  dashboard: {
    width: '100%',
    maxWidth: 1200,
    marginBottom: 50,
    padding: 20,
    borderRadius: 15,
    backgroundColor: '#f7f7f7',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: 26,
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
    fontWeight: '600',
  },
});
