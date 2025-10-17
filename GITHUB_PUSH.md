# 📤 Інструкція: Push на GitHub

## Крок 1: Створити репозиторій на GitHub

1. Відкрийте https://github.com/new
2. Увійдіть як `sauronx2`
3. Назва репозиторію: `turik` (або будь-яка інша)
4. Опис: `Tournament bracket with betting system`
5. **Public** або **Private** - на ваш вибір
6. **НЕ додавайте** README, .gitignore, license (у нас вже є!)
7. Натисніть **Create repository**

## Крок 2: Скопіюйте URL репозиторію

GitHub покаже вам URL виду:
```
https://github.com/sauronx2/turik.git
```

## Крок 3: Додайте remote та запуште

Виконайте команди в терміналі:

```bash
cd /Users/serhadov/turik

# Додати remote
git remote add origin https://github.com/sauronx2/turik.git

# Перевірити
git remote -v

# Push (GitHub попросить логін/пароль)
git push -u origin main
```

### При запиті логіну/пароля:

**Username:** `sauronx2`
**Password:** Використайте **Personal Access Token** (не ваш звичайний пароль!)

## ⚠️ Важливо про пароль!

GitHub більше не приймає звичайні паролі для HTTPS. Потрібен **Personal Access Token**.

### Як створити Token:

1. Відкрийте: https://github.com/settings/tokens
2. Натисніть **Generate new token (classic)**
3. Назва: `turik-deploy`
4. Expiration: `No expiration` (або на ваш вибір)
5. Виберіть scope: `repo` (повний доступ до репозиторіїв)
6. Натисніть **Generate token**
7. **СКОПІЮЙТЕ TOKEN** - він показується тільки один раз!
8. Використовуйте цей token замість пароля

## Альтернатива: SSH (якщо налаштовано)

```bash
# Якщо у вас є SSH ключ
git remote add origin git@github.com:sauronx2/turik.git
git push -u origin main
```

---

## Швидкий чеклист:

- [ ] Створив репозиторій на GitHub
- [ ] Скопіював URL репозиторію
- [ ] Додав remote: `git remote add origin URL`
- [ ] Створив Personal Access Token (якщо потрібно)
- [ ] Запушив: `git push -u origin main`
- [ ] Перевірив що код з'явився на GitHub

---

Після першого push, наступні рази просто:
```bash
git add .
git commit -m "ваше повідомлення"
git push
```
