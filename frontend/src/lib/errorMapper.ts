import axios from 'axios';

/**
 * Centralizador de mapeo de errores de Axios / API para DOK'S POS
 * Traduce respuestas del backend y estados de red a mensajes limpios en español.
 */
export function parseAxiosError(error: unknown, fallbackMessage: string = 'Ocurrió un error inesperado'): string {
  if (!error) return fallbackMessage;

  // Error de red (Servidor apagado o desconectado)
  if (
    (typeof error === 'object' && 'code' in error && (error as Record<string, unknown>).code === 'ERR_NETWORK') ||
    (typeof window !== 'undefined' && !window.navigator.onLine)
  ) {
    return 'No se pudo conectar con el servidor. Verifica tu conexión a internet o si el backend está encendido.';
  }

  // Si es un error de Axios
  if (axios.isAxiosError(error)) {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      // Si el backend (NestJS) envió mensajes estructurados
      if (data && typeof data === 'object' && 'message' in data) {
        const msg = (data as Record<string, unknown>).message;
        if (Array.isArray(msg)) {
          return msg.join('. ');
        }
        return String(msg);
      }

      // Fallback por códigos de estado estándar
      switch (status) {
        case 400:
          return 'Datos inválidos. Por favor verifica la información del formulario.';
        case 401:
          return 'Sesión no autorizada o expirada. Vuelve a ingresar tu PIN.';
        case 403:
          return 'Acceso denegado. No tienes permisos para realizar esta operación.';
        case 404:
          return 'El registro solicitado no existe o fue eliminado.';
        case 409:
          return 'Conflicto: Ya existe un registro con estos datos únicos en el sistema.';
        case 500:
          return 'Error interno en el servidor. Inténtalo de nuevo más tarde.';
        default:
          return `Error del servidor (${status}). Comunícate con soporte.`;
      }
    }

    // Error de timeout
    if (error.code === 'ECONNABORTED') {
      return 'La petición tardó demasiado tiempo en responder. Límite de tiempo excedido.';
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallbackMessage;
}
