# My Pets

A local-first React Native app for managing your pets, vet visits, documents, and reminders -- with offline support and real-time Supabase sync.

Built with Expo SDK 54, React Native 0.81, and the New Architecture.

## Features

- **Pet management** -- Add dogs and cats with photos, birth dates, and vet contact info
- **Vet visits** -- Schedule vaccinations, checkups, and emergencies with reminders
- **File storage** -- Attach PDFs, images, and documents to each pet; in-app PDF viewer
- **AI lab analysis** -- Analyze veterinary lab PDFs with Claude AI; extracts lab values, generates interpretations, and tracks trends across visits
- **Offline-first** -- Everything works without internet; data syncs when connectivity returns
- **Real-time sync** -- Supabase Realtime pushes changes across devices instantly
- **Notifications** -- Configurable reminders before each vet visit
- **Liquid Glass** -- Transparent formSheet UI on iOS 26+ using expo-glass-effect
- **Dark mode** -- Automatic theme based on system preference

## Tech Stack

| Layer      | Technology                                                                                                  |
| ---------- | ----------------------------------------------------------------------------------------------------------- |
| Framework  | [Expo](https://expo.dev) ~54, [React Native](https://reactnative.dev) 0.81                                  |
| Navigation | [Expo Router](https://docs.expo.dev/router/introduction/) v6 (file-based, typed routes)                     |
| Local DB   | [expo-sqlite](https://docs.expo.dev/versions/latest/sdk/sqlite/) + [Drizzle ORM](https://orm.drizzle.team/) |
| Remote DB  | [Supabase](https://supabase.com) (PostgreSQL, Storage, Realtime)                                            |
| State      | [TanStack Query](https://tanstack.com/query) v5                                                             |
| Forms      | [React Hook Form](https://react-hook-form.com) + [Zod](https://zod.dev) v4                                  |
| Animations | [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/) v4                           |
| Gestures   | [React Native Gesture Handler](https://docs.swmansion.com/react-native-gesture-handler/)                    |
| AI         | [Claude API](https://docs.anthropic.com) via Supabase Edge Functions                                        |
| PDF Viewer | [react-native-webview](https://github.com/nicolo-ribaudo/react-native-webview)                               |
| Glass UI   | [expo-glass-effect](https://docs.expo.dev/versions/latest/sdk/glass-effect/) (iOS 26+)                       |
| Network    | [@react-native-community/netinfo](https://github.com/react-native-netinfo/react-native-netinfo)             |

## Architecture

### Hooks-first pattern

Every screen has a dedicated custom hook that owns all logic. Components only own JSX and styling.

```
app/(tabs)/index.tsx          ->  hooks/usePetListScreen.ts
app/pets/[id]/index.tsx       ->  hooks/usePetDetailScreen.ts
app/pets/[id]/visits/new.tsx  ->  hooks/useNewVisitScreen.ts
```

### Data flow

```
UI (Screens / Components)
        |
Screen Hooks (usePetListScreen, usePetDetailScreen, ...)
        |
Data Hooks (usePets, useVisits, usePetFiles)  <-  TanStack Query
        |
Repositories (db/repositories/)
        |
Drizzle ORM  ->  SQLite (local)
                      |  sync
                  Supabase (remote)
```

### Offline-first sync

All reads and writes go to the local SQLite database first. A bidirectional sync engine handles replication with Supabase:

1. **Push** -- Local records marked `pending` are upserted to Supabase, files uploaded to Storage
2. **Pull** -- Remote changes since `lastSyncAt` are merged into local DB (last-write-wins)
3. **Delete** -- Soft deletes via `deleted_at` on remote, hard deletes on local

Sync triggers automatically on:

- App launch
- App returning to foreground
- Device reconnecting after being offline
- Supabase Realtime events from another device (debounced 500ms)
- Manual "Sync Now" button in Settings

### Provider hierarchy

```
DatabaseProvider -> QueryClientProvider -> NetworkProvider -> GestureHandlerRootView
```

## Project Structure

```
app/
  (tabs)/
    index.tsx              # Pet list (2-column grid)
    settings.tsx           # Sync status, notifications, about
    _layout.tsx            # Native tab bar (pawprint + gear)
  pets/
    new.tsx                # Create pet form
    [id]/
      index.tsx            # Pet detail (visits, files, info)
      edit.tsx             # Edit pet form
      visits/new.tsx       # Schedule vet visit
  visits/
    [id]/
      index.tsx            # Visit detail (files, notes)
      edit.tsx             # Edit vet visit
  analyses/
    [id]/index.tsx         # Lab results detail (values, interpretation, AI disclaimer)
  analyzing/
    [id].tsx               # Analysis loading formSheet (liquid glass on iOS 26+)
  pdf-viewer/
    [id].tsx               # In-app PDF viewer (WebView)
  _layout.tsx              # Root layout, providers, offline banner

hooks/
  usePetListScreen.ts      # Pet list screen logic
  usePetDetailScreen.ts    # Pet detail screen logic
  useNewPetScreen.ts       # New pet form logic
  useEditPetScreen.ts      # Edit pet form logic
  useNewVisitScreen.ts     # New visit form logic
  useEditVisitScreen.ts    # Edit visit form logic
  useVisitDetailScreen.ts  # Visit detail screen logic
  useSettingsScreen.ts     # Settings screen logic
  useAnalysisDetailScreen.ts # Lab results screen logic
  useAnalyzingScreen.ts    # Analysis loading screen logic
  usePdfViewerScreen.ts    # PDF viewer screen logic
  usePets.ts               # Pet queries and mutations
  useVisits.ts             # Visit queries and mutations
  usePetFiles.ts           # File queries and mutations
  useFileAnalyses.ts       # Analysis queries and mutations (Claude AI)
  useNetworkStatus.tsx     # NetworkProvider + connectivity hook
  useRealtimeSync.ts       # Supabase Realtime subscriptions
  useNotifications.ts      # Notification setup and scheduling

components/
  PetCard.tsx              # Grid card with image + glass name overlay
  VisitCard.tsx            # Swipeable row card with type icons
  FileCard.tsx             # Document card with swipe-to-delete, analyze chip, PDF viewer
  PetForm.tsx              # Reusable pet form (create + edit)
  VisitForm.tsx            # Reusable visit form (create + edit)
  OfflineBanner.tsx        # Animated offline status banner

db/
  schema.ts                # Drizzle table definitions
  client.ts                # SQLite initialization
  provider.tsx             # Database React context
  repositories/
    pets.ts                # Pet CRUD operations
    visits.ts              # Visit CRUD operations
    petFiles.ts            # File CRUD operations
    fileAnalyses.ts        # Analysis CRUD operations

services/
  sync.ts                  # Bidirectional sync engine
  supabase.ts              # Supabase client
  notifications.ts         # Notification scheduling
  analysis.ts              # Claude AI PDF analysis (via Supabase Edge Function)

lib/
  queryClient.ts           # TanStack Query configuration
  queryKeys.ts             # Cache key constants
```

## Database Schema

### Local (SQLite via Drizzle ORM)

**pets** -- `id`, `name`, `species` (dog | cat), `birthDate`, `imageUri`, `vetName`, `vetPhone`, `vetAddress`, `createdAt`, `updatedAt`, `syncStatus`

**vet_visits** -- `id`, `petId` (FK cascade), `type` (vaccination | checkup | emergency | other), `title`, `notes`, `scheduledDate`, `completed`, `completedDate`, `reminderDays`, `notificationId`, `createdAt`, `updatedAt`, `syncStatus`

**pet_files** -- `id`, `petId` (FK cascade), `visitId` (FK cascade, optional), `name`, `uri` (local path), `remoteUri` (Supabase Storage URL), `fileType`, `fileSize`, `createdAt`, `syncStatus`

**file_analyses** -- `id`, `fileId` (FK cascade), `petId` (FK cascade), `visitId` (FK cascade, optional), `status` (pending | processing | completed | failed), `labValues` (JSON), `summary`, `interpretation`, `errorMessage`, `analyzedAt`, `createdAt`, `updatedAt`, `syncStatus`

**sync_meta** -- Key-value store tracking `last_sync_at`

Every entity carries a `syncStatus` field: `"pending"` | `"synced"` | `"conflict"`.

### Remote (Supabase PostgreSQL)

Mirrors the local schema with snake_case column names plus a `deleted_at` column for soft deletes.

## Getting Started

### Prerequisites

- Node.js 18+
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- iOS Simulator or Android Emulator (or a physical device with [Expo Dev Client](https://docs.expo.dev/develop/development-builds/introduction/))
- A [Supabase](https://supabase.com) project with:
  - Tables: `pets`, `vet_visits`, `pet_files` (matching the schema above, with `deleted_at` text column on each)
  - Storage bucket: `pet-files` (public access)
  - Realtime enabled on all three tables (Database > Replication)

### Setup

```bash
# Clone the repository
git clone https://github.com/guillermovelasco/my-pets.git
cd my-pets

# Install dependencies
npm install

# Configure environment variables
cp .env.local.example .env.local
```

Edit `.env.local` with your Supabase credentials:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

```bash
# Start the development server
npx expo start
```

### Scripts

| Command                    | Description                 |
| -------------------------- | --------------------------- |
| `npm start`                | Start Expo dev server       |
| `npm run ios`              | Run on iOS simulator        |
| `npm run android`          | Run on Android emulator     |
| `npm run lint`             | Run ESLint                  |
| `npm run build:dev`        | EAS development build (iOS) |
| `npm run build:production` | EAS production build (iOS)  |

## License

MIT
