# Cloudflare Worker Setup Guide

Bu rehber, ücretsiz Cloudflare Worker ile CORS proxy kurulumunu anlatıyor.

## Adım 1: Cloudflare Hesabı Oluşturun

1. [cloudflare.com](https://cloudflare.com) adresine gidin
2. Ücretsiz hesap oluşturun

## Adım 2: Worker Oluşturun

1. Cloudflare Dashboard'a giriş yapın
2. Sol menüden **Workers & Pages** seçin
3. **Create Application** → **Create Worker** tıklayın
4. Worker'a bir isim verin (örn: `price-list-proxy`)
5. **Deploy** butonuna tıklayın

## Adım 3: Kodu Deploy Edin

### Yöntem 1: Dashboard Üzerinden (Kolay)

1. Worker oluşturulduktan sonra **Quick Edit** tıklayın
2. Sağdaki editördeki tüm kodu silin
3. `cloudflare-worker.js` dosyasındaki kodu kopyalayıp yapıştırın
4. **Save and Deploy** tıklayın

### Yöntem 2: Wrangler CLI ile (Gelişmiş)

```bash
# Wrangler CLI'ı yükleyin
npm install -g wrangler

# Cloudflare hesabınıza giriş yapın
wrangler login

# Worker'ı deploy edin
wrangler deploy cloudflare-worker.js
```

## Adım 4: Worker URL'ini Alın

Deploy edildikten sonra worker URL'iniz şöyle olacak:
```
https://price-list-proxy.YOUR_SUBDOMAIN.workers.dev
```

## Adım 5: Projenizde Kullanın

### Geliştirme Ortamında

`.env.local` dosyası oluşturun:

```bash
VITE_CORS_PROXY=https://price-list-proxy.YOUR_SUBDOMAIN.workers.dev/?url=
```

### GitHub Actions için

1. GitHub repository'nizde **Settings** → **Secrets and variables** → **Actions**
2. **New repository secret** tıklayın
3. Name: `VITE_CORS_PROXY`
4. Secret: `https://price-list-proxy.YOUR_SUBDOMAIN.workers.dev/?url=`
5. **Add secret** tıklayın

### GitHub Actions Workflow'u Güncelleyin

`.github/workflows/deploy.yml` dosyasında build adımını güncelleyin:

```yaml
- name: Build
  env:
    VITE_CORS_PROXY: ${{ secrets.VITE_CORS_PROXY }}
  run: npm run build
```

## Adım 6: Test Edin

Tarayıcınızda şu URL'i açın:

```
https://price-list-proxy.YOUR_SUBDOMAIN.workers.dev/?url=https://binekarac2.vw.com.tr/app/local/fiyatlardata/fiyatlar-test.json
```

JSON verisi dönüyorsa başarılı! 🎉

## Güvenlik Notları

`cloudflare-worker.js` içinde `allowedDomains` listesi var:

```javascript
const allowedDomains = [
  'binekarac2.vw.com.tr',
  'www.skoda.com.tr',
  // Yeni markalar ekledikçe buraya ekleyin
]
```

Yeni marka eklerken domain'i bu listeye eklemeyi unutmayın!

## Ücretsiz Tier Limitleri

- ✅ 100,000 istek/gün
- ✅ CPU: 10ms/istek
- ✅ Sınırsız worker sayısı

Bu limitler çoğu kullanım için yeterlidir. Daha fazlası için [Cloudflare Pricing](https://developers.cloudflare.com/workers/platform/pricing/) sayfasına bakın.

## Sorun Giderme

### "Worker not found" hatası
- Worker URL'ini doğru kopyaladığınızdan emin olun
- Deploy işleminin tamamlandığını kontrol edin

### "Domain not allowed" hatası
- `cloudflare-worker.js` içindeki `allowedDomains` listesine domain ekleyin
- Worker'ı yeniden deploy edin

### Rate limit hatası
- Günlük 100k limit aşılmış olabilir
- Cloudflare dashboard'dan usage'ı kontrol edin
