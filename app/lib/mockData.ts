export const MOCK_USER = {
  name: "Pro Collector",
  progressPercent: 82,
  avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuB02KDQy9TYW_4fVXgdtvDZN7iB_um2l66eQKeFi-xRPWtyuSTqhyr3Obfz8WY4EPb5eqyey-9E5RuckFgMM3F8xW3f-ZjfMkUMSawpxim_FFF3HnbXEmyOEHQLqE_LbAtVMclfPXJ0rktoReZ8juKiUe8aj5jZ84bRTUs5vjG3lpUKJ-bg61Rn_c2A5YiM_ZVSop5gkbNps-R7cUgZ7RTVoTCIR-bSriUE0ZE2MsEqcRUgEmkmZaZk0cni4maxOlY3JxyGR7lmUCw"
};

export const MOCK_STATS = {
  completion: 65,
  stickersLeft: 214,
  collected: 432,
  duplicates: 12,
  collectionValue: "$1,240",
  valueChange: "+14% this week",
  rareAlert: {
    title: "Pulisic Holographic",
    desc: "A duplicate of this rarity was spotted in a trade near you (New York City)."
  }
};

export const RECENT_FINDS = [
  {
    id: 1,
    name: "C. PULISIC",
    rarity: "LEGENDARY",
    rarityColor: "secondary",
    isNew: true,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAl8G083-KvxwgIGmbbeo9iF1Qsq8QYGyw5d2sotmrPnNjMsHB8CQPz94-der9gGoEzAcQvxhRZBjGwZdnmH6FDbOhTP-zjdaelOpreiSNgGJNJQiu_59ER1lRMljPaKrz5YPzBGctjOGa_t8erfwJSoXvh-HIpbQrjACHI0LEUddYsqipGm0IlHDBCN-GoDsa3hvmqetWY6Gn7jx8Earkxs_6oJ6-9DRcAzKyups1AvAlNWIrUTpf3bHg0BfM4CyMOmgydmWHK6HM",
    grayscale: true
  },
  {
    id: 2,
    name: "S. GIMENEZ",
    rarity: "RARE",
    rarityColor: "tertiary",
    isNew: false,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBLtX0nVO8K5OKGTyjH0VKew8XFi-D0c1qypi2K5sWFS9ztdvLkXCEAvTnD0HdG5WtiyzPnT9vTQYWkhBnUO7quZmzbdQeA3poXWj-L3jMdKchVkGDbNr1ibCSdQ54ZOllA1v45tdmLSp_Kw_sdULb6ViCnTu1ZoKa6CidPENxGR0mIimp6TiL0jZ1DjbyQICrKVaPNhAob25JCbw9gseOVkI4sBNvhYknAKqFkbj8juj9_CUuImfqcxIecijWSOOooAS14wL59Gpg",
    grayscale: false
  },
  {
    id: 3,
    name: "A. DAVIES",
    rarity: "COMMON",
    rarityColor: "on-surface-variant",
    isNew: false,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAQtgWq4CEDEVDCSpNjGfL3uP1k4vW8kYjD1giQ1s_XAIxkAFjsutPrJTWQ5Hx7yCoosMg9XW5OQ_q1D2iY09IVkWDvx9VZsmIggclS-XcDAUNomFL_UMzPuaS9Ds4TZ69PVudEBTb4zvLKRcup8fbOlIDoW3FOxqEmk1meEc3zZSBXzkTGiMoM0lmKKafbtJ0av_trSvnPe9yTvDuax_V_kXgf8bjtf82C1iRG6hoBasgbVEdE_XbeWrgiOwLJLzQdYl6DZUEFU3U",
    grayscale: false
  }
];

export const HOST_CITIES = [
  {
    id: 1,
    name: "MetLife Stadium, NY/NJ",
    desc: "Official Trade Zone Opening in 2h 14m",
    color: "secondary",
    stats: "+120 Collectors Nearby",
    preview: "USA vs ARG Preview"
  },
  {
    id: 2,
    name: "Estadio Azteca, Mexico City",
    desc: "Legendary Player Drops Tonight",
    color: "tertiary",
    stats: "Limited Edition Release",
    preview: "MEX vs BRA Preview"
  }
];

export const MARKET_PULSE = [
  {
    id: 1,
    type: "HOT TRADE",
    color: "secondary",
    desc: '5,000+ traders seeking "Mbappé Holographic" right now.'
  },
  {
    id: 2,
    type: "SCARCITY ALERT",
    color: "tertiary",
    desc: '"Host Cities" specialty series availability dropped by 30%.'
  }
];
