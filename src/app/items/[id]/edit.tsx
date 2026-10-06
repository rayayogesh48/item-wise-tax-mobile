import { useLocalSearchParams } from 'expo-router';

import { NotFound } from '@/components/NotFound';
import { ItemForm } from '@/features/items/ItemForm';
import { useAppStore } from '@/store/useAppStore';

export default function EditItemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const item = useAppStore((s) => s.items.find((i) => i.id === id));
  return item ? <ItemForm item={item} /> : <NotFound title="Edit Item" message="This item no longer exists." />;
}
