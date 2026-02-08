# Project Guidelines

## Architecture: Hooks-first pattern

Always extract screen/component logic into a dedicated custom hook.

- Every screen `app/foo/index.tsx` should have a corresponding `hooks/useFooScreen.ts`
- Every complex component `components/FooCard.tsx` can have `hooks/useFooCard.ts` if it has non-trivial logic
- The hook owns: data loading, state, handlers (handlePress, handleDelete, etc.)
- The component/screen only owns: JSX rendering, styling

### Naming convention

| Screen / Component | Hook |
|-|-|
| `app/(tabs)/index.tsx` (pet list) | `hooks/usePetListScreen.ts` |
| `app/pets/[id]/index.tsx` (pet detail) | `hooks/usePetDetailScreen.ts` |
| `app/pets/[id]/visits/new.tsx` | `hooks/useNewVisitScreen.ts` |

### Example structure

```ts
// hooks/usePetListScreen.ts
export function usePetListScreen() {
  const { pets, isLoading } = usePets();

  const handleItemPress = useCallback((id: string) => { ... }, []);
  const handleItemDelete = useCallback((id: string) => { ... }, []);

  return { pets, isLoading, handleItemPress, handleItemDelete };
}

// app/(tabs)/index.tsx
export default function PetListScreen() {
  const { pets, isLoading, handleItemPress, handleItemDelete } = usePetListScreen();
  // Only JSX here
}
```

## Performance: useCallback and useMemo

### When to use useCallback

- Handlers passed as props to list items (FlatList/FlashList `renderItem`, item callbacks)
- Handlers passed to memoized components (`React.memo`)
- Functions used as dependencies in other hooks (`useEffect`, `useMemo`)

### When to use useMemo

- Filtered/sorted/transformed arrays derived from state (e.g. filtering a pet list)
- Expensive computations (parsing, formatting large datasets)

### When NOT to bother

- Handlers that stay inside the same component and aren't passed down
- Simple values like strings, numbers, booleans
- Objects/arrays that are already cheap to create
