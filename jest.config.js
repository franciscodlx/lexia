module.exports = {
  preset: 'react-native',
  setupFiles: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-navigation|nativewind|react-native-css-interop|react-native-reanimated|react-native-worklets|react-native-haptic-feedback|@notifee)/)',
  ],
  testPathIgnorePatterns: ['/node_modules/', '/ios/', '/android/'],
}
