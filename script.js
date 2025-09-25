// Конфигурация приложения
const CONFIG = {
    VALID_CODES: {
        'D4RY4CC3SS2023GH': { name: 'Дарья', type: 'user' },
        'P4V3LPR04CC3SS23': { name: 'Павел', type: 'user' },
        'US3RR4ND0M4CC3SS': { name: '', type: 'user' },
        'T3ST4CC3SSC0D3GH': { name: '', type: 'user' },
        '4DM1NP4N3L4CC3SS': { name: 'Администратор', type: 'admin' }
    },
    ADMIN_PASSWORD: '7978/1883',
    DEBT_INCREASE_INTERVAL: 3600000, // 1 час в миллисекундах
    INITIAL_DEBT_MIN: 500,
    INITIAL_DEBT_MAX: 1000
};

// Глобальные переменные состояния
let appState = {
    currentScreen: 'auth',
    currentUser: null,
    isProcessing: false,
    users: loadUsers(),
    settings: loadSettings()
};

// Инициализация приложения
function initApp() {
    applySettings();
    createCodeInputs();
    setupEventListeners();
    checkExistingSession();
}

// Загрузка пользователей из localStorage
function loadUsers() {
    try {
        const encrypted = localStorage.getItem('githubPremiumUsers');
        if (!encrypted) return {};
        
        const decrypted = decryptData(encrypted);
        return JSON.parse(decrypted) || {};
    } catch (error) {
        console.error('Ошибка загрузки пользователей:', error);
        return {};
    }
}

// Сохранение пользователей в localStorage
function saveUsers() {
    try {
        const encrypted = encryptData(JSON.stringify(appState.users));
        localStorage.setItem('githubPremiumUsers', encrypted);
    } catch (error) {
        console.error('Ошибка сохранения пользователей:', error);
    }
}

// Загрузка настроек
function loadSettings() {
    try {
        const settings = localStorage.getItem('githubPremiumSettings');
        return settings ? JSON.parse(settings) : {
            theme: 'light',
            animations: true
        };
    } catch (error) {
        console.error('Ошибка загрузки настроек:', error);
        return { theme: 'light', animations: true };
    }
}

// Сохранение настроек
function saveSettings() {
    try {
        localStorage.setItem('githubPremiumSettings', JSON.stringify(appState.settings));
    } catch (error) {
        console.error('Ошибка сохранения настроек:', error);
    }
}

// Применение настроек
function applySettings() {
    // Применение темы
    document.documentElement.setAttribute('data-theme', appState.settings.theme);
    
    // Обновление кнопки темы
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        const icon = themeToggle.querySelector('i');
        if (appState.settings.theme === 'dark') {
            icon.className = 'fas fa-sun';
        } else {
            icon.className = 'fas fa-moon';
        }
    }
    
    // Обновление переключателей в настройках
    const themeOptions = document.querySelectorAll('.theme-option');
    themeOptions.forEach(option => {
        option.classList.remove('active');
        if (option.dataset.theme === appState.settings.theme) {
            option.classList.add('active');
        }
    });
    
    const animationsToggle = document.getElementById('animations-toggle');
    if (animationsToggle) {
        animationsToggle.checked = appState.settings.animations;
    }
}

// Проверка существующей сессии
function checkExistingSession() {
    const currentUser = localStorage.getItem('githubPremiumCurrentUser');
    if (currentUser) {
        try {
            const userData = JSON.parse(decryptData(currentUser));
            if (userData && userData.code) {
                handleReturningUser(userData);
                return;
            }
        } catch (error) {
            console.error('Ошибка восстановления сессии:', error);
        }
    }
}

// Обработка возвращающегося пользователя
function handleReturningUser(userData) {
    if (userData.type === 'admin') {
        switchToAdminScreen(userData);
    } else {
        switchToMainScreen(userData);
    }
}

// Создание полей ввода для кода
function createCodeInputs() {
    const container = document.getElementById('code-input-container');
    container.innerHTML = '';
    
    for (let i = 0; i < 16; i++) {
        const input = document.createElement('input');
        input.type = 'text';
        input.maxLength = 1;
        input.className = 'code-input';
        input.dataset.index = i;
        
        input.addEventListener('input', (e) => handleCodeInput(e, i));
        input.addEventListener('keydown', (e) => handleCodeKeydown(e, i));
        input.addEventListener('paste', handleCodePaste);
        input.addEventListener('focus', () => input.select());
        
        container.appendChild(input);
    }
    
    // Установить фокус на первое поле
    container.firstChild?.focus();
}

