import {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  REVENUECAT_IOS_KEY,
  REVENUECAT_ANDROID_KEY,
  ADMOB_REWARDED_IOS,
  ADMOB_REWARDED_ANDROID,
} from '@env'

/** Public client config from `.env.local` (inlined at build time; restart Metro with --reset-cache after editing). */
export const ENV = {
  supabaseUrl: SUPABASE_URL ?? '',
  supabaseAnonKey: SUPABASE_ANON_KEY ?? '',
  revenueCatIosKey: REVENUECAT_IOS_KEY ?? '',
  revenueCatAndroidKey: REVENUECAT_ANDROID_KEY ?? '',
  admobRewardedIos: ADMOB_REWARDED_IOS ?? '',
  admobRewardedAndroid: ADMOB_REWARDED_ANDROID ?? '',
}
