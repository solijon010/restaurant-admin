import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSettings } from '@/contexts/SettingsContext';
import { useBranch } from '@/contexts/BranchContext';
import { t } from '@/lib/i18n';
import { Sun, Moon, Type, Languages, GitBranch, MapPin, Star, Loader2 } from 'lucide-react';

export default function Settings() {
  const { theme, setTheme, language, setLanguage, fontSize, setFontSize } = useSettings();
  const { branches, branchesLoading, selectedBranchId } = useBranch();
  const isManagerContext = branches.length > 0 || branchesLoading;

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

      {/* Filiallar — faqat manager uchun */}
      {isManagerContext && (
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <GitBranch className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold text-foreground">Filiallar</h3>
            {!branchesLoading && (
              <Badge variant="secondary" className="ml-1">{branches.length} ta</Badge>
            )}
          </div>

          {branchesLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground py-4">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Yuklanmoqda...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {branches.map((b, i) => {
                const isDefault = b.id === selectedBranchId;
                return (
                  <Card key={b.id} className={`p-4 ${isDefault ? 'ring-2 ring-primary' : ''}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <GitBranch className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="font-medium text-foreground truncate">{b.name}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {i === 0 && (
                          <span title="Default filial">
                            <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                          </span>
                        )}
                        <Badge
                          variant={b.status === 'ACTIVE' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {b.status === 'ACTIVE' ? 'Faol' : b.status}
                        </Badge>
                      </div>
                    </div>
                    {b.addres && (
                      <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">{b.addres}</span>
                      </div>
                    )}
                    {isDefault && (
                      <p className="mt-2 text-xs text-primary font-medium">Joriy filial</p>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
