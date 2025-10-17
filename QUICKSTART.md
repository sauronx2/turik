# 🚀 Швидкий старт

## Крок 1: Встановлення залежностей

Відкрийте термінал і виконайте:

```bash
cd /Users/serhadov/turik
npm install
cd client
npm install
cd ..
```

## Крок 2: Запуск серверу

У **першому** терміналі:

```bash
cd /Users/serhadov/turik
npm run server
```

Ви побачите: `🚀 Server running on http://localhost:3000`

## Крок 3: Запуск клієнта

У **другому** терміналі:

```bash
cd /Users/serhadov/turik/client
npm run dev
```

Ви побачите: `Local: http://localhost:5173/`

## Крок 4: Відкрийте браузер

1. На вашому комп'ютері: `http://localhost:5173`
2. На інших пристроях у мережі: `http://ВАШ_IP:5173`

### Як дізнатися ваш IP?

```bash
# macOS/Linux
ifconfig | grep "inet "

# Або просто
ifconfig
```

Шукайте IP виду `192.168.x.x` або `10.0.x.x`

## Використання

### 👑 Адміністратор
- Ім'я: `admin`
- Може обирати переможців
- Керує турніром

### 👤 Учасник
- Будь-яке ім'я (не `admin`)
- Отримує 10 пляшок 🍺
- Робить ставки на гравців

## Налаштування турніру

Щоб змінити гравців, відредагуйте `server/index.js`:

```javascript
let tournamentState = {
  groups: [
    { id: 1, name: 'Група 1', players: ['Ім\'я 1', 'Ім\'я 2', 'Ім\'я 3'] },
    { id: 2, name: 'Група 2', players: ['Ім\'я 4', 'Ім\'я 5', 'Ім\'я 6'] },
    { id: 3, name: 'Група 3', players: ['Ім\'я 7', 'Ім\'я 8', 'Ім\'я 9'] },
    { id: 4, name: 'Група 4', players: ['Ім\'я 10', 'Ім\'я 11', 'Ім\'я 12'] }
  ],
  // ...
};
```

Після змін перезапустіть сервер.

## Пуш на GitHub

```bash
# Створіть репозиторій на GitHub, потім:
git remote add origin https://github.com/ваш-username/turik.git
git push -u origin main
```

---

**Готово!** Насолоджуйтесь турніром! 🍺🏆
