import { defineConfig } from 'vite';

export default defineConfig( {
  build: {
    lib: {
      entry: 'src/main.js',
      name: 'Nagare',
      fileName: ( format ) => `nagare.${format}.js`,
      formats: ['es', 'umd']
    },
    rollupOptions: {
      // Externalize dependencies if you don't want them bundled
      // external: [],
      output: {
        // Provide global variables for UMD build
        globals: {
          // Add any global variables if needed
        }
      }
    },
    sourcemap: true,
    minify: false // Disable minification for better error messages, or set to 'esbuild'/'terser' with sourcemaps
  }
} );

