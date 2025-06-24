"use client";
import React, { createContext, useContext, useState } from 'react';

export type WizardFormData = Record<string, any>;

const FormWizardContext = createContext<{
  data: WizardFormData;
  setData: (d: WizardFormData) => void;
}>({
  data: {},
  setData: () => {},
});

export function useFormWizard() {
  return useContext(FormWizardContext);
}

export function FormWizardProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<WizardFormData>({});
  return (
    <FormWizardContext.Provider value={{ data, setData }}>
      {children}
    </FormWizardContext.Provider>
  );
}
