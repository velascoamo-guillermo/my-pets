import { syncWithSupabase } from "@/services/sync";
import NetInfo from "@react-native-community/netinfo";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

type NetworkStatusContextValue = {
  isConnected: boolean;
};

const NetworkStatusContext = createContext<NetworkStatusContextValue>({
  isConnected: true,
});

export function NetworkProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(true);
  const wasConnectedRef = useRef(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const connected = state.isConnected ?? true;
      setIsConnected(connected);

      // Trigger sync when transitioning from offline → online
      if (connected && !wasConnectedRef.current) {
        syncWithSupabase().catch(() => {});
      }

      wasConnectedRef.current = connected;
    });

    return unsubscribe;
  }, []);

  return (
    <NetworkStatusContext.Provider value={{ isConnected }}>
      {children}
    </NetworkStatusContext.Provider>
  );
}

export function useNetworkStatus(): NetworkStatusContextValue {
  return useContext(NetworkStatusContext);
}