// Обработка ввода в поля кода
function handleCodeInput(e, index) {
    const input = e.target;
    const value = input.value.toUpperCase();
    
    if (value && /[A-Z0-9]/.test(value)) {
        input.value = value;
        input.classList.add('filled');
        input.classList.remove('error');
        
        // Переход к следующему полю
        if (index < 15) {
            const nextInput = document.querySelector(`#code-input-container [data-index="${index + 1}"]`);
            nextInput?.focus();
        }
    } else {
        input.value = '';
    }
    
    checkCodeCompletion();
}

// Обработка нажатий клавиш в полях кода
function handleCodeKeydown(e, index) {
    const input = e.target;
    
    if (e.key === 'Backspace' && !input.value && index > 0) {
        const prevInput = document.querySelector(`#code-input-container [data-index="${index - 1}"]`);
        prevInput?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
        const prevInput = document.querySelector(`#code-input-container [data-index="${index - 1}"]`);
        prevInput?.focus();
    } else if (e.key === 'ArrowRight' && index < 15) {
        const nextInput = document.querySelector(`#code-input-container [data-index="${index + 1}"]`);
        nextInput?.focus();
    }
}

// Обработка вставки из буфера обмена
function handleCodePaste(e) {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    if (pasteData.length === 16) {
        const inputs = document.querySelectorAll('#code-input-container .code-input');
        inputs.forEach((input, index) => {
            if (pasteData[index]) {
                input.value = pasteData[index];
                input.classList.add('filled');
                input.classList.remove('error');
            }
        });
        
        inputs[15]?.focus();
        checkCodeCompletion();
    }
}

// Проверка завершенности ввода кода
function checkCodeCompletion() {
    const inputs = document.querySelectorAll('#code-input-container .code-input');
    const code = Array.from(inputs).map(input => input.value).join('');
    const isComplete = code.length === 16;
    
    document.getElementById('submit-btn').disabled = !isComplete;
    
    // Показать поле для имени, если код соответствует обычному пользователю
    if (isComplete) {
        const cleanCode = code.replace(/-/g, '');
        const codeInfo = CONFIG.VALID_CODES[cleanCode];
        
        if (codeInfo) {
            if (codeInfo.type === 'user' && !codeInfo.name) {
                document.getElementById('name-input-container').classList.remove('hidden');
            } else {
                document.getElementById('name-input-container').classList.add('hidden');
            }
            
            if (codeInfo.type === 'admin') {
                document.getElementById('admin-password-container').classList.remove('hidden');
            } else {
                document.getElementById('admin-password-container').classList.add('hidden');
            }
        }
    }
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Авторизация
    document.getElementById('submit-btn').addEventListener('click', handleAuthSubmit);
    document.getElementById('error-close').addEventListener('click', hideError);
    
    // Рейтинг
    document.getElementById('decrease-rating').addEventListener('click', () => changeRating(-10));
    document.getElementById('increase-rating').addEventListener('click', () => changeRating(10));
    
    // Оплата
    document.getElementById('show-payment-btn').addEventListener('click', showPaymentModal);
    document.getElementById('close-payment').addEventListener('click', hidePaymentModal);
    document.getElementById('payment-form').addEventListener('submit', handlePaymentSubmit);
    document.getElementById('success-close').addEventListener('click', hideSuccessMessage);
    
    // Настройки
    document.getElementById('settings-btn').addEventListener('click', showSettings);
    document.getElementById('close-settings').addEventListener('click', hideSettings);
    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
    
    // Выход
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
    document.getElementById('admin-logout-btn').addEventListener('click', handleLogout);
    
    // Клик по тестовым кодам
    document.querySelectorAll('.code-list code').forEach((codeElement, index) => {
        codeElement.addEventListener('click', () => {
            const codes = Object.keys(CONFIG.VALID_CODES);
            if (index < codes.length) {
                fillTestCode(formatCodeForDisplay(codes[index]));
            }
        });
    });
    
    // Обработчики для настроек
    document.querySelectorAll('.theme-option').forEach(option => {
        option.addEventListener('click', () => {
            const theme = option.dataset.theme;
            changeTheme(theme);
        });
    });
    
    document.getElementById('animations-toggle').addEventListener('change', (e) => {
        appState.settings.animations = e.target.checked;
        saveSettings();
    });
}

