/* OMH catalogue data.
   To edit the shop, change only this file:
   - OMH_CONFIG: WhatsApp number, city, currency
   - OMH_CATEGORIES: the shoe types shown in the rail (shape = drawing used until real photos exist)
   - OMH_PRODUCTS: one entry per model. `sizes` is [smallest, largest] EU size,
     `soldOut` lists sizes not in stock, `img` can later hold a photo path ("img/atlas.jpg"). */

window.OMH_CONFIG = {
  whatsapp: "212600000000", // international format, no + or spaces
  city: { fr: "Casablanca", ar: "الدار البيضاء", en: "Casablanca" },
  currency: { fr: "DH", ar: "درهم", en: "MAD" },
  freeDeliveryFrom: 500
};

window.OMH_CATEGORIES = [
  { id: "sneakers",   shape: "sneaker",    fr: "Baskets",               ar: "سنيكرز",            en: "Sneakers" },
  { id: "running",    shape: "runner",     fr: "Running",               ar: "أحذية الجري",       en: "Running" },
  { id: "basketball", shape: "hightop",    fr: "Basketball",            ar: "كرة السلة",         en: "Basketball" },
  { id: "football",   shape: "cleat",      fr: "Crampons",              ar: "أحذية كرة القدم",   en: "Football boots" },
  { id: "mocassins",  shape: "loafer",     fr: "Mocassins",             ar: "موكاسان",           en: "Loafers" },
  { id: "classic",    shape: "oxford",     fr: "Derby & Richelieu",     ar: "أحذية كلاسيكية",    en: "Derby & Oxford" },
  { id: "bottines",   shape: "chelsea",    fr: "Bottines",              ar: "بوطيات قصيرة",      en: "Ankle boots" },
  { id: "bottes",     shape: "boot",       fr: "Bottes",                ar: "بوط طويل",          en: "Tall boots" },
  { id: "talons",     shape: "heel",       fr: "Escarpins & talons",    ar: "كعب عالي",          en: "Heels" },
  { id: "sandales",   shape: "sandal",     fr: "Sandales",              ar: "صنادل",             en: "Sandals" },
  { id: "claquettes", shape: "slide",      fr: "Claquettes & tongs",    ar: "شلاكات",            en: "Slides & flip-flops" },
  { id: "babouches",  shape: "babouche",   fr: "Babouches",             ar: "بلاغي",             en: "Babouches" },
  { id: "ballerines", shape: "ballet",     fr: "Ballerines",            ar: "باليرينا",          en: "Ballet flats" },
  { id: "espadrilles",shape: "espadrille", fr: "Espadrilles",           ar: "إسبادري",           en: "Espadrilles" },
  { id: "mules",      shape: "mule",       fr: "Mules",                 ar: "ميول",              en: "Mules" },
  { id: "securite",   shape: "safety",     fr: "Sécurité & travail",    ar: "أحذية العمل",       en: "Safety & work" },
  { id: "pantoufles", shape: "slipper",    fr: "Pantoufles",            ar: "بانطوفة",           en: "Slippers" },
  { id: "enfants",    shape: "kids",       fr: "Enfants",               ar: "أحذية الأطفال",     en: "Kids" },
  { id: "accessoires",shape: "care",       fr: "Chaussettes & soins",   ar: "جوارب ومنتجات العناية", en: "Socks & care" }
];

window.OMH_MATERIALS = {
  cuir:   { fr: "Cuir",          ar: "جلد",          en: "Leather" },
  daim:   { fr: "Daim",          ar: "شمواه",        en: "Suede" },
  toile:  { fr: "Toile",         ar: "قماش",         en: "Canvas" },
  mesh:   { fr: "Mesh respirant",ar: "شبكة تهوية",   en: "Breathable mesh" },
  synth:  { fr: "Synthétique",   ar: "اصطناعي",      en: "Synthetic" },
  gomme:  { fr: "Caoutchouc",    ar: "كاوتشو",       en: "Rubber" },
  laine:  { fr: "Laine",         ar: "صوف",          en: "Wool" },
  raphia: { fr: "Jute & toile",  ar: "حلفاء وقماش",  en: "Jute & canvas" },
  coton:  { fr: "Coton",         ar: "قطن",          en: "Cotton" }
};

