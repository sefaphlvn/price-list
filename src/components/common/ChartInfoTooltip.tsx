import { InfoCircleOutlined } from '@ant-design/icons';
import { Popover } from 'antd';
import { ReactNode } from 'react';
import { tokens } from '../../theme/tokens';

interface ChartInfoTooltipProps {
  title: string;
  description: string | ReactNode;
  placement?: 'top' | 'right' | 'bottom' | 'left' | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
}

/**
 * Info icon with popover tooltip for explaining charts
 * Place in top-right corner of Card using Card's extra prop
 */
export const ChartInfoTooltip = ({ title, description, placement = 'topRight' }: ChartInfoTooltipProps) => {
  return (
    <Popover
      title={<span style={{ fontWeight: 600 }}>{title}</span>}
      content={
        <div style={{ maxWidth: 300, fontSize: 13, lineHeight: 1.6 }}>
          {description}
        </div>
      }
      placement={placement}
      trigger="hover"
      overlayStyle={{ maxWidth: 350 }}
    >
      <InfoCircleOutlined
        style={{
          color: tokens.colors.gray[400],
          fontSize: 16,
          cursor: 'help',
          transition: 'color 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = tokens.colors.accent;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = tokens.colors.gray[400];
        }}
      />
    </Popover>
  );
};

