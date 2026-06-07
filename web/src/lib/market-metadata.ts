// web/src/lib/market-metadata.ts
// All Unsplash photo IDs verified from live search results

export type MarketCategory = 'Crypto' | 'Politics' | 'Sports' | 'Science' | 'Finance' | 'Other';

export interface MarketMeta {
  category: MarketCategory;
  imageUrl: string;
  description?: string;
}

export const CATEGORY_GRADIENTS: Record<string, string> = {
  Crypto:   'from-orange-400 to-amber-600',
  Politics: 'from-sky-400 to-blue-600',
  Sports:   'from-emerald-400 to-green-600',
  Science:  'from-violet-400 to-purple-600',
  Finance:  'from-blue-400 to-indigo-600',
  Other:    'from-slate-400 to-gray-600',
};

const BASE = 'https://images.unsplash.com/photo-';
const Q = '?auto=format&fit=crop&w=800&q=80';

// ── Verified Unsplash Photo IDs (all free, non-Plus) ──────────────────────────
const PHOTOS = {
  // CRYPTO
  btc_gold_coin:        `${BASE}1518546305927-5a555bb7020d${Q}`,
  btc_nuggets:          `${BASE}1623227413711-25ee4388dae3${Q}`,
  btc_pile:             `${BASE}1640161704729-cbe966a08476${Q}`,
  btc_monitor:          `${BASE}1516245834210-c4c142787335${Q}`,
  btc_motherboard:      `${BASE}1641580529558-a96cf6efbc72${Q}`,
  btc_coins_pile:       `${BASE}1641802914005-2a9b0f3165b0${Q}`,
  trading_chart:        `${BASE}1605792657660-596af9009e82${Q}`,
  eth_diamond:          `${BASE}1620321023374-d1a68fbc720d${Q}`,
  eth_star_gold:        `${BASE}1622790698141-94e30457ef12${Q}`,
  eth_coin_pink:        `${BASE}1639987759021-bc55a0c96ce1${Q}`,
  circuit_blue:         `${BASE}1643000296927-f4f1c8722b7d${Q}`,
  eth_chip:             `${BASE}1641580546594-cab974df226d${Q}`,
  coins_stack:          `${BASE}1649274496773-c40eacd66e2d${Q}`,

  // POLITICS / GOVERNMENT
  us_capitol:           `${BASE}1501139083538-0139ad88d29a${Q}`,
  government_flag:      `${BASE}1529107386315-ec3a1e2ad02b${Q}`,
  eiffel_paris:         `${BASE}1499856844487-8b2d0a8ec2e3${Q}`,
  uk_parliament:        `${BASE}1486299267070-83823f5448d5${Q}`,
  nuclear_plant:        `${BASE}1509391366360-2e47e03e369e${Q}`,
  tech_person:          `${BASE}1620712943543-bcc4688e7485${Q}`,
  podium_speech:        `${BASE}1557804506-669a67965ba0${Q}`,
  diplomacy_flags:      `${BASE}1532375810709-75b1da3537e3${Q}`,

  // SPORTS
  soccer_trophy:        `${BASE}1518091043644-c1d4457512c6${Q}`,
  soccer_stadium:       `${BASE}1705593973313-75de7bf95b56${Q}`,
  soccer_trophy_grass:  `${BASE}1527871454777-032ec3f75edc${Q}`,
  soccer_ball_trophy:   `${BASE}1637203727318-fb31b63e2377${Q}`,
  basketball_court:     `${BASE}1546519638-68e109498ffc${Q}`,
  tennis_court:         `${BASE}1595435934249-5df7ed86e1c0${Q}`,
  formula1_race:        `${BASE}1558618666-fcd25c85cd64${Q}`,
  mma_boxing:           `${BASE}1549719032-f0c0f97c72b5${Q}`,
  football_stadium:     `${BASE}1540747913346-19e16fa184b7${Q}`,

  // SCIENCE & TECH
  cpu_chip:             `${BASE}1518770660439-4636190af475${Q}`,
  ai_robot:             `${BASE}1485827404703-89b55fcc595e${Q}`,
  space_station:        `${BASE}1446776709462-d6b525c57bd3${Q}`,
  ai_laptop:            `${BASE}1677442135703-1787eea5ce01${Q}`,
  spacex_rocket:        `${BASE}1541185933-ef5d7ed93073${Q}`,
  mars_planet:          `${BASE}1614728263952-84ea256f9d5d${Q}`,

  // FINANCE
  gold_bars:            `${BASE}1610375461246-83df859d849d${Q}`,
  federal_reserve:      `${BASE}1526304640581-d338cdaa14e2${Q}`,
  inflation_market:     `${BASE}1580048915913-4a8a94b60fc1${Q}`,
  stock_chart:          `${BASE}1611974789855-9c2a0a7236a3${Q}`,

  // OTHER
  gaming_controller:    `${BASE}1550745165-9bc0b252726f${Q}`,
  concert_lights:       `${BASE}1493225457124-a3eb161ffa5f${Q}`,
};