/* Colour names used in the product sheet and in the WhatsApp message. */
window.OMH_COLORS = {
  "#F4F4F2": { fr: "Blanc",        ar: "أبيض",        en: "White" },
  "#1B1F2A": { fr: "Noir",         ar: "أسود",        en: "Black" },
  "#2E4A7D": { fr: "Marine",       ar: "أزرق داكن",   en: "Navy" },
  "#E9E4D8": { fr: "Écru",         ar: "بيج فاتح",    en: "Ecru" },
  "#E7C9C3": { fr: "Rose poudré",  ar: "وردي فاتح",   en: "Blush" },
  "#2541B2": { fr: "Bleu roi",     ar: "أزرق ملكي",   en: "Royal blue" },
  "#F4B400": { fr: "Safran",       ar: "زعفراني",     en: "Saffron" },
  "#7FB7A4": { fr: "Menthe",       ar: "نعناعي",      en: "Mint" },
  "#55603A": { fr: "Kaki",         ar: "كاكي",        en: "Khaki" },
  "#C8341F": { fr: "Rouge",        ar: "أحمر",        en: "Red" },
  "#6B3A22": { fr: "Cognac",       ar: "كونياك",      en: "Cognac" },
  "#B88A5A": { fr: "Camel",        ar: "جملي",        en: "Camel" },
  "#3B2418": { fr: "Chocolat",     ar: "بني غامق",    en: "Chocolate" },
  "#D4A64A": { fr: "Doré",         ar: "ذهبي",        en: "Gold" },
  "#8C8F9A": { fr: "Gris",         ar: "رمادي",       en: "Grey" }
};

