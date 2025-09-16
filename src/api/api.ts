import axios from 'axios';

// URL de tu backend Spring Boot
const API_BASE_URL = "http://localhost:9090";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ---------------------------
// Login
// ---------------------------
export interface LoginResponse {
  mensaje: string;
}

export const login = async (nombreUsuario: string, claveUsuario: string): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>('/users/login', { nombreUsuario, claveUsuario });
  return response.data;
};

// ---------------------------
// Tipos
// ---------------------------
export interface Cliente {
  idCliente?: number;
  nombre: string;
  apellido: string;
  direccion: string;
  email: string;
  telefono: string;
  estado: string; // "A" activo, "I" inactivo
  tipoIdentificacion: string; // "C" cedula, "R" ruc, "P" pasaporte
  numIdentificacion: string;
}

// Tipo para la respuesta HAL
interface ClientesEmbedded {
  clients: Cliente[];
}

interface ClientesResponse {
  _embedded?: ClientesEmbedded;
}

// ---------------------------
// Clientes
// ---------------------------
export const getClientes = async (): Promise<Cliente[]> => {
  const response = await api.get<ClientesResponse>('/clients');
  return response.data._embedded?.clients || [];
};

export const getClienteById = async (id: number): Promise<Cliente> => {
  const response = await api.get<Cliente>(`/clients/${id}`);
  return response.data;
};

export const saveCliente = async (cliente: Cliente): Promise<Cliente> => {
  if (cliente.idCliente) {
    const response = await api.put<Cliente>(`/clients/${cliente.idCliente}`, cliente);
    return response.data;
  } else {
    const response = await api.post<Cliente>('/clients', cliente);
    return response.data;
  }
};

export const deleteCliente = async (id: number): Promise<void> => {
  await api.delete(`/clients/${id}`);
};

// ---------------------------
// Tipos Catálogo
// ---------------------------
export interface Catalogo {
  idCatalogo?: number;
  nombre: string;
  precio: number;
  cantidad: number;
  impuesto: number; // solo 15 o 0
  tipo: string; // "P" producto, "S" servicio
  estado: string; // "A" activo, "I" inactivo
}

// Tipo para la respuesta HAL de catálogos
interface CatalogosEmbedded {
  catalogs: Catalogo[]; 
}

interface CatalogosResponse {
  _embedded?: CatalogosEmbedded;
}

// ---------------------------
// Catálogos
// ---------------------------
export const getCatalogos = async (): Promise<Catalogo[]> => {
  const response = await api.get<CatalogosResponse>('/catalogs'); 
  return response.data._embedded?.catalogs || [];
};

export const getCatalogoById = async (id: number): Promise<Catalogo> => {
  const response = await api.get<Catalogo>(`/catalogs/${id}`);
  return response.data;
};

export const saveCatalogo = async (catalogo: Catalogo): Promise<Catalogo> => {
  if (catalogo.idCatalogo) {
    const response = await api.put<Catalogo>(`/catalogs/${catalogo.idCatalogo}`, catalogo);
    return response.data;
  } else {
    const response = await api.post<Catalogo>('/catalogs', catalogo);
    return response.data;
  }
};

export const deleteCatalogo = async (id: number): Promise<void> => {
  await api.delete(`/catalogs/${id}`);
};

// ---------------------------
// Tipos Servicio
// ---------------------------
export interface Servicio {
  idServicio?: number;
  idCliente: number;
  idCatalogo: number;
  fecha: string;
  fechaDesde: string;
  fechaHasta: string;
  estado: string; // "A" activo, "I" inactivo
  porcentajeIva: number;
  porcentajeDescuento: number;
  precioUnitario: number;
  valorIva: number;
  valorDescuento: number;
  subtotal: number;
  total: number;
  fechaFacturacion?: string;
}

// Tipo para respuesta HAL de servicios
interface ServicesEmbedded {
  services: Servicio[];
}

interface ServicesResponse {
  _embedded?: ServicesEmbedded;
}

// ---------------------------
// Servicios
// ---------------------------
export const getServices = async (): Promise<Servicio[]> => {
  const response = await api.get<ServicesResponse>('/services');
  return response.data._embedded?.services || [];
};

export const getServiceById = async (id: number): Promise<Servicio> => {
  const response = await api.get<Servicio>(`/services/${id}`);
  return response.data;
};

export const saveService = async (service: Servicio): Promise<Servicio> => {
  if (service.idServicio) {
    const response = await api.put<Servicio>(`/services/${service.idServicio}`, service);
    return response.data;
  } else {
    const response = await api.post<Servicio>('/services', service);
    return response.data;
  }
};

export const deleteService = async (id: number): Promise<void> => {
  await api.delete(`/services/${id}`);
};

// ---------------------------
// Factura
// ---------------------------
export interface DetalleFactura {
  idDetalle?: number;
  idCatalogo: number;
  cantidad: number;
  precioUnitario: number;
  porcentajeIva: number;
  porcentajeDescuento: number;
  valorIva: number;
  valorDescuento: number;
  subtotalLinea: number;
  totalLinea: number;
}

export interface Factura {
  idFactura?: number;
  fecha: string;
  idCliente: number;
  estado: string; // "A" activo, "I" inactivo
  formaPago: 'SUSF' | 'TC' | 'OUSF';
  comentario: string;
  detalles: DetalleFactura[];
}

interface FacturasEmbedded {
  invoices: Factura[];
}
interface FacturasResponse {
  _embedded?: FacturasEmbedded;
}

export const getFacturas = async (): Promise<Factura[]> => {
  const response = await api.get<Factura[]>('/invoices');
  return response.data; // ya es un array, no necesitas _embedded
};

export const getFacturaById = async (id: number): Promise<Factura> => {
  const response = await api.get<Factura>(`/invoices/${id}`);
  return response.data;
};

export const saveFactura = async (factura: Factura): Promise<Factura> => {
  console.log("Guardando factura:", factura);

  if (factura.idFactura) {
    const response = await api.put<Factura>(`/invoices/${factura.idFactura}`, factura);
    console.log("Factura actualizada:", response.data);
    return response.data;
  } else {
    const response = await api.post<Factura>('/invoices', factura);
    console.log("Factura creada:", response.data);
    return response.data;
  }
};

export const deleteFactura = async (id: number): Promise<void> => {
  await api.delete(`/invoices/${id}`);
};

export const anularFactura = async (id: number): Promise<Factura> => {
  console.log(`Anulando factura con ID: ${id}`);
  const factura = await getFacturaById(id);
  console.log("Factura original:", factura);

  const facturaAnulada = { ...factura, estado: 'I' };
  const response = await api.put<Factura>(`/invoices/${id}`, facturaAnulada);
  console.log("Factura anulada:", response.data);
  return response.data;
};