// ── Keyword-based matcher ─────────────────────────────────────────────────────
function matchByQuestion(q: string): MarketMeta {
  const t = q.toLowerCase();

  // ── CRYPTO ──
  if (t.includes('bitcoin') && (t.includes('150') || t.includes('200k') || t.includes('hit') || t.includes('above')))
    return { category: 'Crypto', imageUrl: PHOTOS.btc_gold_coin };
  if (t.includes('bitcoin') && t.includes('dominance'))
    return { category: 'Crypto', imageUrl: PHOTOS.trading_chart };
  if (t.includes('bitcoin') && t.includes('etf'))
    return { category: 'Crypto', imageUrl: PHOTOS.btc_monitor };
  if (t.includes('bitcoin') && t.includes('central bank'))
    return { category: 'Crypto', imageUrl: PHOTOS.btc_coins_pile };
  if (t.includes('bitcoin') || t.includes('btc'))
    return { category: 'Crypto', imageUrl: PHOTOS.btc_nuggets };

  if (t.includes('ethereum') && t.includes('10,000'))
    return { category: 'Crypto', imageUrl: PHOTOS.eth_diamond };
  if ((t.includes('eth/btc') || t.includes('eth')) && t.includes('ratio'))
    return { category: 'Crypto', imageUrl: PHOTOS.eth_star_gold };
  if (t.includes('ethereum') || t.includes(' eth'))
    return { category: 'Crypto', imageUrl: PHOTOS.eth_diamond };

  if (t.includes('solana') || t.includes(' sol'))
    return { category: 'Crypto', imageUrl: PHOTOS.circuit_blue };
  if (t.includes('coinbase') || t.includes('s&p 500'))
    return { category: 'Crypto', imageUrl: PHOTOS.stock_chart };
  if (t.includes('crypto market cap') || t.includes('trillion'))
    return { category: 'Crypto', imageUrl: PHOTOS.btc_pile };
  if (t.includes('crypto') || t.includes('blockchain') || t.includes('defi'))
    return { category: 'Crypto', imageUrl: PHOTOS.trading_chart };

  // ── POLITICS ──
  if (t.includes('trump') || t.includes('impeach'))
    return { category: 'Politics', imageUrl: PHOTOS.us_capitol };
  if (t.includes('newsom') || (t.includes('democratic') && t.includes('2028')))
    return { category: 'Politics', imageUrl: PHOTOS.podium_speech };
  if (t.includes('iran') && t.includes('nuclear'))
    return { category: 'Politics', imageUrl: PHOTOS.nuclear_plant };
  if (t.includes('government shutdown') || t.includes('us federal'))
    return { category: 'Politics', imageUrl: PHOTOS.us_capitol };
  if (t.includes('macron') || t.includes('france'))
    return { category: 'Politics', imageUrl: PHOTOS.eiffel_paris };
  if (t.includes('uk') || t.includes('eu') || t.includes('brexit'))
    return { category: 'Politics', imageUrl: PHOTOS.uk_parliament };
  if (t.includes('elon') || t.includes('musk'))
    return { category: 'Politics', imageUrl: PHOTOS.tech_person };
  if (t.includes('iran') || t.includes('peace deal'))
    return { category: 'Politics', imageUrl: PHOTOS.diplomacy_flags };
  if (t.includes('election') || t.includes('president') || t.includes('politic'))
    return { category: 'Politics', imageUrl: PHOTOS.podium_speech };

  // ── SPORTS ──
  if (t.includes('world cup') || t.includes('fifa') || t.includes('brazil'))
    return { category: 'Sports', imageUrl: PHOTOS.soccer_trophy };
  if (t.includes('real madrid') || t.includes('champions league') || t.includes('ucl'))
    return { category: 'Sports', imageUrl: PHOTOS.soccer_stadium };
  if (t.includes('manchester city') || t.includes('premier league'))
    return { category: 'Sports', imageUrl: PHOTOS.soccer_ball_trophy };
  if (t.includes('soccer') || (t.includes('football') && !t.includes('nfl')))
    return { category: 'Sports', imageUrl: PHOTOS.soccer_trophy_grass };
  if (t.includes('nba') || t.includes('knicks') || t.includes('basketball'))
    return { category: 'Sports', imageUrl: PHOTOS.basketball_court };
  if (t.includes('djokovic') || t.includes('tennis') || t.includes('grand slam'))
    return { category: 'Sports', imageUrl: PHOTOS.tennis_court };
  if (t.includes('formula') || t.includes('f1') || t.includes('mclaren') || t.includes('ferrari'))
    return { category: 'Sports', imageUrl: PHOTOS.formula1_race };
  if (t.includes('mma') || t.includes('ufc') || t.includes('jones') || t.includes('aspinall') || t.includes('boxing'))
    return { category: 'Sports', imageUrl: PHOTOS.mma_boxing };
  if (t.includes('sport') || t.includes('champion') || t.includes('league'))
    return { category: 'Sports', imageUrl: PHOTOS.football_stadium };

  // ── SCIENCE & TECH ──
  if (t.includes('spacex') || t.includes('mars') || t.includes('rocket'))
    return { category: 'Science', imageUrl: PHOTOS.spacex_rocket };
  if (t.includes('space station') || t.includes('astronaut') || t.includes('orbital'))
    return { category: 'Science', imageUrl: PHOTOS.space_station };
  if (t.includes('openai') || t.includes('gpt') || t.includes('chatgpt') || t.includes('claude'))
    return { category: 'Science', imageUrl: PHOTOS.ai_laptop };
  if (t.includes('agi') || t.includes('artificial general') || t.includes('superintelligence'))
    return { category: 'Science', imageUrl: PHOTOS.ai_robot };
  if (t.includes('apple') && t.includes('chip'))
    return { category: 'Science', imageUrl: PHOTOS.cpu_chip };
  if (t.includes('nvidia') || t.includes('h100') || t.includes('gpu') || t.includes('chip') || t.includes('silicon'))
    return { category: 'Science', imageUrl: PHOTOS.cpu_chip };
  if (t.includes('ai') || t.includes('machine learning') || t.includes('llm'))
    return { category: 'Science', imageUrl: PHOTOS.ai_laptop };
  if (t.includes('science') || t.includes('tech') || t.includes('technology'))
    return { category: 'Science', imageUrl: PHOTOS.ai_robot };

  // ── FINANCE ──
  if (t.includes('gold') && (t.includes('oz') || t.includes('price') || t.includes('4,000')))
    return { category: 'Finance', imageUrl: PHOTOS.gold_bars };
  if (t.includes('federal reserve') || t.includes('fed') || t.includes('interest rate') || t.includes('rate cut'))
    return { category: 'Finance', imageUrl: PHOTOS.federal_reserve };
  if (t.includes('inflation') || t.includes('cpi') || t.includes('consumer price'))
    return { category: 'Finance', imageUrl: PHOTOS.inflation_market };
  if (t.includes('s&p') || t.includes('stock') || t.includes('nasdaq') || t.includes('market cap'))
    return { category: 'Finance', imageUrl: PHOTOS.stock_chart };
  if (t.includes('finance') || t.includes('economy') || t.includes('gdp') || t.includes('recession'))
    return { category: 'Finance', imageUrl: PHOTOS.federal_reserve };

  // ── OTHER ──
  if (t.includes('gta') || t.includes('grand theft') || t.includes('game') || t.includes('rockstar'))
    return { category: 'Other', imageUrl: PHOTOS.gaming_controller };
  if (t.includes('taylor swift') || t.includes('concert') || t.includes('tour') || t.includes('music'))
    return { category: 'Other', imageUrl: PHOTOS.concert_lights };

  // Default fallback
  return { category: 'Other', imageUrl: PHOTOS.trading_chart };
}

// ── Known addresses (existing 3 deployed markets) ─────────────────────────────
const ADDRESS_MAP: Record<string, MarketMeta> = {
  // SpaceX Mars
  '0xf7794a208d67d459082d69409be6c07e21694382': {
    category: 'Science',
    imageUrl: PHOTOS.spacex_rocket,
  },
  // BTC > $200k
  '0x15d1112fc7db8cc01e77285777a309d841f86e03': {
    category: 'Crypto',
    imageUrl: PHOTOS.btc_gold_coin,
  },
  // ETH/BTC ratio
  '0x4cfa1cda1732399f4861f4722a46b4439cbe318d': {
    category: 'Crypto',
    imageUrl: PHOTOS.eth_star_gold,
  },
};

// ── Public API ────────────────────────────────────────────────────────────────
export function getMarketMeta(address: string, question: string): MarketMeta {
  const key = address.toLowerCase();
  if (ADDRESS_MAP[key]) return ADDRESS_MAP[key];
  return matchByQuestion(question);
}
