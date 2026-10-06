import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { seedItems, seedParties, seedSales, seedSettings, seedTaxRates } from '@/domain/seed';
import type { Item, Party, Sale, Settings, TaxRate } from '@/domain/types';

export const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

type Data = {
  settings: Settings;
  taxRates: TaxRate[];
  items: Item[];
  parties: Party[];
  sales: Sale[];
};

type AppState = Data & {
  hydrated: boolean;
  storageError: boolean;
  updateSettings: (patch: Partial<Settings>) => void;
  addTaxRate: (rate: Omit<TaxRate, 'id' | 'kind'>) => void;
  updateTaxRate: (id: string, patch: Pick<TaxRate, 'name' | 'rate'>) => void;
  deleteTaxRate: (id: string) => void;
  saveItem: (item: Omit<Item, 'id'> & { id?: string }) => string;
  addParty: (party: Omit<Party, 'id'>) => void;
  /** Stores the sale snapshot and reduces stock. Saved sales are never edited afterwards. */
  addSale: (sale: Sale) => void;
  resetDemoData: () => void;
};

const seed = (): Data => ({
  settings: seedSettings,
  taxRates: seedTaxRates,
  items: seedItems,
  parties: seedParties,
  sales: seedSales,
});

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      ...seed(),
      hydrated: false,
      storageError: false,
      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
      addTaxRate: (rate) => set((s) => ({ taxRates: [...s.taxRates, { ...rate, id: newId(), kind: 'custom' }] })),
      updateTaxRate: (id, patch) =>
        set((s) => ({ taxRates: s.taxRates.map((r) => (r.id === id ? { ...r, ...patch } : r)) })),
      deleteTaxRate: (id) => set((s) => ({ taxRates: s.taxRates.filter((r) => r.id !== id) })),
      saveItem: (item) => {
        const id = item.id ?? newId();
        set((s) => ({
          items: item.id ? s.items.map((i) => (i.id === id ? { ...item, id } : i)) : [{ ...item, id }, ...s.items],
        }));
        return id;
      },
      addParty: (party) => set((s) => ({ parties: [...s.parties, { ...party, id: newId() }] })),
      addSale: (sale) =>
        set((s) => ({
          sales: [sale, ...s.sales],
          items: s.items.map((item) => {
            const sold = sale.lines.filter((l) => l.itemId === item.id).reduce((a, l) => a + l.quantity, 0);
            return item.stock === null || sold === 0 ? item : { ...item, stock: item.stock - sold };
          }),
        })),
      resetDemoData: () => set(seed()),
    }),
    {
      name: 'karobar-item-wise-tax-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ settings, taxRates, items, parties, sales }) => ({ settings, taxRates, items, parties, sales }),
      onRehydrateStorage: () => (_state, error) => {
        useAppStore.setState({ hydrated: true, storageError: Boolean(error) });
      },
    },
  ),
);

export const nextInvoiceNumber = (sales: Sale[]) => sales.reduce((max, s) => Math.max(max, s.number), 0) + 1;

/** A rate is "used" once an item or a saved sale refers to it; used rates cannot be deleted. */
export function isTaxRateUsed(id: string, items: Item[], sales: Sale[]): boolean {
  return (
    items.some((item) => item.taxRateId === id) ||
    sales.some((sale) => sale.lines.some((line) => line.taxRateId === id))
  );
}

// Transient UI feedback (toast / snackbar). Not persisted.
type Toast = { id: number; message: string; actionLabel?: string; onAction?: () => void };

export const useToastStore = create<{ toast: Toast | null; show: (t: Omit<Toast, 'id'>) => void; hide: () => void }>(
  (set) => ({
    toast: null,
    show: (toast) => set({ toast: { ...toast, id: Date.now() } }),
    hide: () => set({ toast: null }),
  }),
);

export const showToast = (message: string, actionLabel?: string, onAction?: () => void) =>
  useToastStore.getState().show({ message, actionLabel, onAction });
