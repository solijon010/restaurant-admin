// Latin -> Cyrillic translation map for UI strings
const translations: Record<string, Record<string, string>> = {
  // Common
  "Bosh sahifa": { cyrillic: "Бош саҳифа" },
  Profil: { cyrillic: "Профил" },
  Sozlamalar: { cyrillic: "Созламалар" },
  Chiqish: { cyrillic: "Чиқиш" },
  Kirish: { cyrillic: "Кириш" },
  "Kirish...": { cyrillic: "Кириш..." },
  Saqlash: { cyrillic: "Сақлаш" },
  "Bekor qilish": { cyrillic: "Бекор қилиш" },
  "Boshqaruv tizimi": { cyrillic: "Бошқарув тизими" },
  "Tizimga kirish": { cyrillic: "Тизимга кириш" },
  "Telefon raqam": { cyrillic: "Телефон рақам" },
  Parol: { cyrillic: "Парол" },
  "Demo foydalanuvchilar": { cyrillic: "Демо фойдаланувчилар" },
  "Super Admin": { cyrillic: "Супер Админ" },
  Menejer: { cyrillic: "Менежер" },

  // SuperAdmin
  Kompaniyalar: { cyrillic: "Компаниялар" },
  Menejerlar: { cyrillic: "Менежерлар" },
  "Jami kompaniyalar": { cyrillic: "Жами компаниялар" },
  "Jami filiallar": { cyrillic: "Жами филиаллар" },
  "Jami xodimlar": { cyrillic: "Жами ходимлар" },
  "Sotilgan kompaniyalar": { cyrillic: "Сотилган компаниялар" },
  "Filiallar holati": { cyrillic: "Филиаллар ҳолати" },
  Faol: { cyrillic: "Фаол" },
  Arxiv: { cyrillic: "Архив" },

  // Manager
  Filiallar: { cyrillic: "Филиаллар" },
  Xodimlar: { cyrillic: "Ходимлар" },
  Mahsulotlar: { cyrillic: "Маҳсулотлар" },
  Buyurtmalar: { cyrillic: "Буюртмалар" },
  "Moliyaviy ko'rsatkichlar": { cyrillic: "Молиявий кўрсаткичлар" },
  Daromad: { cyrillic: "Даромад" },
  Xarajat: { cyrillic: "Харажат" },
  "Xonalar va zal": { cyrillic: "кабина ва зал" },
  Foyda: { cyrillic: "Фойда" },
  "O'rtacha kunlik daromad": { cyrillic: "Ўртача кунлик даромад" },
  "Oxirgi buyurtmalar": { cyrillic: "Охирги буюртмалар" },

  // Settings
  Mavzu: { cyrillic: "Мавзу" },
  "Yorug'": { cyrillic: "Ёруғ" },
  "Qorong'u": { cyrillic: "Қоронғу" },
  Til: { cyrillic: "Тил" },
  Lotin: { cyrillic: "Лотин" },
  Kiril: { cyrillic: "Кирил" },
  "Yozuv o'lchami": { cyrillic: "Ёзув ўлчами" },
  Kichik: { cyrillic: "Кичик" },
  "O'rta": { cyrillic: "Ўрта" },
  Katta: { cyrillic: "Катта" },

  // Profile
  "Shaxsiy ma'lumotlar": { cyrillic: "Шахсий маълумотлар" },
  "Ism familiya": { cyrillic: "Исм фамилия" },
  Lavozim: { cyrillic: "Лавозим" },
  Kompaniya: { cyrillic: "Компания" },
  Nomi: { cyrillic: "Номи" },
  Asoschisi: { cyrillic: "Асосчиси" },
  Telefon: { cyrillic: "Телефон" },
  Tavsif: { cyrillic: "Тавсиф" },
  Ism: { cyrillic: "Исм" },
  Familiya: { cyrillic: "Фамилия" },
  "Logo yuklash": { cyrillic: "Лого юклаш" },
  Filial: { cyrillic: "Филиал" },

  // Nav items
  "Umumiy hisobot": { cyrillic: "Умумий ҳисобот" },
  "Xona yaratish": { cyrillic: "Хона яратиш" },
  "Ofitsiant hisoboti": { cyrillic: "Официант ҳисоботи" },
  "Savdo tahlili": { cyrillic: "Савдо таҳлили" },
  "Boshqaruv": { cyrillic: "Бошқарув" },
  "Filial qo'shish": { cyrillic: "Филиал қўшиш" },
  "Qo'shish": { cyrillic: "Қўшиш" },
  "Ko'rinish": { cyrillic: "Кўриниш" },
  "Interfeys tili": { cyrillic: "Интерфейс тили" },
  "Ilova parametrlari va filiallarni boshqaring": { cyrillic: "Илова параметрлари ва филиалларни бошқаринг" },
  "Kompaniya filiallari": { cyrillic: "Компания филиаллари" },
  "Filialni tahrirlash": { cyrillic: "Филиални таҳрирлаш" },
  "Yangi filial": { cyrillic: "Янги филиал" },
  "Profil sozlamalari": { cyrillic: "Профил созламалари" },
  "Shaxsiy ma'lumotlarni ko'rish": { cyrillic: "Шахсий маълумотларни кўриш" },

  // Ranges
  "1 hafta": { cyrillic: "1 ҳафта" },
  "1 oy": { cyrillic: "1 ой" },
  "3 oy": { cyrillic: "3 ой" },
  "6 oy": { cyrillic: "6 ой" },
  "1 yil": { cyrillic: "1 йил" },
};

export function t(text: string, language: 'latin' | 'cyrillic'): string {
  if (language === 'latin') return text;
  return translations[text]?.cyrillic || text;
}
