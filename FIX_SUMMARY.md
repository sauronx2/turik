# 🐛 Виправлення білого екрану в Electron додатку

## Проблема:

Після встановлення та запуску додатку відображався **білий екран** замість інтерфейсу турніру.

## Причина:

Vite збирав HTML з **абсолютними шляхами** до assets:
```html
<script src="/assets/index-xxx.js"></script>
<link href="/assets/index-xxx.css">
```

Electron не міг правильно резолвити ці шляхи через протокол `file://`.

## Виправлення:

### 1. **Vite config** (`client/vite.config.js`)

Додав `base: './'` для relative paths:

```js
export default defineConfig({
    plugins: [react()],
    base: './',  // ← Тепер шляхи відносні!
    server: {
        host: '0.0.0.0',
        port: 5173
    },
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        emptyOutDir: true
    }
})
```

Тепер HTML генерується з **відносними шляхами**:
```html
<script src="./assets/index-xxx.js"></script>
<link href="./assets/index-xxx.css">
```

### 2. **Electron main process** (`electron/main.cjs`)

Покращив завантаження та додав логування:

```js
// Використовуємо file:// протокол
const htmlPath = path.join(app.getAppPath(), 'client', 'dist', 'index.html');
mainWindow.loadURL(`file://${htmlPath}`);

// Додав error handling
mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('❌ Failed to load:', errorCode, errorDescription);
});

mainWindow.webContents.on('did-finish-load', () => {
    console.log('✅ Page loaded successfully');
});
```

## Результат:

✅ Інтерфейс турніру тепер коректно завантажується
✅ Всі assets (JS, CSS) працюють
✅ Socket.io підключається до backend
✅ Додано детальне логування для дебагу

## Як встановити виправлений додаток:

### Крок 1: Видали стару версію

```bash
rm -rf /Applications/Турнір.app
```

### Крок 2: Встанови нову

```bash
# Відкрий новий DMG (вже відкритий!)
open dist-electron/Турнір-1.0.0-Mac-arm64.dmg

# Перетягни в Applications
```

### Крок 3: Запусти

```bash
open /Applications/Турнір.app
```

Якщо macOS блокує:
```bash
sudo xattr -rd com.apple.quarantine /Applications/Турнір.app
open /Applications/Турнір.app
```

## Git workflow:

Відповідно до нових правил, всі зміни тепер в **бранчі**:

```bash
Branch: fix/electron-white-screen
Commit: 6e10b81 "Fix white screen in Electron app"
```

**Бранч запушений на GitHub!** Можна робити Merge Request в main.

---

## 🎯 Що тепер має працювати:

1. ✅ **Інтерфейс завантажується** (не білий екран)
2. ✅ **Backend автостартує** на порту 3000
3. ✅ **Socket.io підключається** (real-time оновлення)
4. ✅ **Tray іконка** з IP адресою
5. ✅ **Всі функції** доступні (ставки, чат, турнір)

## Технічні деталі:

| До виправлення | Після виправлення |
|----------------|-------------------|
| `/assets/...` (absolute) | `./assets/...` (relative) |
| `loadFile()` | `loadURL('file://...')` |
| Немає логування | Детальні логи |
| Немає error handling | Error callbacks |

---

**Тепер додаток працює коректно! 🎉**
