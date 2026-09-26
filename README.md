# Life Sim — living village prototype

A player-independent, deterministic **fictional** village simulation. The first scenario is Üyük around 1600; generated names, population and jobs are gameplay placeholders, **not verified historical records**.

## Run

Requires Node.js 20+.

```bash
npm test
npm run sim -- uyuk-1600 14
npm run genealogy -- uyuk-1600 4
```

The initial prototype creates interconnected households, parents, children and partners; assigns traits, hobbies, jobs, needs and resources; and advances daily decisions with explicit reasons. The same seed produces the same village and sequence of days.

## Current limitations

One major activity per person per day; no travel, marriage, death, births, long-term goals, weather, trade network or NPC-to-NPC relationship graph yet. Memories are bounded event records, not a complete psychological model. This is a simulation foundation, not a finished living town.

Next: multiple daily time slots, social graph, persistent goals and event-driven plan changes; then multi-year demographic and economic simulation.

## Genealogy-first direction

The new `src/genealogy.js` creates founder couples, their adult children and a third generation of grandchildren. It maintains reciprocal parent/child links, partners, birth years and household membership. `observerPersonId: null` means no player is required. The earlier daily activity prototype remains available but is not the current development focus.

## Connected lineages

Run `npm run lineage -- uyuk-1600 8` to inspect multiple families linked by marriages, their children and deceased founders. Dead people remain in genealogy but not living households. `npm test` includes a 1,000-seed chronological integrity stress test. The original daily activity engine is retained but not the current focus.

## Karakter hayat defterleri

Her insanın (bebekler ve ölmüş atalar dahil) hayat defteri aynı kanonik yaşam olaylarından üretilir. Defterler doğumdan ölüme kadar kronolojik ilerler; bebeklik, çocukluk, gençlik, yetişkinlik ve yaşlılık bölümlerine ayrılır. Yedi yaşından önceki olaylar kişisel anı olarak değil, aile kaydı olarak sunulur. Çizim ve karalama alanları yoktur.

- Tüm defter: `npm run notebook -- uyuk-1600 1`
- Sadece çocukluk: `npm run notebook -- uyuk-1600 1 çocukluk`
- Başka karakter: son sayısal kimliği değiştirin.
- Kanonik olay dökümü: `npm run book -- uyuk-1600 1`

Başlangıç kuşağındaki dede ve ninelerin anne-babaları bilinmiyor (`?`); onların ataları ayrıca üretilmez. Hane adları oyun içi aile tanımlayıcılarıdır, modern resmî soyadı değildir.

## 1600 öncesi köy geçmişi (ilk replay)

`npm run village -- uyuk-1600 1` komutu, kurucu kuşağın doğumundan 1600'e kadar yıllık hane hesaplarını, çıraklığa/mesleğe girişleri ve hane içi ortak olayları üretir; ardından seçilen kişinin defterini gösterir. `src/village-history.js` hane gıda/para defterlerini, yıllık nüfusu, kişi kimliklerine bağlı ilişki olaylarını ve meslek kayıtlarını tutar. Aynı seed aynı geçmişi verir.

**Sınır:** Bu, mevcut soy ağacındaki doğum/evlilik/ölüm tarihlerini girdi alan retrospektif bir simülasyonun ilk sürümüdür. Nüfusun tamamı henüz yıl yıl doğup karar vererek oluşmaz; mesleklerin tarihsel doğruluğu ve köyün vergi/arazi/üretim koşulları ayrıca araştırılmalıdır. Bu sürüm, Üyük'ün 1600'deki gerçek nüfusunu temsil ettiği iddiasında değildir.
