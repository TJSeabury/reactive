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
    }
  }
} );

