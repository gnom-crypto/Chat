// Функции для панели администратора

// Обновление отображения панели администратора
function updateAdminDisplay() {
    updateUsersList();
    updateStats();
}

// Обновление списка пользователей
function updateUsersList() {
    const usersList = document.getElementById('users-list');
    usersList.innerHTML = '';
    
    const userCodes = Object.keys(appState.users);
    
    if (userCodes.length === 0) {
        usersList.innerHTML = '<div class="no-users">Пользователи не найдены</div>';
        return;
    }
    
    userCodes.forEach(code => {
        const user = appState.users[code];
        const userItem = createUserItem(code, user);
        usersList.appendChild(userItem);
    });
}

// Создание элемента пользователя
function createUserItem(code, user) {
    const item = document.createElement('div');
    item.className = `user-item ${user.rating < 0 ? 'negative' : ''}`;
    
    item.innerHTML = `
        <div class="user-info-small">
            <div class="user-name">${user.name}</div>
            <div class="user-code">${formatCodeForDisplay(code)}</div>
        </div>
        <div class="user-rating">
            <div class="rating-value">${user.rating}</div>
            <div class="rating-controls-small">
                <button class="rating-btn-small negative" data-code="${code}" data-change="-10">-10</button>
                <button class="rating-btn-small negative" data-code="${code}" data-change="-1">-1</button>
                <button class="rating-btn-small positive" data-code="${code}" data-change="1">+1</button>
                <button class="rating-btn-small positive" data-code="${code}" data-change="10">+10</button>
            </div>
        </div>
    `;
    
    // Добавление обработчиков событий для кнопок
    const buttons = item.querySelectorAll('.rating-btn-small');
    buttons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const change = parseInt(button.dataset.change);
            changeUserRating(code, change);
        });
    });
    
    return item;
}

// Изменение рейтинга пользователя
function changeUserRating(code, change) {
    if (!appState.users[code]) return;
    
    const newRating = appState.users[code].rating + change;
    appState.users[code].rating = Math.max(-100, Math.min(100, newRating));
    
    // Если рейтинг стал отрицательным и долга нет, создать долг
    if (appState.users[code].rating < 0 && appState.users[code].debtAmount === 0) {
        appState.users[code].debtAmount = Math.floor(
            Math.random() * (CONFIG.INITIAL_DEBT_MAX - CONFIG.INITIAL_DEBT_MIN + 1) + CONFIG.INITIAL_DEBT_MIN
        );
    }
    
    // Если рейтинг стал положительным, сбросить долг
    if (appState.users[code].rating >= 0 && appState.users[code].debtAmount > 0) {
        appState.users[code].debtAmount = 0;
    }
    
    saveUsers();
    updateUsersList();
    updateStats();
    
    // Показать уведомление об изменении
    showAdminNotification(`Рейтинг пользователя ${appState.users[code].name} изменен на ${change}`);
}

// Обновление статистики
function updateStats() {
    const userCodes = Object.keys(appState.users);
    const totalUsers = userCodes.length;
    
    document.getElementById('total-users').textContent = totalUsers;
    
    if (totalUsers === 0) {
        document.getElementById('avg-rating').textContent = '0';
        document.getElementById('negative-rating').textContent = '0';
        return;
    }
    
    // Расчет среднего рейтинга
    const totalRating = userCodes.reduce((sum, code) => sum + appState.users[code].rating, 0);
    const avgRating = Math.round(totalRating / totalUsers);
    document.getElementById('avg-rating').textContent = avgRating;
    
    // Расчет пользователей с отрицательным рейтингом
    const negativeUsers = userCodes.filter(code => appState.users[code].rating < 0).length;
    document.getElementById('negative-rating').textContent = negativeUsers;
}

// Показать уведомление администратору
function showAdminNotification(message) {
    // Создание временного уведомления
    const notification = document.createElement('div');
    notification.className = 'admin-notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: var(--success-color);
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: var(--shadow);
        z-index: 1000;
        animation: slideInRight 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Удаление уведомления через 3 секунды
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Добавление CSS анимаций для уведомлений
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .no-users {
        text-align: center;
        padding: 40px;
        color: var(--text-muted);
        font-style: italic;
    }
`;
document.head.appendChild(style);