/* gender: h = homme, f = femme, e = enfant, u = unisexe */
window.OMH_PRODUCTS = [
  // Baskets
  { id: "atlas",    cat: "sneakers", name: { fr: "Atlas", ar: "أطلس", en: "Atlas" }, gender: "u", price: 449, sizes: [36, 46], soldOut: [46], colors: ["#F4F4F2", "#1B1F2A"], mat: "cuir", isNew: true },
  { id: "derb",     cat: "sneakers", name: { fr: "Derb", ar: "درب", en: "Derb" }, gender: "u", price: 329, sizes: [36, 45], soldOut: [], colors: ["#2E4A7D", "#E9E4D8"], mat: "toile" },
  { id: "rif-low",  cat: "sneakers", name: { fr: "Rif Low", ar: "ريف لو", en: "Rif Low" }, gender: "f", price: 389, sizes: [35, 41], soldOut: [35], colors: ["#E7C9C3", "#F4F4F2"], mat: "daim" },
  // Running
  { id: "souffle",  cat: "running", name: { fr: "Souffle", ar: "نفس", en: "Souffle" }, gender: "h", price: 549, sizes: [39, 46], soldOut: [], colors: ["#2541B2", "#F4B400"], mat: "mesh", isNew: true },
  { id: "corniche", cat: "running", name: { fr: "Corniche", ar: "كورنيش", en: "Corniche" }, gender: "f", price: 529, sizes: [35, 42], soldOut: [42], colors: ["#7FB7A4", "#F4F4F2"], mat: "mesh" },
  { id: "trail-toubkal", cat: "running", name: { fr: "Toubkal Trail", ar: "توبقال ترايل", en: "Toubkal Trail" }, gender: "u", price: 649, sizes: [37, 46], soldOut: [], colors: ["#55603A", "#C8341F"], mat: "synth" },
  // Basketball
  { id: "dunk-medina", cat: "basketball", name: { fr: "Medina High", ar: "مدينة هاي", en: "Medina High" }, gender: "u", price: 699, sizes: [39, 47], soldOut: [47], colors: ["#C8341F", "#F4F4F2"], mat: "cuir" },
  { id: "rebond",   cat: "basketball", name: { fr: "Rebond", ar: "ربوند", en: "Rebond" }, gender: "h", price: 599, sizes: [40, 47], soldOut: [], colors: ["#1B1F2A", "#F4B400"], mat: "synth" },
  // Crampons
  { id: "stade",    cat: "football", name: { fr: "Stade FG", ar: "ستاد", en: "Stade FG" }, gender: "h", price: 459, sizes: [38, 46], soldOut: [], colors: ["#F4B400", "#1B1F2A"], mat: "synth" },
  { id: "mini-stade", cat: "football", name: { fr: "Stade Junior", ar: "ستاد جونيور", en: "Stade Junior" }, gender: "e", price: 259, sizes: [28, 37], soldOut: [28], colors: ["#2541B2", "#F4F4F2"], mat: "synth" },
  { id: "futsal",   cat: "football", name: { fr: "Salle IN", ar: "صالة", en: "Futsal IN" }, gender: "u", price: 349, sizes: [37, 45], soldOut: [], colors: ["#F4F4F2", "#2541B2"], mat: "daim" },
  // Mocassins
  { id: "habous",   cat: "mocassins", name: { fr: "Habous", ar: "الحبوس", en: "Habous" }, gender: "h", price: 579, sizes: [39, 46], soldOut: [], colors: ["#6B3A22", "#1B1F2A"], mat: "cuir" },
  { id: "gueliz",   cat: "mocassins", name: { fr: "Guéliz", ar: "جليز", en: "Gueliz" }, gender: "f", price: 489, sizes: [36, 41], soldOut: [], colors: ["#B88A5A", "#1B1F2A"], mat: "daim" },
  // Classique
  { id: "fes-derby", cat: "classic", name: { fr: "Fès Derby", ar: "فاس ديربي", en: "Fes Derby" }, gender: "h", price: 749, sizes: [39, 46], soldOut: [39], colors: ["#3B2418", "#1B1F2A"], mat: "cuir", isNew: true },
  { id: "notaire",  cat: "classic", name: { fr: "Richelieu Notaire", ar: "ريشليو", en: "Notaire Oxford" }, gender: "h", price: 799, sizes: [39, 46], soldOut: [], colors: ["#1B1F2A", "#6B3A22"], mat: "cuir" },
  // Bottines
  { id: "chelsea-ifrane", cat: "bottines", name: { fr: "Chelsea Ifrane", ar: "تشيلسي إفران", en: "Ifrane Chelsea" }, gender: "u", price: 689, sizes: [36, 46], soldOut: [], colors: ["#6B3A22", "#1B1F2A"], mat: "cuir" },
  { id: "azrou",    cat: "bottines", name: { fr: "Azrou", ar: "أزرو", en: "Azrou" }, gender: "f", price: 629, sizes: [36, 41], soldOut: [41], colors: ["#B88A5A", "#3B2418"], mat: "daim" },
  // Bottes
  { id: "cavaliere", cat: "bottes", name: { fr: "Cavalière", ar: "كافاليير", en: "Riding boot" }, gender: "f", price: 899, sizes: [36, 41], soldOut: [], colors: ["#1B1F2A", "#3B2418"], mat: "cuir" },
  { id: "pluie",    cat: "bottes", name: { fr: "Botte de pluie", ar: "بوط الشتا", en: "Rain boot" }, gender: "u", price: 269, sizes: [30, 45], soldOut: [], colors: ["#55603A", "#F4B400"], mat: "gomme" },
  // Talons
  { id: "soiree",   cat: "talons", name: { fr: "Soirée 9 cm", ar: "سواريه 9 سم", en: "Soiree 9 cm" }, gender: "f", price: 559, sizes: [35, 41], soldOut: [35], colors: ["#1B1F2A", "#C8341F"], mat: "cuir" },
  { id: "bureau",   cat: "talons", name: { fr: "Bureau 5 cm", ar: "بيرو 5 سم", en: "Office 5 cm" }, gender: "f", price: 459, sizes: [35, 42], soldOut: [], colors: ["#E7C9C3", "#1B1F2A"], mat: "daim" },
  { id: "mariage",  cat: "talons", name: { fr: "Fête dorée", ar: "عرس ذهبي", en: "Golden party" }, gender: "f", price: 649, sizes: [35, 41], soldOut: [], colors: ["#D4A64A", "#F4F4F2"], mat: "synth", isNew: true },
  // Sandales
  { id: "essaouira", cat: "sandales", name: { fr: "Essaouira", ar: "الصويرة", en: "Essaouira" }, gender: "f", price: 299, sizes: [35, 41], soldOut: [], colors: ["#B88A5A", "#F4F4F2"], mat: "cuir" },
  { id: "randonnee", cat: "sandales", name: { fr: "Sandale Rando", ar: "صندل المشي", en: "Hiking sandal" }, gender: "h", price: 389, sizes: [39, 46], soldOut: [], colors: ["#1B1F2A", "#55603A"], mat: "synth" },
  // Claquettes
  { id: "plage",    cat: "claquettes", name: { fr: "Claquette Plage", ar: "شلاكة البحر", en: "Beach slide" }, gender: "u", price: 129, sizes: [35, 46], soldOut: [], colors: ["#2541B2", "#F4F4F2"], mat: "gomme" },
  { id: "tong",     cat: "claquettes", name: { fr: "Tong", ar: "صبّاط الإصبع", en: "Flip-flop" }, gender: "u", price: 79, sizes: [35, 46], soldOut: [], colors: ["#F4B400", "#1B1F2A"], mat: "gomme" },
  // Babouches
  { id: "babouche-fes", cat: "babouches", name: { fr: "Babouche de Fès", ar: "بلغة فاسية", en: "Fes babouche" }, gender: "h", price: 249, sizes: [39, 46], soldOut: [], colors: ["#F4B400", "#F4F4F2"], mat: "cuir" },
  { id: "babouche-brodee", cat: "babouches", name: { fr: "Babouche brodée", ar: "شربيل مطرز", en: "Embroidered babouche" }, gender: "f", price: 279, sizes: [35, 41], soldOut: [41], colors: ["#C8341F", "#D4A64A"], mat: "daim" },
  { id: "babouche-enfant", cat: "babouches", name: { fr: "Babouche enfant", ar: "بلغة صغار", en: "Kids babouche" }, gender: "e", price: 149, sizes: [24, 34], soldOut: [], colors: ["#2541B2", "#F4F4F2"], mat: "cuir" },
  // Ballerines
  { id: "danse",    cat: "ballerines", name: { fr: "Ballerine Nœud", ar: "باليرينا بالعقدة", en: "Bow flat" }, gender: "f", price: 299, sizes: [35, 41], soldOut: [], colors: ["#1B1F2A", "#E7C9C3"], mat: "cuir" },
  { id: "ballerine-fille", cat: "ballerines", name: { fr: "Ballerine Fille", ar: "باليرينا البنات", en: "Girls flat" }, gender: "e", price: 189, sizes: [24, 34], soldOut: [], colors: ["#E7C9C3", "#D4A64A"], mat: "synth" },
  // Espadrilles
  { id: "asilah",   cat: "espadrilles", name: { fr: "Asilah", ar: "أصيلة", en: "Asilah" }, gender: "u", price: 239, sizes: [36, 45], soldOut: [], colors: ["#2E4A7D", "#E9E4D8"], mat: "raphia" },
  // Mules
  { id: "mule-riad", cat: "mules", name: { fr: "Mule Riad", ar: "ميول رياض", en: "Riad mule" }, gender: "f", price: 349, sizes: [35, 41], soldOut: [], colors: ["#7FB7A4", "#B88A5A"], mat: "daim" },
  { id: "sabot",    cat: "mules", name: { fr: "Sabot cuir", ar: "صابو جلد", en: "Leather clog" }, gender: "u", price: 419, sizes: [36, 45], soldOut: [], colors: ["#6B3A22", "#1B1F2A"], mat: "cuir" },
  // Sécurité
  { id: "chantier", cat: "securite", name: { fr: "Chantier S3", ar: "شانطي S3", en: "Site S3" }, gender: "h", price: 459, sizes: [38, 47], soldOut: [], colors: ["#1B1F2A", "#F4B400"], mat: "cuir" },
  { id: "blouse",   cat: "securite", name: { fr: "Soin antidérapant", ar: "مضاد للانزلاق", en: "Non-slip clinic" }, gender: "u", price: 289, sizes: [35, 46], soldOut: [], colors: ["#F4F4F2", "#2541B2"], mat: "synth" },
  // Pantoufles
  { id: "dar",      cat: "pantoufles", name: { fr: "Dar", ar: "دار", en: "Dar" }, gender: "u", price: 149, sizes: [35, 46], soldOut: [], colors: ["#8C8F9A", "#C8341F"], mat: "laine" },
  { id: "dar-kids", cat: "pantoufles", name: { fr: "Dar Mini", ar: "دار ميني", en: "Dar Mini" }, gender: "e", price: 99, sizes: [22, 34], soldOut: [], colors: ["#F4B400", "#2541B2"], mat: "laine" },
  // Enfants
  { id: "premiers-pas", cat: "enfants", name: { fr: "Premiers pas", ar: "الخطوات الأولى", en: "First steps" }, gender: "e", price: 199, sizes: [19, 24], soldOut: [], colors: ["#F4F4F2", "#7FB7A4"], mat: "cuir", isNew: true },
  { id: "ecole",    cat: "enfants", name: { fr: "École scratch", ar: "حذاء المدرسة", en: "School strap" }, gender: "e", price: 239, sizes: [26, 38], soldOut: [26], colors: ["#1B1F2A", "#F4F4F2"], mat: "synth" },
  { id: "lumineuse", cat: "enfants", name: { fr: "Basket lumineuse", ar: "سبرديلة بالضو", en: "Light-up sneaker" }, gender: "e", price: 259, sizes: [24, 35], soldOut: [], colors: ["#E7C9C3", "#2541B2"], mat: "synth" },
  // Accessoires
  { id: "chaussettes", cat: "accessoires", name: { fr: "Chaussettes coton x3", ar: "تقاشر قطن ×3", en: "Cotton socks x3" }, gender: "u", price: 69, sizes: [35, 46], soldOut: [], colors: ["#F4F4F2", "#1B1F2A"], mat: "coton" },
  { id: "semelles", cat: "accessoires", name: { fr: "Semelles confort", ar: "فرشات مريحة", en: "Comfort insoles" }, gender: "u", price: 89, sizes: [35, 46], soldOut: [], colors: ["#2541B2", "#B88A5A"], mat: "synth" },
  { id: "creme",    cat: "accessoires", name: { fr: "Kit entretien cuir", ar: "عدة تلميع الجلد", en: "Leather care kit" }, gender: "u", price: 119, sizes: null, soldOut: [], colors: ["#6B3A22", "#1B1F2A"], mat: "cuir" }
];
