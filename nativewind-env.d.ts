/// <reference types="nativewind/types" />

// NativeWind's shipped types don't declare a module for plain CSS imports
// (the root layout does `import '../global.css'` for its Tailwind directives).
declare module '*.css';
