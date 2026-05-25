import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSettings } from '@/contexts/SettingsContext';
import { t } from '@/lib/i18n';
import { Sun, Moon, Type, Languages } from 'lucide-react';

export default function Settings() {
  const { theme, setTheme, language, setLanguage, fontSize, setFontSize } = useSettings();

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground mb-6">{t('Sozlamalar', language)}</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Theme */}
        <Card className="p-5 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <Sun className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-base font-semibold text-foreground">{t('Mavzu', language)}</h3>
          </div>
          <div className="flex gap-2">
            <Button
              variant={theme === 'light' ? 'default' : 'outline'}
              size="sm"
              className="flex-1"
              onClick={() => setTheme('light')}
            >
              <Sun className="h-3.5 w-3.5 mr-1.5" />
              {t("Yorug'", language)}
            </Button>
            <Button
              variant={theme === 'dark' ? 'default' : 'outline'}
              size="sm"
              className="flex-1"
              onClick={() => setTheme('dark')}
            >
              <Moon className="h-3.5 w-3.5 mr-1.5" />
              {t("Qorong'u", language)}
            </Button>
          </div>
        </Card>

        {/* Language */}
        <Card className="p-5 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <Languages className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-base font-semibold text-foreground">{t('Til', language)}</h3>
          </div>
          <div className="flex gap-2">
            <Button
              variant={language === 'latin' ? 'default' : 'outline'}
              size="sm"
              className="flex-1"
              onClick={() => setLanguage('latin')}
            >
              {t('Lotin', language)}
            </Button>
            <Button
              variant={language === 'cyrillic' ? 'default' : 'outline'}
              size="sm"
              className="flex-1"
              onClick={() => setLanguage('cyrillic')}
            >
              {t('Kiril', language)}
            </Button>
          </div>
        </Card>

        {/* Font size */}
        <Card className="p-5 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <Type className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-base font-semibold text-foreground">{t("Yozuv o'lchami", language)}</h3>
          </div>
          <div className="flex gap-2">
            {[
              { key: 'sm' as const, label: 'Kichik' },
              { key: 'md' as const, label: "O'rta" },
              { key: 'lg' as const, label: 'Katta' },
            ].map(s => (
              <Button
                key={s.key}
                variant={fontSize === s.key ? 'default' : 'outline'}
                size="sm"
                className="flex-1"
                onClick={() => setFontSize(s.key)}
              >
                {t(s.label, language)}
              </Button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