// Заполнение тестового кода
function fillTestCode(code) {
    const cleanCode = code.replace(/-/g, '');
    const inputs = document.querySelectorAll('#code-input-container .code-input');
    
    inputs.forEach((input, index) => {
        input.value = cleanCode[index] || '';
        input.classList.add('filled');
        input.classList.remove('error');
    });
    
    checkCodeCompletion();
    inputs[15]?.focus();
}

// Форматирование кода для отображения
function formatCodeForDisplay(code) {
    return code.replace(/(.{4})/g, '$1-').slice(0, 19);
}

// Обработка авторизации
async function handleAuthSubmit() {
    if (appState.isProcessing) return;
    
    const inputs = document.querySelectorAll('#code-input-container .code-input');
    const enteredCode = Array.from(inputs).map(input => input.value).join('');
    
    // Валидация кода
    if (!isValidCode(enteredCode)) {
        showError('Код должен содержать только буквы и цифры');
        highlightInvalidInputs();
        return;
    }
    
    const codeInfo = CONFIG.VALID_CODES[enteredCode];
    if (!codeInfo) {
        showError('Неверный код доступа. Пожалуйста, проверьте введенные данные.');
        highlightInvalidInputs();
        return;
    }
    
    setProcessingState(true);
    
    // Имитация задержки сети
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (codeInfo.type === 'admin') {
        // Проверка пароля администратора
        const password = document.getElementById('admin-password').value;
        if (password !== CONFIG.ADMIN_PASSWORD) {
            showError('Неверный пароль администратора');
            setProcessingState(false);
            return;
        }
        
        await handleAdminAuth(enteredCode, codeInfo);
    } else {
        await handleUserAuth(enteredCode, codeInfo);
    }
    
    setProcessingState(false);
}

// Валидация кода
function isValidCode(code) {
    return /^[A-Z0-9]{16}$/.test(code);
}

// Подсветка невалидных полей ввода
function highlightInvalidInputs() {
    const inputs = document.querySelectorAll('#code-input-container .code-input');
    inputs.forEach(input => {
        if (!input.value || !/[A-Z0-9]/.test(input.value)) {
            input.classList.add('error');
        }
    });
    
    // Анимация ошибки
    const container = document.getElementById('code-input-container');
    container.style.animation = 'none';
    setTimeout(() => {
        container.style.animation = 'shake 0.5s ease-in-out';
    }, 10);
}

// Обработка авторизации администратора
async function handleAdminAuth(code, codeInfo) {
    const userData = {
        code: code,
        name: codeInfo.name,
        type: 'admin',
        loginTime: new Date().toISOString()
    };
    
    appState.currentUser = userData;
    saveCurrentUser(userData);
    await playWelcomeAnimation(userData.name);
    switchToAdminScreen(userData);
}

// Обработка авторизации пользователя
async function handleUserAuth(code, codeInfo) {
    let userName = codeInfo.name;
    
    // Если имя не задано в коде, запросить у пользователя
    if (!userName) {
        userName = document.getElementById('user-name-input').value.trim();
        if (!userName) {
            showError('Пожалуйста, введите ваше имя');
            setProcessingState(false);
            return;
        }
    }
    
    // Создание или обновление пользователя
    if (!appState.users[code]) {
        appState.users[code] = {
            name: userName,
            rating: 0,
            debtAmount: 0,
            lastLogin: new Date().toISOString(),
            createdAt: new Date().toISOString()
        };
    } else {
        appState.users[code].name = userName;
        appState.users[code].lastLogin = new Date().toISOString();
    }
    
    saveUsers();
    
    const userData = {
        code: code,
        name: userName,
        type: 'user',
        ...appState.users[code]
    };
    
    appState.currentUser = userData;
    saveCurrentUser(userData);
    await playWelcomeAnimation(userName);
    switchToMainScreen(userData);
}

