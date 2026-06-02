import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark';
type Language = 'latin' | 'cyrillic';
type FontSize = 'sm' | 'md' | 'lg';

interface SettingsContextType {
  theme: Theme;
  setTheme: (t: Theme) => void;
  language: Language;
  setLanguage: (l: Language) => void;
  fontSize: FontSize;
  setFontSize: (s: FontSize) => void;
}

const SettingsContext = createContext<SettingsContextType>({
  theme: 'light',
  setTheme: () => {},
  language: 'latin',
  setLanguage: () => {},
  fontSize: 'md',
  setFontSize: () => {},
});

const SETTINGS_KEY = 'rms_settings';

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    return {};
  }
  return {};
}

function saveSettings(s: Record<string, string>) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const saved = loadSettings();
  const [theme, setThemeState] = useState<Theme>(saved.theme || 'light');
  const [language, setLanguageState] = useState<Language>(saved.language || 'latin');
  const [fontSize, setFontSizeState] = useState<FontSize>(saved.fontSize || 'md');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('text-sm', 'text-base', 'text-lg');
    if (fontSize === 'sm') root.classList.add('text-sm');
    else if (fontSize === 'lg') root.classList.add('text-lg');
    else root.classList.add('text-base');
  }, [fontSize]);

  const setTheme = (t: Theme) => { setThemeState(t); saveSettings({ ...loadSettings(), theme: t }); };
  const setLanguage = (l: Language) => { setLanguageState(l); saveSettings({ ...loadSettings(), language: l }); };
  const setFontSize = (s: FontSize) => { setFontSizeState(s); saveSettings({ ...loadSettings(), fontSize: s }); };

  return (
    <SettingsContext.Provider value={{ theme, setTheme, language, setLanguage, fontSize, setFontSize }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
