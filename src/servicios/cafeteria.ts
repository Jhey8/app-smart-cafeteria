import { z } from "zod";
import {
    esquemaBandeja,
    esquemaCategoria,
    esquemaCuenta,
    esquemaEmpresa,
    esquemaComprobante,
    esquemaEstadoDelPedido,
    esquemaHorario,
    esquemaPedidoCreado,
    esquemaPedidoDelHistorial,
    esquemaProducto,
    esquemaReclamacion,
    esquemaSesion,
} from "@/tipos/api";
import type { DatosDelComprobante } from "@/utils/comprobante";
import { ejecutar, obtener, pedir, subirImagen } from "./api";
import type { ImagenParaSubir } from "./foto";

/* Todo lo que la app le pide al backend, por el canal de las apps (/api/canal). */

export interface DatosDeRegistro {
    identificador: string;
    nombres: string;
    apellidos: string;
    /** Solo se usa con DNI; con código UTP el correo es el institucional. */
    correo: string | null;
    clave: string;
    telefono: string | null;
    /** Ley 29733: sin aceptarlos no se crea la cuenta. */
    aceptaTerminos: boolean;
}

export const entrar = (identificador: string, clave: string) =>
    pedir("POST", "/api/canal/auth/cliente", esquemaSesion, { identificador, clave });

/** Olvidé mi contraseña: el backend responde igual exista o no la cuenta. */
export const pedirCodigoDeRecuperacion = (identificador: string) => ejecutar("POST", "/api/canal/auth/recuperacion", { identificador });

/** Con el código del correo, la contraseña nueva. Devuelve la sesión ya abierta. */
export const cambiarClaveConCodigo = (identificador: string, codigo: string, claveNueva: string) =>
    pedir("POST", "/api/canal/auth/recuperacion/confirmacion", esquemaSesion, { identificador, codigo, claveNueva });

export const registrarme = (datos: DatosDeRegistro) => pedir("POST", "/api/canal/auth/registro", esquemaSesion, datos);

export const obtenerMenu = () => obtener("/api/canal/menu", z.array(esquemaProducto));

/** El plato express de hoy, o null si la cafetería no marcó ninguno (el backend responde 204). */
export const obtenerExpress = () => obtener("/api/canal/menu/express", esquemaProducto.nullable());

export const obtenerSugerencias = (idsEnElCarrito: readonly number[]) =>
    obtener(`/api/canal/menu/sugerencias?${idsEnElCarrito.map((id) => `para=${id}`).join("&")}`, z.array(esquemaProducto));

/** El comprobante es opcional: sin él, el backend emite una boleta sin documento. */
export const hacerPedido = (items: { productoId: number; cantidad: number }[], comprobante?: DatosDelComprobante) =>
    pedir("POST", "/api/canal/pedidos", esquemaPedidoCreado, { items, comprobante });

/** La boleta o factura de un pedido pagado (404 si todavía no tiene). */
export const obtenerComprobante = (idPedido: number) => obtener(`/api/canal/pedidos/${idPedido}/comprobante`, esquemaComprobante);

export const consultarPedido = (idPedido: number) => obtener(`/api/canal/pedidos/${idPedido}`, esquemaEstadoDelPedido);

export const misPedidos = () => obtener("/api/canal/pedidos/mios", z.array(esquemaPedidoDelHistorial));

export const cancelarPedido = (idPedido: number) => ejecutar("POST", `/api/canal/pedidos/${idPedido}/cancelacion`);

/** Las categorías activas del panel, en su orden. */
export const obtenerCategorias = () => obtener("/api/canal/categorias", z.array(esquemaCategoria));

export const obtenerHorario = () => obtener("/api/canal/horario", esquemaHorario);

/* La cuenta: siempre la propia, la que dice el token. */

export interface DatosDeCuenta {
    nombres: string;
    apellidos: string;
    correo: string | null;
    telefono: string | null;
}

export const obtenerCuenta = () => obtener("/api/canal/cuenta", esquemaCuenta);
export const editarCuenta = (datos: DatosDeCuenta) => pedir("PUT", "/api/canal/cuenta", esquemaCuenta, datos);
/** Cierra las demás sesiones y devuelve la nueva de este teléfono. */
export const cambiarClave = (claveActual: string, claveNueva: string) =>
    pedir("PUT", "/api/canal/cuenta/clave", esquemaSesion, { claveActual, claveNueva });
export const cerrarOtrasSesiones = () => pedir("POST", "/api/canal/cuenta/cerrar-otras-sesiones", esquemaSesion);
export const eliminarMiCuenta = (clave: string) => ejecutar("POST", "/api/canal/cuenta/eliminacion", { clave });
export const aceptarTerminos = () => pedir("POST", "/api/canal/cuenta/terminos", esquemaCuenta);
export const obtenerEmpresa = () => obtener("/api/canal/empresa", esquemaEmpresa);
export const cambiarPreferencias = (notificacionesPush: boolean) =>
    pedir("PUT", "/api/canal/cuenta/preferencias", esquemaCuenta, { notificacionesPush });
export const subirMiFoto = (imagen: ImagenParaSubir) => subirImagen("/api/canal/cuenta/foto", imagen, esquemaCuenta);
export const quitarMiFoto = () => pedir("DELETE", "/api/canal/cuenta/foto", esquemaCuenta);

/* La campana y el teléfono para el push. */

export const obtenerAvisos = () => obtener("/api/canal/notificaciones", esquemaBandeja);
export const marcarAvisosLeidos = () => ejecutar("POST", "/api/canal/notificaciones/leidas");
export const registrarTelefono = (token: string, plataforma: "ios" | "android") =>
    ejecutar("PUT", "/api/canal/notificaciones/telefono", { token, plataforma });
export const olvidarTelefono = (token: string) => ejecutar("DELETE", `/api/canal/notificaciones/telefono?token=${encodeURIComponent(token)}`);

/* Los favoritos (el corazón): cada llamada devuelve los ids como quedaron. */
export const obtenerFavoritos = () => obtener("/api/canal/favoritos", z.array(z.number()));
export const marcarFavorito = (idProducto: number) => pedir("PUT", `/api/canal/favoritos/${idProducto}`, z.array(z.number()));
export const quitarFavorito = (idProducto: number) => pedir("DELETE", `/api/canal/favoritos/${idProducto}`, z.array(z.number()));

/* El Libro de Reclamaciones. */

export interface HojaDeReclamacion {
    tipo: "RECLAMO" | "QUEJA";
    idPedido: number | null;
    nombres: string;
    tipoDocumento: "DNI" | "CE" | "PAS";
    numeroDocumento: string;
    correo: string;
    telefono: string | null;
    domicilio: string;
    menorDeEdad: boolean;
    apoderado: string | null;
    bien: "PRODUCTO" | "SERVICIO";
    monto: number | null;
    descripcionBien: string;
    detalle: string;
    pedidoConsumidor: string;
}

export const presentarReclamacion = (hoja: HojaDeReclamacion) => pedir("POST", "/api/canal/reclamaciones", esquemaReclamacion, hoja);
export const misReclamaciones = () => obtener("/api/canal/reclamaciones", z.array(esquemaReclamacion));
