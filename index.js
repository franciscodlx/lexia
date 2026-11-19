/**
 * @format
 */

// Must be first: React Native's built-in URL/URLSearchParams are incomplete and
// supabase-js needs the full API (Expo used to provide this polyfill).
import 'react-native-url-polyfill/auto'
import { AppRegistry } from 'react-native'
import App from './App'
import { name as appName } from './app.json'

AppRegistry.registerComponent(appName, () => App)
