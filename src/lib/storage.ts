export const storage = {
  getItem: async (key: string) => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch {
      return;
    }
  },
  deleteItem: async (key: string) => {
    try {
      localStorage.removeItem(key);
    } catch {
      return;
    }
  },
};
