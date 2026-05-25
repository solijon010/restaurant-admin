# Loyiha qoidalari (Git workflow)

## Majburiy qoidalar — bu qoidalar barcha ishtirokchilar uchun tegishli

### 1. Commit xabarlari
- Commit xabarlarida **hech qachon** "using Claude", "Co-Authored-By: Claude", "Generated with Claude" yoki shunga o'xshash iboralarni yozmang
- Commit xabari faqat o'zgarishni qisqacha tavsiflashi kerak (masalan: `Add order history persistence`, `Fix table card design`)

### 2. Branch ochish
- `main` yoki `test` branchlariga **to'g'ridan-to'g'ri push qilmang**
- Har bir yangi vazifa uchun **alohida branch** oching:
  ```
  git checkout test
  git pull restaurant test
  git checkout -b feature/vazifa-nomi
  ```
- Branch nomlash: `feature/...`, `fix/...`, `hotfix/...`

### 3. Pull Request
- Ish tugagach PR faqat **`test` branchga** yuboriladi, `main` ga emas
- PR sarlavhasi o'zgarishni aniq tavsiflashi kerak

### 4. Push tartibi
```bash
# 1. Yangi branch oching
git checkout -b feature/mening-vazifam

# 2. O'zgarishlarni commit qiling (Claude iborasiz)
git add .
git commit -m "Qisqa va aniq tavsif"

# 3. test branchiga PR uchun push qiling
git push -u restaurant feature/mening-vazifam

# 4. GitHub da test branchiga PR oching
```

### 5. main branch
- `main` ga faqat `test` branch orqali, barcha testlar o'tgandan keyin merge qilinadi
- Hech kim `main` ga bevosita push qilmaydi

---

> Bu qoidalar loyihaning barcha ishtirokchilari — inson bo'lsin, AI yordamchisi bo'lsin — uchun majburiydir.

---

## Ish doirasi — QATTIQ CHEKLOV

### 6. Faqat Manager paneli
- **Faqat `src/pages/manager/` ichidagi fayllar** o'zgartiriladi
- `src/pages/superadmin/` papkasiga **hech qachon, hech qanday sababsiz tegmang**
- Superadmin sahifalariga tegish — qat'iy taqiq, istisno yo'q

### 7. Ishni boshlashdan oldin — MAJBURIY SAVOL BOSQICHI
- Har qanday vazifa kelganda **birinchi navbatda kod yozish TAQIQLANGAN**
- Ishni boshlamasdan oldin foydalanuvchiga **bir nechta aniqlashtiruvchi savol** berish majburiy:
  - Qaysi sahifada o'zgartirish kerak?
  - Dizayn qanday ko'rinishi kerak? (rang, joylashuv, o'lcham)
  - Funksional o'zgarish bormi yoki faqat dizaynmi?
  - Mobil ko'rinish ham o'zgartirilsinmi?
  - Qanday natijani kutmoqdasiz?
- Foydalanuvchi barcha savolga javob berguncha **hech qanday fayl o'zgartirilmaydi**

### 8. O'z-o'zidan o'zgartirish — TAQIQLANGAN
- Foydalanuvchi aniq ruxsat bermagan narsani **mustaqil o'zgartirmang**
- "Shu bilan birga shu narsani ham tuzatdim" — bu qoida buzilishi hisoblanadi
- Faqat so'ralgan narsa, faqat ko'rsatilgan joyda, faqat tasdiqlangandan keyin

---

> Bu qoidalar loyihaning barcha ishtirokchilari — inson bo'lsin, AI yordamchisi bo'lsin — uchun majburiydir.
