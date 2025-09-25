// Простое шифрование данных для localStorage
// Внимание: это базовое шифрование для демонстрационных целей

const CRYPTO_KEY = 'github-premium-2023-secret-key';

// Шифрование данных
function encryptData(data) {
    try {
        // Простой алгоритм шифрования (XOR с ключом)
        let result = '';
        const key = CRYPTO_KEY;
        
        for (let i = 0; i < data.length; i++) {
            const charCode = data.charCodeAt(i) ^ key.charCodeAt(i % key.length);
            result += String.fromCharCode(charCode);
        }
        
        // Кодирование в base64 для безопасного хранения
        return btoa(result);
    } catch (error) {
        console.error('Ошибка шифрования:', error);
        return data;
    }
}

// Дешифрование данных
function decryptData(encryptedData) {
    try {
        // Декодирование из base64
        const data = atob(encryptedData);
        const key = CRYPTO_KEY;
        let result = '';
        
        for (let i = 0; i < data.length; i++) {
            const charCode = data.charCodeAt(i) ^ key.charCodeAt(i % key.length);
            result += String.fromCharCode(charCode);
        }
        
        return result;
    } catch (error) {
        console.error('Ошибка дешифрования:', error);
        return encryptedData;
    }
}

// Хеширование пароля (упрощенное)
function hashPassword(password) {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
}

// Проверка пароля
function verifyPassword(password, hash) {
    return hashPassword(password) === hash;
}
