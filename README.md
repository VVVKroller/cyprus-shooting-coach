```bash
npm i
npm run build

# Деплой
# 1. Загрузить /dist на хостинг
# 2. Настроить nginx для SPA:
location / {
    try_files $uri $uri/ /index.html;
}

# Firebase
# Создать проект и обновить конфиг в src/firebase/config.ts
# Правила к бд firestore.rules


# 3. Настроить Google Analytics
# Создать проект и обновить конфиг в src/App.ts

```
