import { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

const translations = {
  uk: {
    // Header
    tournament: 'Турнір',
    admin: 'Адмін',
    logout: 'Вийти',
    backToMain: '← Назад',
    adminButton: '⚙️ Адмін',
    
    // Server
    serverForParticipants: 'Сервер для інших учасників',
    serverRunning: 'Сервер запущений',
    serverStopped: 'Сервер зупинений',
    startServer: '🚀 Запустити сервер',
    stopServer: '🛑 Зупинити сервер',
    copyAddress: '📋 Копіювати',
    addressCopied: 'Адресу скопійовано!',
    startingServer: 'Запускаю сервер...',
    stoppingServer: 'Зупиняю сервер...',
    confirmStopServer: 'Ви впевнені що хочете зупинити сервер?',
    confirmStopServerDesc: 'Всі підключені учасники будуть відключені',
    cancel: 'Скасувати',
    confirm: 'Підтвердити',
    
    // Network Info
    networkConnection: 'Підключення до турніру',
    shareAddress: 'Надішліть цю адресу учасникам:',
    participantsCanConnect: 'Учасники вже можуть підключитись з телефонів та інших пристроїв!',
    important: 'Важливо:',
    sameWifi: 'Всі мають бути в одній WiFi мережі',
    checkFirewall: 'Якщо не працює - вимкніть firewall',
    ipMayChange: 'IP може змінитись після перезагрузки роутера',
    
    // Auth
    login: 'Вхід',
    register: 'Реєстрація',
    username: 'Ім\'я користувача',
    password: 'Пароль',
    loginButton: 'Увійти',
    registerButton: 'Зареєструватись',
    alreadyHaveAccount: 'Вже є акаунт?',
    noAccount: 'Немає акаунту?',
    loginHere: 'Увійти',
    registerHere: 'Зареєструватись',
    
    // Tournament
    groupStage: 'Груповий етап',
    group: 'Група',
    selectPlace: 'Обрати місця',
    quarterFinals: 'Чвертьфінали',
    semiFinals: 'Півфінали',
    final: 'Фінал',
    winner: 'Переможець',
    
    // Betting
    bets: 'Ставки',
    makeBet: 'Зробити ставку',
    player: 'Гравець',
    amount: 'Кількість',
    placeBet: 'Поставити',
    myBets: 'Мої ставки',
    allBets: 'Всі ставки',
    yourBottles: 'Ваші пляшки',
    onlyAdminCanCancel: 'Скасувати ставку може тільки адміністратор',
    
    // Leaderboard
    leaderboard: 'Лідерборд',
    noParticipants: 'Ще немає учасників',
    
    // Chat
    chat: 'Чат',
    typeMessage: 'Напишіть повідомлення...',
    noMessages: 'Ще немає повідомлень',
    youAreMuted: 'Ви в муті ще',
    seconds: 'секунд',
    
    // Admin Panel
    adminPanel: 'Панель адміністратора',
    resetMatch: 'Скинути матч',
    replacePlayer: 'Замінити гравця',
    fullReset: 'Повний скид',
    fullResetConfirm: 'Ви впевнені? Це скине всі дані турніру!',
    userManagement: 'Управління користувачами',
    showAll: 'Показати всіх',
    hide: 'Сховати',
    balance: 'Баланс',
    changeBalance: '💰 Змінити баланс',
    resetPassword: '🔑 Скинути пароль',
    delete: '🗑️ Видалити',
    muteUser: '🔇 Замутити',
    unmuteUser: '🔊 Розмутити',
    
    // Toasts
    serverStarted: 'Сервер запущений',
    serverStartError: 'Помилка запуску сервера',
    portBusy: 'Порт 5173 зайнятий',
    closeOtherApps: 'Закрийте інші програми що використовують порт 5173',
  },
  en: {
    // Header
    tournament: 'Tournament',
    admin: 'Admin',
    logout: 'Logout',
    backToMain: '← Back',
    adminButton: '⚙️ Admin',
    
    // Server
    serverForParticipants: 'Server for other participants',
    serverRunning: 'Server is running',
    serverStopped: 'Server stopped',
    startServer: '🚀 Start Server',
    stopServer: '🛑 Stop Server',
    copyAddress: '📋 Copy',
    addressCopied: 'Address copied!',
    startingServer: 'Starting server...',
    stoppingServer: 'Stopping server...',
    confirmStopServer: 'Are you sure you want to stop the server?',
    confirmStopServerDesc: 'All connected participants will be disconnected',
    cancel: 'Cancel',
    confirm: 'Confirm',
    
    // Network Info
    networkConnection: 'Connect to Tournament',
    shareAddress: 'Share this address with participants:',
    participantsCanConnect: 'Participants can now connect from phones and other devices!',
    important: 'Important:',
    sameWifi: 'Everyone must be on the same WiFi network',
    checkFirewall: 'If not working - disable firewall',
    ipMayChange: 'IP may change after router restart',
    
    // Auth
    login: 'Login',
    register: 'Register',
    username: 'Username',
    password: 'Password',
    loginButton: 'Login',
    registerButton: 'Register',
    alreadyHaveAccount: 'Already have an account?',
    noAccount: 'Don\'t have an account?',
    loginHere: 'Login',
    registerHere: 'Register',
    
    // Tournament
    groupStage: 'Group Stage',
    group: 'Group',
    selectPlace: 'Select Places',
    quarterFinals: 'Quarter Finals',
    semiFinals: 'Semi Finals',
    final: 'Final',
    winner: 'Winner',
    
    // Betting
    bets: 'Bets',
    makeBet: 'Make Bet',
    player: 'Player',
    amount: 'Amount',
    placeBet: 'Place Bet',
    myBets: 'My Bets',
    allBets: 'All Bets',
    yourBottles: 'Your Bottles',
    onlyAdminCanCancel: 'Only admin can cancel bets',
    
    // Leaderboard
    leaderboard: 'Leaderboard',
    noParticipants: 'No participants yet',
    
    // Chat
    chat: 'Chat',
    typeMessage: 'Type a message...',
    noMessages: 'No messages yet',
    youAreMuted: 'You are muted for',
    seconds: 'seconds',
    
    // Admin Panel
    adminPanel: 'Admin Panel',
    resetMatch: 'Reset Match',
    replacePlayer: 'Replace Player',
    fullReset: 'Full Reset',
    fullResetConfirm: 'Are you sure? This will reset all tournament data!',
    userManagement: 'User Management',
    showAll: 'Show All',
    hide: 'Hide',
    balance: 'Balance',
    changeBalance: '💰 Change Balance',
    resetPassword: '🔑 Reset Password',
    delete: '🗑️ Delete',
    muteUser: '🔇 Mute',
    unmuteUser: '🔊 Unmute',
    
    // Toasts
    serverStarted: 'Server started',
    serverStartError: 'Server start error',
    portBusy: 'Port 5173 is busy',
    closeOtherApps: 'Close other apps using port 5173',
  }
};

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('uk');

  useEffect(() => {
    const saved = localStorage.getItem('turik_language');
    if (saved && (saved === 'uk' || saved === 'en')) {
      setLanguage(saved);
    }
  }, []);

  const toggleLanguage = () => {
    const newLang = language === 'uk' ? 'en' : 'uk';
    setLanguage(newLang);
    localStorage.setItem('turik_language', newLang);
  };

  const t = (key) => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}

