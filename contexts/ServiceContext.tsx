import React, { createContext, useContext, ReactNode } from 'react';
import { IWalletService } from '@/services/interfaces/IWalletService';
import { INetworkService } from '@/services/interfaces/INetworkService';
import { IStorageService } from '@/services/interfaces/IStorageService';
import { IErrorHandler } from '@/services/interfaces/IErrorHandler';

export interface ServiceContextType {
  walletService: IWalletService;
  networkService: INetworkService;
  storageService: IStorageService;
  errorHandler: IErrorHandler;
}

const ServiceContext = createContext<ServiceContextType | null>(null);

export interface ServiceProviderProps {
  children: ReactNode;
  services: ServiceContextType;
}

export const ServiceProvider: React.FC<ServiceProviderProps> = ({ children, services }) => {
  return (
    <ServiceContext.Provider value={services}>
      {children}
    </ServiceContext.Provider>
  );
};

export const useServiceContext = (): ServiceContextType => {
  const context = useContext(ServiceContext);
  if (!context) {
    throw new Error('useServiceContext must be used within a ServiceProvider');
  }
  return context;
};

// Convenience hooks for specific services
export const useWalletService = (): IWalletService => {
  const { walletService } = useServiceContext();
  return walletService;
};

export const useNetworkService = (): INetworkService => {
  const { networkService } = useServiceContext();
  return networkService;
};

export const useStorageService = (): IStorageService => {
  const { storageService } = useServiceContext();
  return storageService;
};

export const useErrorHandler = (): IErrorHandler => {
  const { errorHandler } = useServiceContext();
  return errorHandler;
};
