// Off-chain enrichment for on-chain markets.
// The blockchain stores only `question` + `deadline`. Images, categories, and
// descriptions live here. `getMarketMeta` tries an exact address lookup first,
// then falls back to keyword matching against the question.

export interface MarketMeta {
  category: 'Crypto' | 'Politics' | 'Sports' | 'Science' | 'Finance' | 'Other';
  imageUrl: string;
  description?: string;
  tags?: string[];
}

// Category gradient Tailwind classes — used as fallback when imageUrl fails to load.
export const CATEGORY_GRADIENTS: Record<string, string> = {
  Crypto:   'from-orange-400 to-amber-600',
  Politics: 'from-sky-400 to-blue-600',
  Sports:   'from-emerald-400 to-green-600',
  Science:  'from-violet-400 to-purple-600',
  Finance:  'from-blue-400 to-indigo-600',
  Other:    'from-slate-400 to-gray-600',
};

const u = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=800&q=80`;

// Static map: lowercase address → metadata.
// Includes the 3 markets deployed before the seed scripts.
export const MARKET_META: Record<string, MarketMeta> = {
  '0xf7794a208d67d459082d69409be6c07e21694382': {
    category: 'Science',
    imageUrl: u('1446776811523-87a49e82e79c'),
    description: 'Resolves YES if SpaceX successfully lands humans on Mars before January 1, 2027.',
    tags: ['spacex', 'mars', 'space'],
  },
  '0x15d1112fc7db8cc01e77285777a309d841f86e03': {
    category: 'Crypto',
    imageUrl: u('1518546305927-4b663fcb447b'),
    description: 'Resolves YES if the BTC-USD daily close on Coinbase exceeds $200,000 on Dec 31, 2026.',
    tags: ['bitcoin', 'btc', 'price'],
  },
  '0x4cfa1cda1732399f4861f4722a46b4439cbe318d': {
    category: 'Crypto',
    imageUrl: u('1642543492481-d07f91cf5eff'),
    description: 'Resolves YES if the ETH/BTC spot ratio on Binance exceeds 0.10 on any day within 30 days of creation.',
    tags: ['ethereum', 'bitcoin', 'ratio'],
  },
};

export function getMarketMeta(address: string, question: string): MarketMeta {
  const addr = address.toLowerCase();
  const cached = MARKET_META[addr];
  if (cached) return cached;

  const q = question.toLowerCase();

  // ── Crypto ────────────────────────────────────────────────────────────────
  if (q.includes('bitcoin dominance') || q.includes('btc dominance')) {
    return { category: 'Crypto', imageUrl: u('1624996379697-f13d9fc7d787') };
  }
  if (q.includes('central bank') && q.includes('bitcoin')) {
    return { category: 'Crypto', imageUrl: u('1640340434855-6fdde1f065c7') };
  }
  if (
    q.includes('crypto market cap') ||
    (q.includes('market cap') && (q.includes('crypto') || q.includes('trillion')))
  ) {
    return { category: 'Crypto', imageUrl: u('1605792657660-596af9009e82') };
  }
  if (q.includes('coinbase')) {
    return { category: 'Crypto', imageUrl: u('1611974789855-9c2a0a7236a3') };
  }
  if (q.includes('eth etf') || (q.includes('etf') && q.includes('eth'))) {
    return { category: 'Crypto', imageUrl: u('1611974789855-9c2a0a7236a3') };
  }
  if (
    q.includes('bitcoin') ||
    q.includes(' btc ') ||
    q.startsWith('btc ') ||
    q.includes('btc?') ||
    q.includes('btc.')
  ) {
    return { category: 'Crypto', imageUrl: u('1518546305927-4b663fcb447b') };
  }
  if (
    q.includes('ethereum') ||
    q.includes(' eth ') ||
    q.includes('eth/') ||
    q.includes('/eth') ||
    q.includes('eth?')
  ) {
    return { category: 'Crypto', imageUrl: u('1639762681485-074b7f938ba0') };
  }
  if (q.includes('solana') || q.includes(' sol ')) {
    return { category: 'Crypto', imageUrl: u('1605792657660-596af9009e82') };
  }
  if (
    q.includes('crypto') ||
    q.includes('defi') ||
    q.includes('nft') ||
    q.includes('blockchain') ||
    q.includes('web3')
  ) {
    return { category: 'Crypto', imageUrl: u('1518546305927-4b663fcb447b') };
  }

  // ── Politics ───────────────────────────────────────────────────────────────
  if (q.includes('trump') || q.includes('impeach')) {
    return { category: 'Politics', imageUrl: u('1580128637405-2de359c2a3f1') };
  }
  if (q.includes('newsom') || (q.includes('democratic') && q.includes('nomination'))) {
    return { category: 'Politics', imageUrl: u('1555848962-543523c2f5a3') };
  }
  if (q.includes('iran') || q.includes('nuclear deal')) {
    return { category: 'Politics', imageUrl: u('1509391366360-2e47e03e369e') };
  }
  if (q.includes('government shutdown') || q.includes('federal shutdown')) {
    return { category: 'Politics', imageUrl: u('1569025690938-a00729c9e1f9') };
  }
  if (q.includes('macron') || (q.includes('france') && q.includes('resign'))) {
    return { category: 'Politics', imageUrl: u('1499856844487-8b2d0a8ec2e3') };
  }
  if (q.includes('uk') && (q.includes('eu') || q.includes('brexit') || q.includes('single market'))) {
    return { category: 'Politics', imageUrl: u('1486299267070-83823f5448d5') };
  }
  if (q.includes('elon') || (q.includes('musk') && q.includes('government'))) {
    return { category: 'Politics', imageUrl: u('1620712943543-bcc4688e7485') };
  }
  if (
    q.includes('election') ||
    q.includes('president') ||
    q.includes('congress') ||
    q.includes('senate') ||
    q.includes('politic')
  ) {
    return { category: 'Politics', imageUrl: u('1555848962-543523c2f5a3') };
  }

  // ── Sports ────────────────────────────────────────────────────────────────
  if (q.includes('real madrid') || q.includes('champions league') || q.includes('uefa')) {
    return { category: 'Sports', imageUrl: u('1579952363873-27d3bfad9c88') };
  }
  if (
    q.includes('fifa') ||
    q.includes('world cup') ||
    (q.includes('brazil') && q.includes('football'))
  ) {
    return { category: 'Sports', imageUrl: u('1508098682722-e99c643e7f0b') };
  }
  if (q.includes('djokovic') || q.includes('grand slam') || q.includes('tennis')) {
    return { category: 'Sports', imageUrl: u('1595435934249-5df7ed86e1c0') };
  }
  if (q.includes('knicks') || q.includes('nba') || q.includes('basketball')) {
    return { category: 'Sports', imageUrl: u('1546519638-68e109498ffc') };
  }
  if (
    (q.includes('jones') && q.includes('aspinall')) ||
    q.includes('ufc') ||
    q.includes('mma')
  ) {
    return { category: 'Sports', imageUrl: u('1549719032-f0c0f97c72b5') };
  }
  if (
    q.includes('formula 1') ||
    q.includes(' f1 ') ||
    q.includes(' f1?') ||
    (q.includes('world champion') && q.includes('2026'))
  ) {
    return { category: 'Sports', imageUrl: u('1541447271487-09612b3f49c7') };
  }
  if (
    q.includes('premier league') ||
    q.includes('manchester') ||
    q.includes('soccer') ||
    q.includes('football')
  ) {
    return { category: 'Sports', imageUrl: u('1579952363873-27d3bfad9c88') };
  }

  // ── Science / Tech ────────────────────────────────────────────────────────
  if (q.includes('openai') || q.includes('gpt')) {
    return { category: 'Science', imageUrl: u('1677442135703-1787eea5ce01') };
  }
  if (q.includes('agi') || q.includes('artificial general intelligence')) {
    return { category: 'Science', imageUrl: u('1485827404703-89b55fcc595e') };
  }
  if (q.includes('space station')) {
    return { category: 'Science', imageUrl: u('1446776709462-d6b525c57bd3') };
  }
  if (q.includes('apple') && (q.includes('chip') || q.includes('silicon') || q.includes('h100'))) {
    return { category: 'Science', imageUrl: u('1517336714731-489689fd1ca8') };
  }
  if (
    q.includes('spacex') ||
    q.includes('starship') ||
    q.includes('mars') ||
    q.includes('rocket') ||
    q.includes('nasa')
  ) {
    return { category: 'Science', imageUrl: u('1446776811523-87a49e82e79c') };
  }
  if (
    q.includes(' ai ') ||
    q.startsWith('ai ') ||
    q.includes(' ai?') ||
    q.includes('machine learning') ||
    q.includes('llm')
  ) {
    return { category: 'Science', imageUrl: u('1677442135703-1787eea5ce01') };
  }
  if (
    q.includes('nvidia') ||
    q.includes('chip') ||
    q.includes('tech ') ||
    q.includes('software') ||
    q.includes('foldable')
  ) {
    return { category: 'Science', imageUrl: u('1517336714731-489689fd1ca8') };
  }

  // ── Finance ───────────────────────────────────────────────────────────────
  if (
    q.includes('federal reserve') ||
    q.includes(' fed ') ||
    q.includes('fomc') ||
    q.includes('rate cut') ||
    q.includes('interest rate')
  ) {
    return { category: 'Finance', imageUrl: u('1526304640581-d338cdaa14e2') };
  }
  if (q.includes('inflation') || q.includes('cpi') || q.includes('consumer price')) {
    return { category: 'Finance', imageUrl: u('1580048915913-4a8a94b60fc1') };
  }
  if (
    (q.includes('gold') && q.includes('/oz')) ||
    q.includes('gold hit') ||
    (q.includes('gold') && q.includes('price')) ||
    q.includes('commodit')
  ) {
    return { category: 'Finance', imageUrl: u('1610375461246-83df859d849d') };
  }
  if (
    q.includes('s&p 500') ||
    q.includes('stock market') ||
    q.includes('nasdaq') ||
    q.includes('recession') ||
    q.includes('balance sheet')
  ) {
    return { category: 'Finance', imageUrl: u('1526304640581-d338cdaa14e2') };
  }

  // ── Other ─────────────────────────────────────────────────────────────────
  if (
    q.includes('gta') ||
    q.includes('grand theft') ||
    (q.includes('game') && q.includes('release'))
  ) {
    return { category: 'Other', imageUrl: u('1550745165-9bc0b252726f') };
  }
  if (
    q.includes('taylor swift') ||
    (q.includes('swift') && q.includes('tour')) ||
    (q.includes('concert') && q.includes('tour'))
  ) {
    return { category: 'Other', imageUrl: u('1493225457124-a3eb161ffa5f') };
  }

  // Generic fallback
  return {
    category: 'Other',
    imageUrl: u('1526304640581-d338cdaa14e2'),
  };
}
