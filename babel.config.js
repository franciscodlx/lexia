module.exports = {
  presets: ['module:@react-native/babel-preset', 'nativewind/babel'],
  plugins: [
    // `import { SUPABASE_URL } from '@env'` ← .env.local (see lib/env.ts)
    [
      'module:react-native-dotenv',
      { moduleName: '@env', path: '.env.local', safe: false, allowUndefined: true },
    ],
    [
      'module-resolver',
      { root: ['./'], alias: { '@': './' }, extensions: ['.ts', '.tsx', '.js', '.json'] },
    ],
  ],
}
