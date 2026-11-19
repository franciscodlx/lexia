jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
)

jest.mock('react-native-reanimated', () => {
  const mock = require('react-native-reanimated/mock')
  const makeMutable = (initial: unknown) => {
    const sv = {
      value: initial,
      get: () => sv.value,
      set: (next: unknown) => {
        sv.value = typeof next === 'function' ? next(sv.value) : next
      },
    }
    return sv
  }
  // The bundled mock's makeMutable lacks the .get()/.set() API — always override
  return { ...mock, makeMutable }
})

jest.mock('react-native-haptic-feedback', () => ({
  trigger: jest.fn(),
}))

jest.mock('@notifee/react-native', () => ({
  __esModule: true,
  default: {
    requestPermission: jest.fn().mockResolvedValue({ authorizationStatus: 1 }),
    createChannel: jest.fn().mockResolvedValue('daily-reminder'),
    createTriggerNotification: jest.fn().mockResolvedValue('id'),
    cancelTriggerNotification: jest.fn().mockResolvedValue(undefined),
  },
  AuthorizationStatus: { NOT_DETERMINED: -1, DENIED: 0, AUTHORIZED: 1, PROVISIONAL: 2 },
  AndroidImportance: { DEFAULT: 3 },
  RepeatFrequency: { DAILY: 1 },
  TriggerType: { TIMESTAMP: 0 },
}))

jest.mock('react-native-purchases', () => ({
  __esModule: true,
  default: {
    configure: jest.fn(),
    setLogLevel: jest.fn(),
    getOfferings: jest.fn().mockResolvedValue({ current: null }),
    getCustomerInfo: jest.fn().mockResolvedValue({ entitlements: { active: {} } }),
    purchasePackage: jest.fn(),
    restorePurchases: jest.fn().mockResolvedValue({ entitlements: { active: {} } }),
  },
  LOG_LEVEL: { VERBOSE: 'VERBOSE', ERROR: 'ERROR' },
}))
