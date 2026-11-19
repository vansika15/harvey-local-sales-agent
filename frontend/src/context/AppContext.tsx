import React, { createContext, useContext, useState, useEffect } from "react";
import { Company, Product, SystemHealth, HardwareProfile, ViewType } from "../types";
import { api } from "../api/client";

interface Toast {
  id: string;
  type: "success" | "error" | "info" | "warning";
  message: string;
}

interface AppContextType {
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
  companies: Company[];
  activeCompany: Company | null;
  setActiveCompany: (c: Company | null) => void;
  products: Product[];
  activeProduct: Product | null;
  setActiveProduct: (p: Product | null) => void;
  health: SystemHealth | null;
  hardware: HardwareProfile | null;
  isLoading: boolean;
  toasts: Toast[];
  addToast: (message: string, type?: "success" | "error" | "info" | "warning") => void;
  removeToast: (id: string) => void;
  refreshData: () => Promise<void>;
  toggleOffline: (enabled: boolean) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeView, setActiveView] = useState<ViewType>("overview");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [activeCompany, setActiveCompany] = useState<Company | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [hardware, setHardware] = useState<HardwareProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type: "success" | "error" | "info" | "warning" = "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => removeToast(id), 5000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const setAndStoreActiveCompany = (c: Company | null) => {
    setActiveCompany(c);
    if (c) {
      localStorage.setItem("harvey_active_company_id", String(c.id));
    } else {
      localStorage.removeItem("harvey_active_company_id");
    }
  };

  const setAndStoreActiveProduct = (p: Product | null) => {
    setActiveProduct(p);
    if (p) {
      localStorage.setItem("harvey_active_product_id", String(p.id));
    } else {
      localStorage.removeItem("harvey_active_product_id");
    }
  };

  const refreshData = async () => {
    try {
      const [healthData, hwData, compData] = await Promise.all([
        api.getHealth(),
        api.getHardware(),
        api.getCompanies(),
      ]);

      setHealth(healthData);
      setHardware(hwData);
      setCompanies(compData);

      // Default active company (respecting localStorage or current active)
      if (compData.length > 0) {
        const storedCompId = localStorage.getItem("harvey_active_company_id");
        const targetId = activeCompany?.id || (storedCompId ? Number(storedCompId) : null);
        const currentActive = compData.find((c) => c.id === targetId) || compData[0];
        setActiveCompany(currentActive);

        // Fetch products for active company
        const prodData = await api.getProducts(currentActive.id);
        setProducts(prodData);
        if (prodData.length > 0) {
          const storedProdId = localStorage.getItem("harvey_active_product_id");
          const targetProdId = activeProduct?.id || (storedProdId ? Number(storedProdId) : null);
          const currentProd = prodData.find((p) => p.id === targetProdId) || prodData[0];
          setActiveProduct(currentProd);
        } else {
          setActiveProduct(null);
        }
      }
    } catch (err: any) {
      console.error("Failed to load initial application state:", err);
      addToast(`Connection error: ${err.message}`, "error");
    } finally {
      setIsLoading(false);
    }
  };

  // When active company changes, reload its products
  useEffect(() => {
    if (activeCompany) {
      api.getProducts(activeCompany.id).then((prods) => {
        setProducts(prods);
        setActiveProduct(prods.length > 0 ? prods[0] : null);
      });
    }
  }, [activeCompany?.id]);

  useEffect(() => {
    refreshData();
    const interval = setInterval(async () => {
      try {
        const h = await api.getHealth();
        setHealth(h);
      } catch {}
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const toggleOffline = async (enabled: boolean) => {
    try {
      const res = await api.toggleOffline(enabled);
      setHealth((prev) => (prev ? { ...prev, offline_mode: res.offline_mode } : null));
      addToast(res.message, enabled ? "warning" : "success");
    } catch (err: any) {
      addToast(`Could not toggle offline mode: ${err.message}`, "error");
    }
  };

  return (
    <AppContext.Provider
      value={{
        activeView,
        setActiveView,
        companies,
        activeCompany,
        setActiveCompany: setAndStoreActiveCompany,
        products,
        activeProduct,
        setActiveProduct: setAndStoreActiveProduct,
        health,
        hardware,
        isLoading,
        toasts,
        addToast,
        removeToast,
        refreshData,
        toggleOffline,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within an AppProvider");
  return context;
};
