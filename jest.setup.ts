// Global mocks for native modules used in integration tests.
// These run before every test file via setupFilesAfterEnv.

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: "Light", Medium: "Medium", Heavy: "Heavy" },
  NotificationFeedbackType: {
    Success: "Success",
    Warning: "Warning",
    Error: "Error",
  },
}));

jest.mock("expo-notifications", () => ({
  scheduleNotificationAsync: jest.fn().mockResolvedValue("notification-id"),
  cancelScheduledNotificationAsync: jest.fn().mockResolvedValue(undefined),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  setNotificationHandler: jest.fn(),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({
    remove: jest.fn(),
  })),
}));

jest.mock("@sentry/react-native", () => ({
  captureException: jest.fn(),
  init: jest.fn(),
  wrap: (component: unknown) => component,
}));

jest.mock("@/services/sync", () => ({
  syncWithSupabase: jest.fn().mockResolvedValue(undefined),
  pushDeleteToSupabase: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@/hooks/useNotifications", () => ({
  scheduleNotificationForVisit: jest.fn().mockResolvedValue(undefined),
  cancelNotificationForVisit: jest.fn().mockResolvedValue(undefined),
  useNotificationSetup: jest.fn(),
}));

jest.mock("expo-document-picker", () => ({
  getDocumentAsync: jest.fn().mockResolvedValue({ canceled: true }),
}));

jest.mock("expo-file-system", () => ({
  Directory: jest.fn().mockImplementation(() => ({
    exists: true,
    create: jest.fn(),
  })),
  File: jest.fn().mockImplementation(() => ({
    copy: jest.fn(),
    uri: "file://mock-path",
  })),
  Paths: { document: "file://mock-documents" },
}));

jest.mock("expo-image-picker", () => ({
  launchImageLibraryAsync: jest.fn().mockResolvedValue({ canceled: true }),
}));

jest.mock("expo-image", () => ({
  Image: "Image",
}));

jest.mock("@react-native-community/datetimepicker", () => "DateTimePicker");

jest.mock("react-native-keyboard-controller", () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { ScrollView } = require("react-native");
  return {
    KeyboardAwareScrollView: ScrollView,
    KeyboardProvider: ({ children }: { children: React.ReactNode }) => children,
  };
});

jest.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons",
}));

jest.mock("react-native-safe-area-context", () => {
  const inset = { top: 0, right: 0, bottom: 0, left: 0 };
  return {
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
    SafeAreaConsumer: ({
      children,
    }: {
      children: (insets: typeof inset) => React.ReactNode;
    }) => children(inset),
    useSafeAreaInsets: () => inset,
    useSafeAreaFrame: () => ({ x: 0, y: 0, width: 390, height: 844 }),
  };
});

jest.mock("@/hooks/usePetFiles", () => ({
  useFilesByPet: jest.fn(() => ({ data: [], isLoading: false })),
  useAddPetFile: jest.fn(() => ({ mutateAsync: jest.fn() })),
  useDeletePetFile: jest.fn(() => ({ mutateAsync: jest.fn() })),
}));

jest.mock("@/hooks/useFileAnalyses", () => ({
  useAnalyzePdf: jest.fn(() => ({ mutate: jest.fn(), isPending: false })),
}));
