import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Enable code splitting
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'animation-vendor': ['framer-motion'],
          'chart-vendor': ['recharts'],
          'icon-vendor': ['react-icons'],
          // Admin pages in separate chunk
          'admin': [
            './src/pages/Admin/AdminDashboard.jsx',
            './src/pages/Admin/AdminClients.jsx',
            './src/pages/Admin/AdminProducts.jsx',
            './src/pages/Admin/AdminOrders.jsx',
            './src/pages/Admin/AdminAppointments.jsx',
            './src/pages/Admin/AdminContacts.jsx',
            './src/pages/Admin/AdminCalendar.jsx',
          ],
        },
      },
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
    // Minify for production
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true,
      },
    },
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'framer-motion'],
  },
})
