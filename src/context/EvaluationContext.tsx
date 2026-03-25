import React, { createContext, useContext, useState } from 'react';

export interface DatasetConfig {
  name: string;
  root: string;
  batch_size: number;
  num_workers: number;
}

export interface ModelConfig {
  architecture: string;
  pretrained: boolean;
  weights_path: string | null;
  num_classes: number;
  input_size: [number, number, number];
}

export interface AttackConfig {
  fgsm?: { enabled: boolean; eps?: number };
  pgd?: { enabled: boolean; eps?: number; alpha?: number; steps?: number };
  cw?: { enabled: boolean; c?: number; kappa?: number; steps?: number; lr?: number };
  jsma?: { enabled: boolean; theta?: number; gamma?: number };
  deepfool?: { enabled: boolean; overshoot?: number; max_iter?: number };
}

export interface EvaluationConfig {
  dataset: DatasetConfig;
  model: ModelConfig;
  attacks: AttackConfig;
}

interface EvaluationContextType {
  config: EvaluationConfig;
  updateConfig: (config: Partial<EvaluationConfig>) => void;
  resetConfig: () => void;
}

const DEFAULT_CONFIG: EvaluationConfig = {
  dataset: {
    name: 'cifar10',
    root: './data/cifar',
    batch_size: 32,
    num_workers: 2,
  },
  model: {
    architecture: 'resnet50',
    pretrained: true,
    weights_path: null,
    num_classes: 10,
    input_size: [3, 32, 32],
  },
  attacks: {
    fgsm: { enabled: true, eps: 0.03 },
    pgd: { enabled: false, eps: 0.03, alpha: 0.007, steps: 10 },
    cw: { enabled: false, c: 0.001, kappa: 0.0, steps: 200, lr: 0.01 },
    jsma: { enabled: false },
    deepfool: { enabled: false },
  },
};

const EvaluationContext = createContext<EvaluationContextType | undefined>(undefined);

export const EvaluationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<EvaluationConfig>(DEFAULT_CONFIG);

  const updateConfig = (newConfig: Partial<EvaluationConfig>) => {
    setConfig((prev) => ({ ...prev, ...newConfig }));
  };

  const resetConfig = () => {
    setConfig(DEFAULT_CONFIG);
  };

  return (
    <EvaluationContext.Provider value={{ config, updateConfig, resetConfig }}>
      {children}
    </EvaluationContext.Provider>
  );
};

export const useEvaluation = () => {
  const context = useContext(EvaluationContext);
  if (!context) {
    throw new Error('useEvaluation must be used within EvaluationProvider');
  }
  return context;
};