// Chart descriptions for reuse
export const chartDescriptions = {
  // Statistics Page
  priceDistribution: {
    title: 'Fiyat Dağılımı',
    description: 'Araçların fiyat aralıklarına göre dağılımını gösterir. Her çubuk, o fiyat aralığındaki araç sayısını temsil eder.',
  },
  modelCount: {
    title: 'Model Sayısı',
    description: 'Her markanın piyasada aktif olarak satışta olan model/versiyon sayısını gösterir.',
  },
  brandPriceComparison: {
    title: 'Marka Fiyat Karşılaştırması',
    description: 'Markaların ortalama araç fiyatlarını karşılaştırır. Üst kısımdaki çizgi medyan fiyatı gösterir.',
  },
  fuelDistribution: {
    title: 'Yakıt Tipi Dağılımı',
    description: 'Piyasadaki araçların yakıt tiplerine göre yüzdesel dağılımını gösterir (Benzin, Dizel, Hybrid, Elektrik).',
  },
  transmissionDistribution: {
    title: 'Şanzıman Dağılımı',
    description: 'Otomatik ve manuel şanzımanlı araçların piyasadaki oranını gösterir.',
  },
  modelYearDistribution: {
    title: 'Model Yılı Dağılımı',
    description: 'Araçların model yıllarına göre dağılımını gösterir. En güncel model yılları daha fazla araç içerir.',
  },
  powertrainDistribution: {
    title: 'Güç Aktarımı Dağılımı',
    description: 'Elektrikli, Hybrid, Plug-in Hybrid, Mild Hybrid ve içten yanmalı motor dağılımını gösterir. Elektrifikasyon oranını takip etmek için kullanışlıdır.',
  },
  avgPriceByPowertrain: {
    title: 'Güç Aktarımına Göre Ort. Fiyat',
    description: 'Her güç aktarımı tipinin ortalama fiyatını karşılaştırır. Elektrikli araçlar genellikle daha yüksek fiyat segmentinde yer alır.',
  },
  driveTypeDistribution: {
    title: 'Çekiş Tipi Dağılımı',
    description: '4x4 (AWD), önden çekiş (FWD) ve arkadan çekiş (RWD) araçların dağılımını gösterir.',
  },
  avgPriceByDriveType: {
    title: 'Çekiş Tipi Fiyatları',
    description: 'Her çekiş tipinin ortalama fiyatını karşılaştırır. AWD araçlar genellikle daha pahalıdır.',
  },
  powerSegments: {
    title: 'Güç Segmentleri',
    description: 'Araçları beygir gücüne göre segmentlere ayırır. Hangi güç aralığında kaç araç olduğunu görmenizi sağlar.',
  },
  bestHpValue: {
    title: 'En İyi Güç/Fiyat Değeri',
    description: 'TL başına en yüksek beygir gücü sunan araçları listeler. Düşük TL/HP = daha iyi değer.',
  },
  evTopRange: {
    title: 'En Uzun Menzilli EV\'ler',
    description: 'WLTP standardına göre en uzun menzile sahip elektrikli araçları sıralar.',
  },
  evBestValue: {
    title: 'En İyi EV Değeri (TL/km)',
    description: 'Kilometre başına en düşük maliyetli elektrikli araçları listeler. Menzil ve fiyat dengesini gösterir.',
  },
  otvDistribution: {
    title: 'ÖTV Oranı Dağılımı',
    description: 'Araçların ÖTV (Özel Tüketim Vergisi) oranlarına göre dağılımını gösterir. Motor hacmi ve emisyon değerlerine göre ÖTV oranları değişir.',
  },
  avgPriceByOtv: {
    title: 'ÖTV ve Fiyat İlişkisi',
    description: 'ÖTV oranı ile ortalama fiyat arasındaki ilişkiyi gösterir. Yüksek ÖTV\'li araçlar genellikle daha pahalıdır.',
  },
  brandOtvComparison: {
    title: 'Marka ÖTV Karşılaştırması',
    description: 'Her markanın portföyündeki araçların ortalama ÖTV oranını gösterir. Düşük ÖTV\'li segmentlere yoğunlaşan markalar daha düşük ortalamaya sahiptir.',
  },
  avgPriceByModelYear: {
    title: 'Yıllara Göre Fiyat',
    description: 'Her model yılının ortalama fiyatını gösterir. Yeni model yılları genellikle daha yüksek fiyatlara sahiptir.',
  },
  brandFuelBreakdown: {
    title: 'Marka Yakıt Dağılımı',
    description: 'Her markanın portföyündeki yakıt tipi çeşitliliğini gösterir. Markaların elektrikli/hybrid stratejilerini karşılaştırmak için kullanışlıdır.',
  },

  // Insights Page
  topDeals: {
    title: 'En İyi Fırsatlar',
    description: 'Segment ortalamasına göre en uygun fiyatlı araçları listeler. Deal Score, fiyat/değer oranını ölçer - yüksek skor daha iyi fırsat demektir.',
  },
  cheapOutliers: {
    title: 'Ucuz Sapmalar',
    description: 'Segmentindeki diğer araçlara göre belirgin şekilde düşük fiyatlı araçları gösterir. Kampanya veya stok eritme fırsatları olabilir.',
  },
  expensiveOutliers: {
    title: 'Pahalı Sapmalar',
    description: 'Segmentindeki diğer araçlara göre belirgin şekilde yüksek fiyatlı araçları gösterir. Premium donanım veya özel versiyon olabilir.',
  },
  priceDrops: {
    title: 'Fiyat Düşüşleri',
    description: 'Son dönemde fiyatı düşen araçları listeler. Yüzdesel düşüş ve önceki fiyat bilgisi içerir.',
  },

  // Promos Page
  campaignDiscounts: {
    title: 'Kampanya İndirimleri',
    description: 'Liste fiyatından yapılan kampanya indirimlerini gösterir. İndirim yüzdesi ve tasarruf miktarını içerir.',
  },
  recentPriceChanges: {
    title: 'Son Fiyat Değişiklikleri',
    description: 'Son 7 gün içinde fiyatı değişen araçları listeler. Artış ve düşüşler ayrı ayrı gösterilir.',
  },

  // Insights Page - Additional Charts
  scoreDistribution: {
    title: 'Fiyat Skoru Dağılımı',
    description: 'Araçların fiyat skorlarına göre dağılımını gösterir. 80-100 arası mükemmel fırsatları, 60-80 iyi fırsatları temsil eder.',
  },
  brandLeaderboard: {
    title: 'Marka Değer Sıralaması',
    description: 'Markaların ortalama fiyat skorlarını karşılaştırır. Yüksek skor, o markanın araçlarının segment ortalamasına göre daha uygun fiyatlı olduğunu gösterir.',
  },
  priceDeviation: {
    title: 'Fiyat Sapma Analizi',
    description: 'Her aracın segment ortalamasından ne kadar saptığını gösterir. Negatif sapma uygun fiyatı, pozitif sapma yüksek fiyatı ifade eder. Nokta büyüklüğü fiyat skorunu temsil eder.',
  },
  fuelAnalysis: {
    title: 'Yakıt Tipine Göre Değer',
    description: 'Her yakıt tipinin ortalama fiyat skorunu gösterir. Hangi yakıt tipinde daha fazla fırsat olduğunu anlamak için kullanışlıdır.',
  },
  topBrandsByDeals: {
    title: 'En Çok Fırsatlı Markalar',
    description: 'En fazla iyi fırsat (70+ skor) sunan markaları sıralar. Yüzde değeri, o markanın toplam araçları içindeki fırsat oranını gösterir.',
  },

  // Positioning Page
  pricePercentile: {
    title: 'Fiyat Yüzdeliği',
    description: 'Seçilen aracın segment içindeki fiyat konumunu gösterir. %25 altı bütçe dostu, %75 üstü premium segmenti temsil eder.',
  },
  similarVehicles: {
    title: 'Benzer Araçlar',
    description: 'Aynı segmentteki benzer özelliklere sahip araçları listeler. Benzerlik skoru, motor, yakıt ve donanım özelliklerinin uyumuna göre hesaplanır.',
  },
  priceBands: {
    title: 'Fiyat Bantları',
    description: 'Segmentteki araçların fiyat aralıklarına göre dağılımını gösterir. Vurgulanan bant, seçilen aracın bulunduğu fiyat aralığıdır.',
  },
};
