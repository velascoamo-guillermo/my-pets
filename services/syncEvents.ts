type Listener = () => void;

const listeners = new Set<Listener>();

export const syncEvents = {
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  emit() {
    listeners.forEach((l) => l());
  },
};
