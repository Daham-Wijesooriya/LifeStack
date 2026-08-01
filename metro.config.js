const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Drizzle migration files are imported as raw SQL text (see babel.config.js
// "inline-import" plugin), so Metro needs to treat .sql as a source extension.
config.resolver.sourceExts.push('sql');

module.exports = withNativeWind(config, { input: './global.css' });