// Сохранение текущего пользователя
function saveCurrentUser(userData) {
    try {
        const encrypted = encryptData(JSON.stringify(userData));
        localStorage.setItem('githubPremiumCurrentUser', encrypted);
    } catch (error) {
        console.error('Ошибка сохранения текущего пользователя:', error);
    }
}

// Установка состояния обработки
function setProcessingState(processing) {
    appState.isProcessing = processing;
    const btn = document.getElementById('submit-btn');
    const btnText = btn.querySelector('.btn-text');
    const loader = btn.querySelector('.btn-loader');
    
    if (processing) {
        btnText.classList.add('hidden');
        loader.classList.remove('hidden');
        btn.disabled = true;
    } else {
        btnText.classList.remove('hidden');
        loader.classList.add('hidden');
        btn.disabled = false;
    }
}

// Переключение экранов
function switchScreen(screenName) {
    // Скрыть все экраны
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    // Показать целевой экран
    document.getElementById(screenName + '-screen').classList.add('active');
    appState.currentScreen = screenName;
}

// Переключение на главный экран
function switchToMainScreen(userData) {
    switchScreen('main');
    updateUserDisplay(userData);
    updateRatingDisplay();
    updateDebtSection();
}

// Переключение на экран администратора
function switchToAdminScreen(userData) {
    switchScreen('admin');
    updateAdminDisplay();
}

