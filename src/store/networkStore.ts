/**
 * networkStore.ts — Zustand store for real-time network connectivity state.
 *
 * Uses @react-native-community/netinfo to subscribe to connectivity changes.
 * Call `initNetworkListener()` once in the root layout.
 */

import { create } from 'zustand';
import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';

interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  connectionType: string | null;

  // Called once in root layout — returns the unsubscribe function
  initListener: () => () => void;
}

export const useNetworkStore = create<NetworkState>((set) => ({
  isConnected: true,           // optimistic default
  isInternetReachable: null,
  connectionType: null,

  initListener: () => {
    // Fetch current state immediately on first call
    NetInfo.fetch().then((state: NetInfoState) => {
      set({
        isConnected: state.isConnected ?? true,
        isInternetReachable: state.isInternetReachable,
        connectionType: state.type,
      });
    });

    // Subscribe to future changes
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      set({
        isConnected: state.isConnected ?? true,
        isInternetReachable: state.isInternetReachable,
        connectionType: state.type,
      });
    });

    return unsubscribe;
  },
}));

// Convenience selectors
export const useIsConnected = () => useNetworkStore((s) => s.isConnected);
export const useIsInternetReachable = () => useNetworkStore((s) => s.isInternetReachable);
