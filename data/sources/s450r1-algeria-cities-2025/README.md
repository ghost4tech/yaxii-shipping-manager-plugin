# Algeria Cities 2025 🇩🇿

A comprehensive database of Algeria's administrative divisions, updated with the 2025 administrative reform that introduced 11 new wilayas.

## What's Inside

- **69 Wilayas** (48 original + 10 from 2019 + 11 new from 2025)
- **1,541 Communes** with both Arabic and Latin names
- Available in multiple formats: SQL, JSON, and XML

## The New Wilayas (59-69)

The 2025 reform added these wilayas:

| Code | Wilaya | Arabic |
|------|--------|--------|
| 59 | Aflou | أفلو |
| 60 | El Abiodh Sidi Cheikh | الأبيض سيدي الشيخ |
| 61 | El Aricha | العريشة |
| 62 | El Kantara | القنطرة |
| 63 | Barika | بريكة |
| 64 | Bou Saada | بوسعادة |
| 65 | Bir El Ater | بير العاتر |
| 66 | Ksar El Boukhari | قصر البخاري |
| 67 | Ksar Chellala | قصر الشلالة |
| 68 | Ain Oussara | عين وسارة |
| 69 | Messaad | مسعد |

## Files

```
├── sql/
│   └── cities.sql          # PostgreSQL/MySQL compatible
├── json/
│   └── cities.json         # Ready for APIs and web apps
└── xml/
    └── cities.xml          # For enterprise systems
```

## Quick Start

### SQL
```sql
-- Import into your database
psql your_database < sql/cities.sql
```

### JSON
```javascript
const data = require('./json/cities.json');
console.log(data.total_wilayas); // 69
console.log(data.total_communes); // 1541
```

### XML
```xml
<!-- Root element contains metadata, wilayas, and communes -->
<algeria_administrative_divisions>
  <metadata>...</metadata>
  <wilayas>...</wilayas>
  <communes>...</communes>
</algeria_administrative_divisions>
```

## Data Structure

Each commune has:
- `commune_id`: Unique identifier (1-1541)
- `wilaya_id`: Parent wilaya (1-69)
- `commune_name_arabic`: Arabic name
- `commune_name_latin`: Latin/French name

## Notes

- All data reflects the official 2025 administrative organization
- Communes are properly reassigned to their new wilayas
- Names include proper handling of special characters and apostrophes

## License

Public domain. Use it however you want.

---

Made with ❤️ for Algeria
