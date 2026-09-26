// Fictional 1600 Üyük name palette. Family labels are game-internal house names,
// not modern legal surnames or claims about documented local demographics.
export const GIVEN_NAMES = Object.freeze({
 F:Object.freeze(["Ayşe","Fatma","Emine","Hatice","Zeynep","Elif","Meryem","Havva","Hacer","Safiye","Rabia","Zeliha","Gülbahar","Gülsüm","Esma","Şerife","Rukiye","Saliha","Hümeyra","Ümmühan","Döndü","Sultan","Kezban","Nazlı","Gülşah","Aişe","Hanife","Melek","Binnaz","Fadime"]),
 M:Object.freeze(["Mehmet","Ali","Hasan","Mustafa","Hüseyin","İbrahim","Osman","Yusuf","İsmail","Ömer","Ahmet","Mahmut","Süleyman","Halil","İlyas","Yakup","Musa","İdris","Salih","Bekir","Hamza","Abdullah","Ramazan","Recep","Şaban","Hızır","Yunus","Sinan","Bayram","Veli"])
});
export const HOUSE_NAMES=Object.freeze(["Demirci","Değirmenci","Çoban","Kavaklı","Akpınarlı","Karaağaçlı","Sarıca","Karaca","Taşçı","Dokumacı","Çakırlı","Köseli","Uzunlar","Küçükler","Yazıcı","Çiftçi","Çömlekçi","Kalaycı","Arıcı","Oduncu","Dervişoğlu","Kurtlu","Gökçeli","Söğütlü"]);
export function pickName(rng,sex){if(!GIVEN_NAMES[sex])throw new Error("Unknown sex");return rng.pick(GIVEN_NAMES[sex]);}
export function pickHouseName(rng){return rng.pick(HOUSE_NAMES);}
