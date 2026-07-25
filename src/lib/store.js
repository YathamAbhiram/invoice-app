import { create } from 'zustand'

const useStore = create((set) => ({
  theme: 'light',
  setTheme: (theme) => set({ theme }),
  companySettings: null,
  setCompanySettings: (settings) => set({ companySettings: settings }),
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}))

export default useStore