# MERA Download Distribution Directory

Place compiled distribution packages in this directory to serve direct downloads from the MERA portal:

1. `mera-admin.apk`: Compiled MERA Admin Android controller package.
   - Built via: `cd admin-android && ./gradlew assembleDebug`
   - Source APK location: `admin-android/app/build/outputs/apk/debug/app-debug.apk`

2. `mera-agent.apk`: Compiled MERA Client Agent Android package.
   - Built via: `cd android-agent && ./gradlew assembleDebug`
   - Source APK location: `android-agent/app/build/outputs/apk/debug/app-debug.apk`

3. `mera-windows-agent.zip`: Compiled Windows Agent executable and service setup bundle.
   - Built via: `cd windows-agent && npm run build`
