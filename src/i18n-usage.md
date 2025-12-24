# Multi-Language Support Guide

This project supports English and Arabic languages with RTL (Right-to-Left) layout support.

## Usage

### Basic Translation

```tsx
import { useLanguage } from '@/contexts/LanguageContext';

function MyComponent() {
  const { t } = useLanguage();
  
  return <h1>{t('dashboard.title')}</h1>;
}
```

### Translation with Parameters

```tsx
const { t } = useLanguage();

// Translation: "Welcome back, {{name}}!"
<h1>{t('dashboard.welcomeBack', { name: user.firstName })}</h1>

// Translation: "{{count}} day streak"
<span>{t('dashboard.dayStreak', { count: 5 })}</span>
```

### Language Switcher

The `LanguageSwitcher` component is available and can be added anywhere:

```tsx
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

<LanguageSwitcher />
```

### RTL Support

RTL is automatically handled when Arabic is selected:
- Document direction is set to `rtl`
- CSS classes automatically adjust margins
- Arabic font (Cairo) is loaded

### Adding New Translations

1. Add the key to both `src/locales/en.json` and `src/locales/ar.json`
2. Use nested objects for organization:
   ```json
   {
     "section": {
       "subsection": {
         "key": "Value"
       }
     }
   }
   ```
3. Access with: `t('section.subsection.key')`

### Translation Keys Structure

- `common.*` - Common UI elements (buttons, labels)
- `auth.*` - Authentication pages
- `dashboard.*` - Dashboard page
- `tasks.*` - Task management
- `categories.*` - Category management
- `notifications.*` - Notifications
- `settings.*` - Settings
- `errors.*` - Error messages
- `success.*` - Success messages

## Language Persistence

- Language preference is saved in `localStorage`
- User settings API can be extended to save language preference per user
- Default language is detected from browser settings


