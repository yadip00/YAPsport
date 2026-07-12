import { Product, StoreSettings } from '../types';

// Import generated product images
import jerseyTimnasRed from '../assets/images/jersey_timnas_red_1783497242858.jpg';
import jerseyRetro1998 from '../assets/images/jersey_retro_1998_1783497258068.jpg';
import jerseyBlackGold from '../assets/images/jersey_black_gold_1783497271939.jpg';
import proSoccerBall from '../assets/images/pro_soccer_ball_1783497287001.jpg';
import badmintonRacket from '../assets/images/badminton_racket_1783497303559.jpg';
import goalkeeperGloves from '../assets/images/goalkeeper_gloves_1783497330298.jpg';
import duffelBag from '../assets/images/duffel_bag_1783497369431.jpg';
import neopreneDumbbells from '../assets/images/neoprene_dumbbells_1783497394689.jpg';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Jersey Timnas Indonesia Red Edition 2026',
    category: 'jersey',
    price: 185000,
    image: jerseyTimnasRed,
    description: 'Jersey Timnas Indonesia edisi kandang berwarna merah kebanggaan. Menggunakan bahan dri-fit jarum premium berpori mikro yang sangat sejuk, menyerap keringat dengan instan, dan sangat lentur. Dilengkapi dengan bordir emblem Garuda bertekstur timbul (3D) berkualitas tinggi dan jahitan rapi berstandar apparel profesional.',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    stock: 45,
    isFeatured: true
  },
  {
    id: 'prod-2',
    name: 'Jersey Retro Classic Indonesia 1998',
    category: 'jersey',
    price: 165000,
    image: jerseyRetro1998,
    description: 'Bawa kembali memori emas sepak bola tanah air dengan Jersey Retro Indonesia edisi klasik tahun 1998. Desain leher kerah berkancing tradisional yang elegan, perpaduan warna merah menyala dengan motif khas tenun nusantara di bagian pundak. Terbuat dari bahan polyester jacquard berkualitas tinggi.',
    sizes: ['M', 'L', 'XL'],
    stock: 15,
    isFeatured: true
  },
  {
    id: 'prod-3',
    name: 'Jersey Premium Black & Gold Training Edition',
    category: 'jersey',
    price: 135000,
    image: jerseyBlackGold,
    description: 'Jersey edisi khusus latihan dengan kombinasi warna hitam pekat dan detail emas metalik yang tampak gagah dan mewah. Sangat pas untuk berbagai jenis aktivitas olahraga seperti futsal, mini soccer, gym, maupun running. Menggunakan teknologi cepat kering (quick-dry) agar tubuh Anda tetap sejuk.',
    sizes: ['S', 'M', 'L', 'XL'],
    stock: 35,
    isFeatured: false
  },
  {
    id: 'prod-4',
    name: 'Bola Sepak Pro Official Match Ball Size 5',
    category: 'equipment',
    price: 245000,
    image: proSoccerBall,
    description: 'Bola sepak size 5 yang diproduksi dengan teknologi jahit mesin hibrida berpresisi tinggi. Menghasilkan bentuk bulat sempurna untuk stabilitas aerodinamis yang optimal di udara. Memiliki bantalan foam EVA tebal untuk sentuhan bola yang empuk, pantulan konsisten, serta ketahanan luar biasa di lapangan rumput maupun sintetis.',
    stock: 25,
    isFeatured: true
  },
  {
    id: 'prod-5',
    name: 'Raket Badminton Carbon Power 1000',
    category: 'equipment',
    price: 385000,
    image: badmintonRacket,
    description: 'Raket badminton profesional berbahan full carbon fiber High Modulus Graphite berkualitas tinggi. Karakter raket yang sangat ringan (82-84 gram) dikombinasikan dengan titik keseimbangan condong ke kepala (head-heavy) untuk memberikan tenaga smash yang mematikan namun tetap lincah saat bermanuver defense.',
    stock: 10,
    isFeatured: true
  },
  {
    id: 'prod-6',
    name: 'Sarung Tangan Kiper Latex Grip Pro',
    category: 'equipment',
    price: 195000,
    image: goalkeeperGloves,
    description: 'Berikan proteksi maksimal bagi gawang Anda dengan sarung tangan kiper profesional ini. Dilengkapi dengan latex alam tebal 4mm pada bagian telapak tangan untuk daya cengkeram (grip) yang sangat lengket dan meredam kerasnya hantaman bola. Sistem pelindung jari (finger-safe) mencegah cedera terkilir.',
    stock: 12,
    isFeatured: false
  },
  {
    id: 'prod-7',
    name: 'Tas Duffel Gym & Futsal Waterproof',
    category: 'equipment',
    price: 110000,
    image: duffelBag,
    description: 'Tas olahraga duffel serbaguna berbahan nylon tebal anti air (waterproof) berkualitas tinggi. Dilengkapi dengan kompartemen khusus sepatu di bagian samping luar yang memiliki ventilasi udara khusus agar tidak pengap. Tali bahu yang empuk dapat diatur panjang pendeknya, sangat nyaman dibawa ke mana saja.',
    stock: 20,
    isFeatured: false
  },
  {
    id: 'prod-8',
    name: 'Dumbbell Set Neoprene Premium 2 x 5kg',
    category: 'equipment',
    price: 175000,
    image: neopreneDumbbells,
    description: 'Sepasang dumbbell besi cor solid seberat 5kg (total 10kg) berlapis karet neoprene premium berwarna cerah. Lapisan luar neoprene memberikan perlindungan ekstra terhadap lantai dari benturan, meredam suara benturan, serta nyaman digenggam dan tidak licin bahkan ketika tangan sedang basah berkeringat.',
    stock: 18,
    isFeatured: false
  }
];

export const INITIAL_SETTINGS: StoreSettings = {
  storeName: 'YAP Sport & Apparel',
  storeTagline: 'Pusat Jersey Bola Premium & Perlengkapan Olahraga UMKM Terlengkap',
  whatsappNumber: '628123456789', // Default WhatsApp number for the merchant (Indonesia format)
  address: 'Jl. Pemuda No. 45, Kota Yogyakarta, DI Yogyakarta 55122',
  shippingFee: 15000,
  currencySymbol: 'Rp ',
  currencyCode: 'IDR',
  requireVisitorLogin: false
};
