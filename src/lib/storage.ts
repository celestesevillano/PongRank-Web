// sessionStorage: se borra al cerrar la pestaña. El token de acceso vive solo en memoria.
export const storage = {
  getItem: async (key: string) => {
    try {
      return sessionStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      sessionStorage.setItem(key, value);
    } catch {
      return;
    }
  },
  deleteItem: async (key: string) => {
    try {
      sessionStorage.removeItem(key);
    } catch {
      return;
    }
  },
};
