import React, { createContext, useContext, useState, useEffect } from 'react'

export type Theme = 'dark' | 'light' | 'neon' | 'classic'
export type ColorScheme = 'default' | 'ocean' | 'forest' | 'sunset' | 'purple'

interface ThemeContextType {
  theme: Theme
  colorScheme: ColorScheme
  setTheme: (theme: Theme) => void
  setColorScheme: (scheme: ColorScheme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

interface ThemeProviderProps {
  children: React.ReactNode
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('dark')
  const [colorScheme, setColorScheme] = useState<ColorScheme>('default')

  useEffect(() => {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('hilo-theme') as Theme
    const savedColorScheme = localStorage.getItem(
      'hilo-color-scheme'
    ) as ColorScheme

    if (savedTheme) setTheme(savedTheme)
    if (savedColorScheme) setColorScheme(savedColorScheme)
  }, [])

  useEffect(() => {
    // Save theme to localStorage
    localStorage.setItem('hilo-theme', theme)
    localStorage.setItem('hilo-color-scheme', colorScheme)

    // Apply theme to document
    document.documentElement.setAttribute('data-theme', theme)
    document.documentElement.setAttribute('data-color-scheme', colorScheme)
  }, [theme, colorScheme])

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'))
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        colorScheme,
        setTheme,
        setColorScheme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

// Theme selector component
export const ThemeSelector: React.FC = () => {
  const { theme, colorScheme, setTheme, setColorScheme } = useTheme()

  const themes = [
    { id: 'dark', name: 'Dark', icon: '🌙' },
    { id: 'light', name: 'Light', icon: '☀️' },
  ] as const

  const colorSchemes = [
    {
      id: 'default',
      name: 'Default',
      colors: ['#FFD700', '#FF2D2D', '#00C853'],
    },
    { id: 'ocean', name: 'Ocean', colors: ['#00BFFF', '#FF6B6B', '#4ECDC4'] },
    { id: 'forest', name: 'Forest', colors: ['#32CD32', '#FF4500', '#228B22'] },
    { id: 'sunset', name: 'Sunset', colors: ['#FF8C00', '#FF1493', '#FFD700'] },
    { id: 'purple', name: 'Purple', colors: ['#9370DB', '#FF69B4', '#00CED1'] },
  ] as const

  return (
    <div className="space-y-6">
      {/* Theme Selection */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">Theme</h3>
        <div className="grid grid-cols-2 gap-3">
          {themes.map(themeOption => (
            <button
              key={themeOption.id}
              onClick={() => setTheme(themeOption.id)}
              className={`
                p-3 rounded-lg border transition-all duration-200
                ${
                  theme === themeOption.id
                    ? 'border-hilo-gold bg-hilo-gold/20 text-hilo-gold'
                    : 'border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-500'
                }
              `}
            >
              <div className="text-2xl mb-1">{themeOption.icon}</div>
              <div className="text-sm font-medium">{themeOption.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Color Scheme Selection */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">Color Scheme</h3>
        <div className="space-y-2">
          {colorSchemes.map(scheme => (
            <button
              key={scheme.id}
              onClick={() => setColorScheme(scheme.id)}
              className={`
                w-full p-3 rounded-lg border transition-all duration-200 flex items-center gap-3
                ${
                  colorScheme === scheme.id
                    ? 'border-hilo-gold bg-hilo-gold/20 text-hilo-gold'
                    : 'border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-500'
                }
              `}
            >
              <div className="flex gap-1">
                {scheme.colors.map((color, index) => (
                  <div
                    key={index}
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <span className="font-medium">{scheme.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
