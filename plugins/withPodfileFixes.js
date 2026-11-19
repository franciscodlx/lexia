// Podfile fixes that must survive `npx expo prebuild --clean`:
// 1. GoogleSignIn 9 → AppCheckCore (Swift pod) needs module maps for its ObjC deps
//    when pods are built as static libraries ("The Swift pod `AppCheckCore` depends
//    upon `GoogleUtilities` and `RecaptchaInterop`, which do not define modules").
// 2. Xcode 27 rejects pod targets (mostly *_Privacy resource bundles) whose
//    IPHONEOS_DEPLOYMENT_TARGET is below 15.0 → raise them to the app's target.
const { withPodfile } = require('expo/config-plugins')

const MARKER = '# [lexia] google modular headers'
const PODS = [
  MARKER,
  "  pod 'GoogleUtilities', :modular_headers => true",
  "  pod 'RecaptchaInterop', :modular_headers => true",
].join('\n')

const TARGET_MARKER = '# [lexia] min deployment target'
const TARGET_FIX = [
  `    ${TARGET_MARKER}`,
  '    installer.pods_project.targets.each do |t|',
  '      t.build_configurations.each do |c|',
  "        if c.build_settings['IPHONEOS_DEPLOYMENT_TARGET'].to_f < 15.1",
  "          c.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '15.1'",
  '        end',
  '      end',
  '    end',
].join('\n')

module.exports = function withGoogleModularHeaders(config) {
  return withPodfile(config, (cfg) => {
    let podfile = cfg.modResults.contents
    if (!podfile.includes(MARKER)) {
      podfile = podfile.replace(/^(\s*use_expo_modules!.*)$/m, `$1\n${PODS}`)
    }
    if (!podfile.includes(TARGET_MARKER)) {
      podfile = podfile.replace(/^(\s*post_install do \|installer\|.*)$/m, `$1\n${TARGET_FIX}`)
    }
    cfg.modResults.contents = podfile
    return cfg
  })
}