// Анимация приветствия
async function playWelcomeAnimation(userName) {
    const welcomeText = document.getElementById('welcome-message');
    welcomeText.textContent = '';
    const fullText = `Здравствуйте, ${userName}!`;
    
    // Постепенное появление текста
    for (let i = 0; i <= fullText.length; i++) {
        welcomeText.textContent = fullText.slice(0, i);
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Задержка перед переходом
    await new Promise(resolve => setTimeout(resolve, 2000));
}

// Обновление отображения пользователя
function updateUserDisplay(userData) {
    document.getElementById('display-name').textContent = userData.name;
}

// Изменение рейтинга
function changeRating(amount) {
    if (!appState.currentUser || appState.currentUser.type !== 'user') return;
    
    const userCode = appState.currentUser.code;
    const newRating = appState.users[userCode].rating + amount;
    
    // Ограничение рейтинга
    appState.users[userCode].rating = Math.max(-100, Math.min(100, newRating));
    
    updateRatingDisplay();
    
    // Проверка на отрицательный рейтинг
    if (appState.users[userCode].rating < 0 && appState.users[userCode].debtAmount === 0) {
        generateInitialDebt(userCode);
    }
    
    updateDebtSection();
    saveUsers();
}

// Обновление отображения рейтинга
function updateRatingDisplay() {
    if (!appState.currentUser || appState.currentUser.type !== 'user') return;
    
    const userCode = appState.currentUser.code;
    const rating = appState.users[userCode].rating;
    const percentage = ((rating + 100) / 200) * 100;
    
    // Анимация изменения рейтинга
    document.getElementById('rating-fill').style.width = `${percentage}%`;
    document.getElementById('current-rating').textContent = rating;
    
    // Изменение цвета бейджа
    const ratingBadge = document.getElementById('rating-badge');
    if (rating < 0) {
        ratingBadge.classList.add('negative');
    } else {
        ratingBadge.classList.remove('negative');
    }
    
    // Анимация изменения значения
    ratingBadge.style.transform = 'scale(1.1)';
    setTimeout(() => {
        ratingBadge.style.transform = 'scale(1)';
    }, 300);
}

// Генерация начального долга
function generateInitialDebt(userCode) {
    appState.users[userCode].debtAmount = Math.floor(
        Math.random() * (CONFIG.INITIAL_DEBT_MAX - CONFIG.INITIAL_DEBT_MIN + 1) + CONFIG.INITIAL_DEBT_MIN
    );
    
    // Запуск таймера увеличения долга
    startDebtTimer(userCode);
    saveUsers();
}

// Запуск таймера увеличения долга
function startDebtTimer(userCode) {
    if (appState.users[userCode].debtTimer) {
        clearInterval(appState.users[userCode].debtTimer);
    }
    
    appState.users[userCode].debtTimer = setInterval(() => {
        appState.users[userCode].debtAmount += 10;
        updateDebtSection();
        saveUsers();
    }, CONFIG.DEBT_INCREASE_INTERVAL);
}

// Обновление секции долга
function updateDebtSection() {
    if (!appState.currentUser || appState.currentUser.type !== 'user') return;
    
    const userCode = appState.currentUser.code;
    const debtSection = document.getElementById('debt-section');
    const debtAmount = document.getElementById('debt-amount');
    
    if (appState.users[userCode].rating < 0) {
        debtSection.classList.remove('hidden');
        debtAmount.textContent = appState.users[userCode].debtAmount;
        
        // Анимация появления
        debtSection.style.display = 'block';
        setTimeout(() => {
            debtSection.style.opacity = '1';
            debtSection.style.transform = 'translateY(0)';
        }, 10);
    } else {
        debtSection.style.opacity = '0';
        debtSection.style.transform = 'translateY(-20px)';
        setTimeout(() => {
            debtSection.classList.add('hidden');
        }, 300);
    }
}

// Показать модальное окно оплаты
function showPaymentModal() {
    if (!appState.currentUser || appState.currentUser.type !== 'user') return;
    
    const userCode = appState.currentUser.code;
    document.getElementById('payment-modal').classList.remove('hidden');
    document.getElementById('payment-amount').textContent = `${appState.users[userCode].debtAmount}₽`;
    
    // Запуск таймера оплаты
    startPaymentTimer(userCode);
}

// Скрыть модальное окно оплаты
function hidePaymentModal() {
    document.getElementById('payment-modal').classList.add('hidden');
    if (appState.currentUser && appState.currentUser.type === 'user') {
        stopPaymentTimer(appState.currentUser.code);
    }
}

// Запуск таймера оплаты
function startPaymentTimer(userCode) {
    appState.users[userCode].remainingTime = 3600; // 1 час в секундах
    
    if (appState.users[userCode].paymentTimer) {
        clearInterval(appState.users[userCode].paymentTimer);
    }
    
    appState.users[userCode].paymentTimer = setInterval(() => {
        appState.users[userCode].remainingTime--;
        
        if (appState.users[userCode].remainingTime <= 0) {
            // Увеличение долга по истечении времени
            appState.users[userCode].debtAmount += 10;
            appState.users[userCode].remainingTime = 3600;
            updateDebtSection();
            document.getElementById('payment-amount').textContent = `${appState.users[userCode].debtAmount}₽`;
        }
        
        updatePaymentTimerDisplay(userCode);
    }, 1000);
}

// Остановка таймера оплаты
function stopPaymentTimer(userCode) {
    if (appState.users[userCode].paymentTimer) {
        clearInterval(appState.users[userCode].paymentTimer);
        appState.users[userCode].paymentTimer = null;
    }
}

// Обновление отображения таймера оплаты
function updatePaymentTimerDisplay(userCode) {
    const minutes = Math.floor(appState.users[userCode].remainingTime / 60);
    const seconds = appState.users[userCode].remainingTime % 60;
    document.getElementById('payment-timer').textContent = 
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Обработка оплаты
async function handlePaymentSubmit(e) {
    e.preventDefault();
    
    if (appState.isProcessing || !appState.currentUser || appState.currentUser.type !== 'user') return;
    
    const userCode = appState.currentUser.code;
    const cardNumber = document.getElementById('card-number').value;
    const cardExpiry = document.getElementById('card-expiry').value;
    const cardCvc = document.getElementById('card-cvc').value;
    
    // Базовая валидация
    if (!validateCardData(cardNumber, cardExpiry, cardCvc)) {
        showError('Пожалуйста, проверьте правильность введенных данных карты');
        return;
    }
    
    setPaymentProcessingState(true);
    
    // Имитация обработки платежа
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Успешная оплата
    handleSuccessfulPayment(userCode);
    setPaymentProcessingState(false);
}

// Валидация данных карты
function validateCardData(number, expiry, cvc) {
    // Упрощенная валидация для демонстрации
    const cleanNumber = number.replace(/\s/g, '');
    return cleanNumber.length === 16 && 
           /^\d{2}\/\d{2}$/.test(expiry) && 
           /^\d{3}$/.test(cvc);
}

// Установка состояния обработки платежа
function setPaymentProcessingState(processing) {
    appState.isProcessing = processing;
    const btn = document.getElementById('submit-payment');
    const btnText = btn.querySelector('.btn-text');
    const loader = btn.querySelector('.btn-loader');
    
    if (processing) {
        btnText.classList.add('hidden');
        loader.classList.remove('hidden');
        btn.disabled = true;
    } else {
        btnText.classList.remove('hidden');
        loader.classList.add('hidden');
        btn.disabled = false;
    }
}

// Успешная оплата
function handleSuccessfulPayment(userCode) {
    // Сброс долга и рейтинга
    appState.users[userCode].debtAmount = 0;
    appState.users[userCode].rating = 0;
    
    // Остановка таймеров
    stopDebtTimer(userCode);
    stopPaymentTimer(userCode);
    
    // Обновление интерфейса
    updateRatingDisplay();
    updateDebtSection();
    hidePaymentModal();
    
    // Показать сообщение об успехе
    showSuccessMessage();
    saveUsers();
}

// Остановка таймера долга
function stopDebtTimer(userCode) {
    if (appState.users[userCode].debtTimer) {
        clearInterval(appState.users[userCode].debtTimer);
        appState.users[userCode].debtTimer = null;
    }
}

// Показать сообщение об ошибке
function showError(message) {
    document.getElementById('error-text').textContent = message;
    document.getElementById('error-message').classList.remove('hidden');
}

// Скрыть сообщение об ошибке
function hideError() {
    document.getElementById('error-message').classList.add('hidden');
}

// Показать сообщение об успехе
function showSuccessMessage() {
    document.getElementById('success-message').classList.remove('hidden');
}

// Скрыть сообщение об успехе
function hideSuccessMessage() {
    document.getElementById('success-message').classList.add('hidden');
}

// Показать настройки
function showSettings() {
    document.getElementById('settings-modal').classList.remove('hidden');
}

// Скрыть настройки
function hideSettings() {
    document.getElementById('settings-modal').classList.add('hidden');
}

// Переключение темы
function toggleTheme() {
    const newTheme = appState.settings.theme === 'light' ? 'dark' : 'light';
    changeTheme(newTheme);
}

// Изменение темы
function changeTheme(theme) {
    appState.settings.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    
    // Обновление иконки
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        const icon = themeToggle.querySelector('i');
        if (theme === 'dark') {
            icon.className = 'fas fa-sun';
        } else {
            icon.className = 'fas fa-moon';
        }
    }
    
    // Обновление активной опции в настройках
    document.querySelectorAll('.theme-option').forEach(option => {
        option.classList.remove('active');
        if (option.dataset.theme === theme) {
            option.classList.add('active');
        }
    });
    
    saveSettings();
}

// Выход из системы
function handleLogout() {
    // Сброс состояния
    appState.currentUser = null;
    
    // Остановка всех таймеров
    if (appState.currentUser && appState.currentUser.type === 'user') {
        const userCode = appState.currentUser.code;
        stopDebtTimer(userCode);
        stopPaymentTimer(userCode);
    }
    
    // Очистка полей ввода
    const inputs = document.querySelectorAll('#code-input-container .code-input');
    inputs.forEach(input => {
        input.value = '';
        input.classList.remove('filled', 'error');
    });
    
    document.getElementById('user-name-input').value = '';
    document.getElementById('admin-password').value = '';
    
    // Переключение на экран авторизации
    switchScreen('auth');
    
    // Очистка текущего пользователя
    localStorage.removeItem('githubPremiumCurrentUser');
}

// Инициализация приложения после загрузки DOM
document.addEventListener('DOMContentLoaded', initApp);

// Обработчик закрытия модальных окон по клику вне области
document.addEventListener('click', (e) => {
    if (e.target === document.getElementById('error-message')) {
        hideError();
    }
    if (e.target === document.getElementById('payment-modal')) {
        hidePaymentModal();
    }
    if (e.target === document.getElementById('success-message')) {
        hideSuccessMessage();
    }
    if (e.target === document.getElementById('settings-modal')) {
        hideSettings();
    }
});

// Обработчик Escape для закрытия модальных окон
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        hideError();
        hidePaymentModal();
        hideSuccessMessage();
        hideSettings();
    }
});
