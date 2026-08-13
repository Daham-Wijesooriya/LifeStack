# Upgrade to Expo SDK 57 and Pixel 7 Pro Optimization

This plan upgrades the project from Expo SDK 54 to SDK 57 (the latest version as of August 2026) and optimizes the app for the Pixel 7 Pro simulator's high-resolution, edge-to-edge display.

## User Review Required

> [!IMPORTANT]
> **New Architecture Mandatory**: Expo SDK 57 requires the React Native New Architecture (Fabric/TurboModules). This project appears to be a Managed Expo project, so Expo handles this automatically, but if you have custom native modules, they must be compatible.
> [!WARNING]
> **Node.js Version**: Ensure you are using Node.js 20 or later, as required by recent Expo SDKs.

## Proposed Changes

### Dependencies

#### [MODIFY] [package.json](file:///D:/NSBM/SDP/LifeStack/package.json)
Update core dependencies to SDK 57 versions:
- `expo`: `~57.0.0`
- `react-native`: `0.86.0`
- `react`: `19.2.0`
- `expo-router`: `~57.0.0`
- `react-native-reanimated`: `~4.5.0`
- `react-native-gesture-handler`: `~2.32.0`
- `react-native-screens`: `~4.22.0`
- `react-native-safe-area-context`: `~5.8.0`
- `babel-preset-expo`: `~57.0.0`

### Project Configuration

#### [MODIFY] [app.json](file:///D:/NSBM/SDP/LifeStack/app.json)
- Add `package` identifier for Android (`com.lifestack.app`).
- Enable `edgeToEdge` support to fully utilize the Pixel 7 Pro screen (status bar and navigation bar transparency).
- Ensure `predictiveBackGestureEnabled` is set to `true` (standard for modern Android).

### UI Adjustments

#### [MODIFY] [app/_layout.tsx](file:///D:/NSBM/SDP/LifeStack/app/_layout.tsx)
- Ensure the `StatusBar` component from `expo-status-bar` is correctly configured for edge-to-edge mode.

## Verification Plan

### Automated Tests
- Run `npx expo-doctor` to verify dependency consistency.
- Run `npx expo prebuild --clean` to regenerate native directories with the new SDK versions.

### Manual Verification
- Deploy to Pixel 7 Pro simulator using `npx expo run:android`.
- Verify that the UI correctly respects the punch-hole camera and rounded corners using `SafeAreaView`.
- Check that the navigation bar and status bar are transparent (Edge-to-Edge).
