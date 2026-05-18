export const egyptLocations: Record<string, string[]> = {
  'القاهرة': ['Nasr City', 'Maadi', 'Heliopolis', 'New Cairo', 'Zamalek', 'Dokki', 'Mohandessin', 'Giza', 'October City'],
  'الإسكندرية': ['Montaza', 'Sidi Gaber', 'Smouha', 'Miami', 'Stanley', 'Gleem', 'Roushdy'],
  'الجيزة': ['Haram', 'Faisal', 'Agouza', 'Imbaba', 'Boulaq', 'Omraneya'],
  'القليوبية': ['Banha', 'Shubra El-Kheima', 'Qalyub', 'Khanka', 'Obour City'],
  'الشرقية': ['Zagazig', '10th of Ramadan', 'Bilbeis', 'Abu Kabir'],
  'الدقهلية': ['Mansoura', 'Mit Ghamr', 'Talkha', 'Aga'],
  'الغربية': ['Tanta', 'El-Mahalla El-Kubra', 'Kafr El-Zayat', 'Samannoud'],
  'المنوفية': ['Shebin El-Kom', 'Menouf', 'Ashmoun', 'Quesna'],
  'البحيرة': ['Damanhour', 'Kafr El-Dawwar', 'Rashid', 'Edku'],
  'كفر الشيخ': ['Kafr El-Sheikh', 'Desouk', 'Baltim', 'Fuwwah'],
  'دمياط': ['Damietta', 'New Damietta', 'Ras El-Bar', 'Faraskour'],
  'بورسعيد': ['Port Said City', 'Port Fouad', 'El-Arab District'],
  'الإسماعيلية': ['Ismailia City', 'El-Qantara', 'Fayed', 'Abu Sultan'],
  'السويس': ['Suez City', 'El-Arbaeen', 'Attaka', 'Faisal'],
  'شمال سيناء': ['Arish', 'Sheikh Zuweid', 'Rafah', 'Bir al-Abd'],
  'جنوب سيناء': ['Sharm El-Sheikh', 'Dahab', 'Nuweiba', 'Taba', 'Saint Catherine'],
  'الفيوم': ['Fayoum City', 'Ibsheway', 'Sinnuris', 'Tamiya'],
  'بني سويف': ['Beni Suef City', 'El-Wasta', 'Nasser', 'Beba'],
  'المنيا': ['Minya City', 'Mallawi', 'Samalut', 'Beni Mazar'],
  'أسيوط': ['Asyut City', 'Abnub', 'El-Qusiya', 'Manfalut'],
  'سوهاج': ['Sohag City', 'Akhmim', 'Girga', 'Tahta'],
  'قنا': ['Qena City', 'Nag Hammadi', 'Qift', 'Qus'],
  'الأقصر': ['Luxor City', 'Esna', 'Armant', 'El-Tod'],
  'أسوان': ['Aswan City', 'Kom Ombo', 'Edfu', 'Abu Simbel'],
  'البحر الأحمر': ['Hurghada', 'Safaga', 'El-Quseir', 'Marsa Alam'],
  'الوادي الجديد': ['Kharga', 'Dakhla', 'Farafra', 'Paris'],
  'مطروح': ['Marsa Matrouh', 'El-Alamein', 'Sidi Barrani', 'Siwa'],
};

export const governorates = Object.keys(egyptLocations);

export const getCitiesByGovernorate = (governorate: string): string[] => {
  return egyptLocations[governorate] || [];
};
