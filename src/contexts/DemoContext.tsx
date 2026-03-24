import { createContext, useContext, useState, ReactNode } from "react";

type DemoRole = "consultant" | "client" | "admin" | null;

interface DemoContextType {
  isDemoMode: boolean;
  demoRole: DemoRole;
  enableDemo: (role: DemoRole) => void;
  disableDemo: () => void;
}

const DemoContext = createContext<DemoContextType>({
  isDemoMode: false,
  demoRole: null,
  enableDemo: () => {},
  disableDemo: () => {},
});

export const useDemo = () => useContext(DemoContext);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoRole, setDemoRole] = useState<DemoRole>(null);

  const enableDemo = (role: DemoRole) => {
    setIsDemoMode(true);
    setDemoRole(role);
  };

  const disableDemo = () => {
    setIsDemoMode(false);
    setDemoRole(null);
  };

  return (
    <DemoContext.Provider value={{ isDemoMode, demoRole, enableDemo, disableDemo }}>
      {children}
    </DemoContext.Provider>
  );
}
