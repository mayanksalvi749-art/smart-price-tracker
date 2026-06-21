/**
 * Product image helpers — always prefer stored URLs from the data source.
 * DB / API fields: image, primary_image, image_2, image_3
 *
 * getProductImageByName() resolves a correct, specific image from the
 * product name + category, replacing random category-pool images.
 */

export const IMAGE_NOT_AVAILABLE = "/image-not-available.svg";
export const DEFAULT_PLACEHOLDER = IMAGE_NOT_AVAILABLE;

// ─── Name-to-Image Mapping ────────────────────────────────────────────────────
// Each entry: [keywordRegex, imageUrl]
// Checked in order — first match wins.
const PRODUCT_IMAGE_MAP = [
  // ── Smartphones ──────────────────────────────────────────────────────────
  // iPhone 16 series
  [/iphone\s*16\s*pro\s*max/i,    "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600"],
  [/iphone\s*16\s*pro/i,          "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600"],
  [/iphone\s*16\s*plus/i,         "https://images.unsplash.com/photo-1567581935884-3349723552ca?w=600"],
  [/iphone\s*16/i,                "https://images.unsplash.com/photo-1567581935884-3349723552ca?w=600"],
  // iPhone 15 series
  [/iphone\s*15\s*pro\s*max/i,    "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600"],
  [/iphone\s*15\s*pro/i,          "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600"],
  [/iphone\s*15\s*plus/i,         "https://images.unsplash.com/photo-1567581935884-3349723552ca?w=600"],
  [/iphone\s*15/i,                "https://images.unsplash.com/photo-1567581935884-3349723552ca?w=600"],
  [/iphone\s*14/i,                "https://images.unsplash.com/photo-1663499482523-1c0c1bae4ce1?w=600"],
  [/iphone\s*se/i,                "https://images.unsplash.com/photo-1580910051074-3eb694886505?w=600"],
  [/iphone/i,                     "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600"],

  // Samsung Galaxy S25 series
  [/galaxy\s*s25\s*ultra/i,       "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600"],
  [/galaxy\s*s25\s*\+|galaxy\s*s25\s*plus/i, "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600"],
  [/galaxy\s*s25/i,               "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600"],
  // Samsung Galaxy S24 series
  [/galaxy\s*s24\s*ultra/i,       "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600"],
  [/galaxy\s*s24/i,               "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600"],
  [/galaxy\s*s23/i,               "https://images.unsplash.com/photo-1678911820864-e2c567c655d7?w=600"],
  [/galaxy\s*z\s*fold/i,          "https://images.unsplash.com/photo-1629131726692-1accd0c53ce0?w=600"],
  [/galaxy\s*z\s*flip/i,          "https://images.unsplash.com/photo-1629131726692-1accd0c53ce0?w=600"],
  [/galaxy\s*a55/i,               "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600"],
  [/galaxy\s*m/i,                 "https://images.unsplash.com/photo-1580910051074-3eb694886505?w=600"],
  [/galaxy\s*f/i,                 "https://images.unsplash.com/photo-1580910051074-3eb694886505?w=600"],
  [/galaxy\s*buds/i,              "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600"],
  [/samsung/i,                    "https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=600"],

  [/oneplus\s*12r/i,              "https://images.unsplash.com/photo-1616348436168-de43ad0db179?w=600"],
  [/oneplus\s*12/i,               "https://images.unsplash.com/photo-1616348436168-de43ad0db179?w=600"],
  [/oneplus\s*13/i,               "https://images.unsplash.com/photo-1616348436168-de43ad0db179?w=600"],
  [/oneplus\s*nord/i,             "https://images.unsplash.com/photo-1616348436168-de43ad0db179?w=600"],
  [/oneplus/i,                    "https://images.unsplash.com/photo-1573148195900-7845dcb9b127?w=600"],

  [/pixel\s*9\s*pro/i,            "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600"],
  [/pixel\s*8\s*pro/i,            "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600"],
  [/pixel\s*8/i,                  "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600"],
  [/pixel/i,                      "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600"],

  [/xiaomi\s*14/i,                "https://images.unsplash.com/photo-1580910051074-3eb694886505?w=600"],
  [/xiaomi/i,                     "https://images.unsplash.com/photo-1580910051074-3eb694886505?w=600"],
  [/redmi/i,                      "https://images.unsplash.com/photo-1580910051074-3eb694886505?w=600"],
  [/realme.*gt/i,                 "https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=600"],
  [/realme.*narzo/i,              "https://images.unsplash.com/photo-1580910051074-3eb694886505?w=600"],
  [/realme/i,                     "https://images.unsplash.com/photo-1580910051074-3eb694886505?w=600"],
  [/iqoo/i,                       "https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=600"],
  [/vivo\s*x/i,                   "https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=600"],
  [/vivo\s*v/i,                   "https://images.unsplash.com/photo-1580910051074-3eb694886505?w=600"],
  [/vivo/i,                       "https://images.unsplash.com/photo-1580910051074-3eb694886505?w=600"],
  [/oppo\s*find/i,                "https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=600"],
  [/oppo\s*reno/i,                "https://images.unsplash.com/photo-1580910051074-3eb694886505?w=600"],
  [/oppo/i,                       "https://images.unsplash.com/photo-1580910051074-3eb694886505?w=600"],
  [/motorola|moto\s*edge|razr/i,  "https://images.unsplash.com/photo-1574755393849-623942496936?w=600"],

  // ── Laptops ──────────────────────────────────────────────────────────────
  [/macbook\s*pro\s*16/i,         "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600"],
  [/macbook\s*pro\s*14/i,         "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600"],
  [/macbook\s*pro/i,              "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600"],
  [/macbook\s*air\s*m3/i,         "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600"],
  [/macbook\s*air/i,              "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600"],
  [/macbook/i,                    "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600"],

  [/dell\s*xps/i,                 "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=600"],
  [/dell\s*g15|dell\s*gaming/i,   "https://images.unsplash.com/photo-1593640495253-23196b27a87f?w=600"],
  [/dell\s*inspiron/i,            "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600"],
  [/dell\s*vostro/i,              "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600"],
  [/dell/i,                       "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=600"],

  [/hp\s*spectre/i,               "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=600"],
  [/hp\s*envy/i,                  "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=600"],
  [/hp\s*omen/i,                  "https://images.unsplash.com/photo-1593640495253-23196b27a87f?w=600"],
  [/hp\s*(pavilion|victus)/i,     "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600"],
  [/hp/i,                         "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=600"],

  [/lenovo\s*thinkpad/i,          "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=600"],
  [/lenovo\s*legion/i,            "https://images.unsplash.com/photo-1593640495253-23196b27a87f?w=600"],
  [/lenovo\s*(yoga|ideapad)/i,    "https://images.unsplash.com/photo-1484788984921-03950022c9ef?w=600"],
  [/lenovo/i,                     "https://images.unsplash.com/photo-1484788984921-03950022c9ef?w=600"],

  [/asus\s*rog|rog\s*zephyrus/i,  "https://images.unsplash.com/photo-1593640495253-23196b27a87f?w=600"],
  [/asus\s*zenbook/i,             "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=600"],
  [/asus\s*tuf/i,                 "https://images.unsplash.com/photo-1593640495253-23196b27a87f?w=600"],
  [/asus\s*vivobook/i,            "https://images.unsplash.com/photo-1484788984921-03950022c9ef?w=600"],
  [/acer\s*predator/i,            "https://images.unsplash.com/photo-1593640495253-23196b27a87f?w=600"],
  [/acer\s*nitro/i,               "https://images.unsplash.com/photo-1593640495253-23196b27a87f?w=600"],
  [/acer\s*swift/i,               "https://images.unsplash.com/photo-1484788984921-03950022c9ef?w=600"],
  [/acer/i,                       "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600"],
  [/msi\s*titan|msi\s*raider/i,   "https://images.unsplash.com/photo-1593640495253-23196b27a87f?w=600"],
  [/msi/i,                        "https://images.unsplash.com/photo-1593640495253-23196b27a87f?w=600"],
  [/mi\s*notebook|realme\s*book/i, "https://images.unsplash.com/photo-1484788984921-03950022c9ef?w=600"],

  // ── Headphones & Earbuds ─────────────────────────────────────────────────
  [/wh.1000xm5/i,                 "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=600"],
  [/wh.1000xm4/i,                 "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600"],
  [/wf.1000xm5/i,                 "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600"],
  [/wh.ch720/i,                   "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=600"],
  [/sony.*headphone|sony.*wh|sony.*wf|sony.*alpha\s*7/i, "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600"],

  [/bose.*quietcomfort|quietcomfort\s*ultra/i, "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600"],
  [/bose.*quietcomfort\s*45/i,    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600"],
  [/bose/i,                       "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600"],

  [/airpods\s*max/i,              "https://images.unsplash.com/photo-1610438235354-a6ae5528385c?w=600"],
  [/airpods\s*pro/i,              "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=600"],
  [/airpods/i,                    "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=600"],

  [/sennheiser|momentum/i,        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600"],
  [/jbl.*tune|jbl.*headphone/i,   "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600"],
  [/jbl.*charge|jbl.*speaker|jbl.*flip/i, "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600"],
  [/jbl/i,                        "https://images.unsplash.com/photo-1487215078519-e21cc028cb29?w=600"],
  [/boat.*rockerz/i,              "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600"],
  [/boat.*airdopes/i,             "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600"],
  [/boat.*stone/i,                "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600"],
  [/boat/i,                       "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600"],
  [/anker|space\s*q45|space\s*a40/i, "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600"],
  [/oneplus.*buds|oneplus.*nirvana/i, "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600"],
  [/nothing\s*ear/i,              "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600"],
  [/samsung.*buds/i,              "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600"],

  // ── Speakers ─────────────────────────────────────────────────────────────
  [/sony\s*srs/i,                 "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600"],
  [/jbl\s*charge/i,               "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600"],
  [/jbl\s*flip/i,                 "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600"],
  [/bluetooth.*speaker|portable.*speaker|speaker/i, "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600"],

  // ── Smart Watches ─────────────────────────────────────────────────────────
  [/apple.*watch|watch\s*series|watch\s*ultra|watch\s*se/i, "https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?w=600"],
  [/galaxy\s*watch/i,             "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=600"],
  [/garmin.*venu|garmin.*forerunner|garmin/i, "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600"],
  [/fitbit.*sense|fitbit.*versa|fitbit.*charge|fitbit/i, "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=600"],
  [/amazfit|gtr|t.rex/i,          "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600"],
  [/noise.*colorfit|noise/i,      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600"],
  [/boat.*wave|boat.*active/i,    "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=600"],
  [/oneplus.*watch/i,             "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=600"],
  [/boult.*drift|boult/i,         "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600"],
  [/fastrack.*reflex|fastrack/i,  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600"],
  [/fossil.*gen|fossil/i,         "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=600"],
  [/titan.*octane|titan/i,        "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=600"],
  [/casio.*g.shock|casio/i,       "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=600"],
  [/seiko/i,                      "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=600"],
  [/orient/i,                     "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=600"],

  // ── Cameras ──────────────────────────────────────────────────────────────
  [/sony.*alpha\s*7r|sony.*a7r/i, "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600"],
  [/sony.*alpha\s*7.*iv|sony.*a7.*iv/i,  "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600"],
  [/sony.*alpha|sony.*zv|sony.*a6/i,     "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=600"],
  [/canon.*eos\s*r50/i,           "https://images.unsplash.com/photo-1495707902641-75cac588d2e9?w=600"],
  [/canon.*eos\s*r/i,             "https://images.unsplash.com/photo-1495707902641-75cac588d2e9?w=600"],
  [/canon/i,                      "https://images.unsplash.com/photo-1495707902641-75cac588d2e9?w=600"],
  [/nikon/i,                      "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600"],
  [/fujifilm|fuji/i,              "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600"],
  [/gopro|hero\s*\d/i,            "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=600"],
  [/insta360|dji.*pocket/i,       "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=600"],
  [/panasonic.*lumix|lumix/i,     "https://images.unsplash.com/photo-1495707902641-75cac588d2e9?w=600"],

  // ── Tablets ──────────────────────────────────────────────────────────────
  [/ipad\s*pro/i,                 "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600"],
  [/ipad\s*air/i,                 "https://images.unsplash.com/photo-1561154464-82e9adf32764?w=600"],
  [/ipad\s*mini/i,                "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600"],
  [/ipad/i,                       "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600"],
  [/galaxy\s*tab\s*s10|galaxy\s*tab\s*s9\s*ultra/i, "https://images.unsplash.com/photo-1527698266440-12104e498b76?w=600"],
  [/galaxy\s*tab\s*s9/i,          "https://images.unsplash.com/photo-1527698266440-12104e498b76?w=600"],
  [/galaxy\s*tab/i,               "https://images.unsplash.com/photo-1561154464-82e9adf32764?w=600"],
  [/oneplus.*pad|redmi.*pad|xiaomi.*pad/i, "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600"],
  [/lenovo.*tab|tab\s*p\d+/i,     "https://images.unsplash.com/photo-1527698266440-12104e498b76?w=600"],

  // ── Gaming Accessories & Consoles ─────────────────────────────────────────
  [/playstation\s*5|ps5/i,        "https://images.unsplash.com/photo-1607853202273-797f1c22a38e?w=600"],
  [/xbox\s*series/i,              "https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=600"],
  [/dualsense|playstation.*controller/i, "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=600"],
  [/xbox.*elite|xbox.*controller/i,      "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=600"],
  [/steam\s*deck|rog\s*ally/i,           "https://images.unsplash.com/photo-1600861195091-690c92f1d2cc?w=600"],
  [/logitech.*mx\s*keys|logitech.*keyboard/i, "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600"],
  [/razer.*blackwidow|razer.*keyboard/i,  "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600"],
  [/logitech.*g502|logitech.*g\s*pro/i, "https://images.unsplash.com/photo-1625600243103-1dc6824c6c8a?w=600"],
  [/razer.*deathadder|razer.*viper/i,    "https://images.unsplash.com/photo-1625600243103-1dc6824c6c8a?w=600"],
  [/logitech/i,                   "https://images.unsplash.com/photo-1625600243103-1dc6824c6c8a?w=600"],
  [/razer/i,                      "https://images.unsplash.com/photo-1625600243103-1dc6824c6c8a?w=600"],
  [/steelseries.*apex|steelseries/i,              "https://images.unsplash.com/photo-1600861195091-690c92f1d2cc?w=600"],
  [/hyperx.*cloud|hyperx/i,       "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=600"],
  [/corsair/i,                    "https://images.unsplash.com/photo-1600861195091-690c92f1d2cc?w=600"],

  // ── Monitors & TVs ────────────────────────────────────────────────────────
  [/lg.*oled|oled.*monitor|ultrasharp.*oled/i, "https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=600"],
  [/lg.*ultragear|gaming.*monitor/i, "https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=600"],
  [/samsung.*tv|crystal.*4k|qled/i, "https://images.unsplash.com/photo-1593359677879-a4bb92f4834a?w=600"],
  [/lg.*tv|oled.*tv/i,            "https://images.unsplash.com/photo-1593359677879-a4bb92f4834a?w=600"],
  [/monitor/i,                    "https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=600"],
  [/television|\bTV\b/i,          "https://images.unsplash.com/photo-1593359677879-a4bb92f4834a?w=600"],

  // ── Home Appliances ───────────────────────────────────────────────────────
  [/dyson\s*v15|dyson.*detect/i,  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600"],
  [/dyson/i,                      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600"],
  [/roborock|robot.*vacuum/i,     "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600"],
  [/air\s*fryer/i,                "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=600"],
  [/washing\s*machine|washer/i,   "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=600"],
  [/front\s*load.*washing|fully.*automatic/i, "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=600"],
  [/refrigerator|fridge|french.*door/i, "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600"],
  [/microwave|convection.*oven/i, "https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=600"],
  [/air\s*purifier/i,             "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600"],
  [/steam\s*iron|garment\s*steamer/i, "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=600"],
  [/water\s*heater|geyser|immersion/i, "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600"],
  [/split\s*ac|window\s*ac|inverter.*ac|air.*conditioner/i, "https://images.unsplash.com/photo-1631193816258-28b44b21e78f?w=600"],
  [/daikin|lg.*ac|carrier\s*ac/i, "https://images.unsplash.com/photo-1631193816258-28b44b21e78f?w=600"],
  [/food\s*processor|mixer|grinder/i, "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600"],
  [/philips.*hr|philips.*processor/i, "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600"],

  // ── Fashion – Men ─────────────────────────────────────────────────────────
  [/men.*t.shirt|t.shirt.*men|dri.fit.*t.shirt/i, "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600"],
  [/men.*polo\s*shirt|polo.*shirt.*men/i, "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600"],
  [/men.*formal\s*shirt|slim\s*fit\s*shirt|formal.*shirt.*men/i, "https://images.unsplash.com/photo-1602810316498-ab67cf68c8e1?w=600"],
  [/men.*casual\s*shirt|men.*striped\s*shirt|graphic.*shirt/i, "https://images.unsplash.com/photo-1602810316498-ab67cf68c8e1?w=600"],
  [/men.*jeans|slim\s*fit.*jeans|regular\s*fit.*jeans/i, "https://images.unsplash.com/photo-1542272604-787c3835535d?w=600"],
  [/men.*chino|chino.*trousers/i, "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600"],
  [/hoodie|sweatshirt/i,          "https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=600"],
  [/bomber\s*jacket|puffer\s*jacket|quilted.*jacket/i, "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600"],
  [/men.*jacket|winter.*jacket/i, "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600"],
  [/kurta\s*set|men.*kurta/i,     "https://images.unsplash.com/photo-1589810635657-232948472d98?w=600"],
  [/men.*cotton.*trunk|men.*underwear|men.*innerwear/i, "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600"],
  [/blazer|suit.*charcoal|formal.*suit/i, "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600"],
  [/men.*training.*t.shirt|training.*shirt/i, "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600"],

  // ── Fashion – Women ───────────────────────────────────────────────────────
  [/women.*kurta\s*set|women.*kurta|kurta.*women/i, "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600"],
  [/saree|kanchipuram|banarasi/i, "https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=600"],
  [/salwar\s*suit|anarkali/i,     "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600"],
  [/women.*wrap\s*dress|women.*maxi\s*dress|women.*mini\s*dress/i, "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600"],
  [/women.*off.shoulder|women.*camisole|women.*top/i, "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=600"],
  [/women.*jeans|women.*slim\s*fit/i, "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600"],
  [/palazzo\s*pants|women.*palazzo/i, "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600"],
  [/women.*bra|women.*nightwear|women.*lingerie/i, "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=600"],
  [/women.*tights|women.*hoodie/i, "https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=600"],

  // ── Shoes & Footwear ──────────────────────────────────────────────────────
  [/nike\s*air\s*max/i,           "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600"],
  [/adidas\s*ultraboost/i,        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600"],
  [/puma\s*cell|puma.*sneaker/i,  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600"],
  [/new\s*balance/i,              "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600"],
  [/skechers/i,                   "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600"],
  [/asics\s*gel|asics/i,          "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600"],
  [/under\s*armour|hovr/i,        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600"],
  [/nike\s*revolution|nike.*kids/i, "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600"],
  [/nike/i,                       "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600"],
  [/adidas/i,                     "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600"],
  [/woodland.*formal|derby.*shoe|formal.*shoe|loafer/i, "https://images.unsplash.com/photo-1449505278894-297fdb3edbc1?w=600"],
  [/red\s*tape|hush\s*puppies|metro.*women/i, "https://images.unsplash.com/photo-1449505278894-297fdb3edbc1?w=600"],
  [/havaianas|flip\s*flop|sandal/i, "https://images.unsplash.com/photo-1603487742131-4160ec999306?w=600"],
  [/birkenstock/i,                "https://images.unsplash.com/photo-1603487742131-4160ec999306?w=600"],
  [/inc\.5.*heel|block.*heel/i,   "https://images.unsplash.com/photo-1603487742131-4160ec999306?w=600"],
  [/platform.*sneaker|metro.*platform/i, "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600"],

  // ── Beauty & Skincare ─────────────────────────────────────────────────────
  [/mac.*lipstick|retro.*matte.*lipstick/i, "https://images.unsplash.com/photo-1586495777744-4e6232bf2b3b?w=600"],
  [/lakme.*foundation|maybelline.*foundation|loreal.*foundation/i, "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600"],
  [/hyaluronic.*serum|vitamin\s*c.*serum|niacinamide.*serum|face.*serum/i, "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600"],
  [/face\s*wash|foaming.*wash|biotique/i, "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600"],
  [/moisturizer|moisturising.*cream|nivea.*soft|plum.*green/i, "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600"],
  [/hair\s*oil|onion.*hair|mamaearth/i, "https://images.unsplash.com/photo-1559181567-c3190958d3ab?w=600"],
  [/shampoo|dove.*intense|hair.*repair/i, "https://images.unsplash.com/photo-1559181567-c3190958d3ab?w=600"],
  [/fragrance.*mist|bath.*body\s*works|perfume/i, "https://images.unsplash.com/photo-1541643600914-78b084683702?w=600"],
  [/radiance.*cream|forest\s*essentials|luxury.*cream/i, "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600"],
  [/minimalist.*vitamin|minimalist/i, "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600"],
  [/setting\s*spray|makeup.*fixer|swiss\s*beauty/i, "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600"],
  [/hair\s*dryer|philips.*bhh|philips.*hair/i, "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600"],
  [/foundation|concealer|blush|eyeshadow|mascara|lipstick/i, "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600"],
  [/serum|face\s*cream|skin.*care/i, "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600"],
  [/shampoo|conditioner|hair/i,   "https://images.unsplash.com/photo-1559181567-c3190958d3ab?w=600"],
];

// ─── Category fallback images (used when no name match found) ─────────────────
const CATEGORY_FALLBACK_IMAGES = {
  "Smartphones":        "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600",
  "Laptops":            "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600",
  "Headphones":         "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600",
  "Smart Watches":      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600",
  "Cameras":            "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600",
  "Tablets":            "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600",
  "Gaming Accessories": "https://images.unsplash.com/photo-1600861195091-690c92f1d2cc?w=600",
  "Home Appliances":    "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600",
  "Fashion":            "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600",
  "Beauty":             "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600",
  "Electronics":        "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=600",
  "Mobiles":            "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600",
};

/**
 * Given a product name (and optionally a category), returns the most
 * accurate image URL by matching against known product keywords.
 * Falls back to a category-specific image, then a generic placeholder.
 */
export function getProductImageByName(productName, category) {
  const name = (productName || "").trim();
  if (name) {
    for (const [pattern, url] of PRODUCT_IMAGE_MAP) {
      if (pattern.test(name)) {
        return url;
      }
    }
  }
  // Category fallback
  if (category && CATEGORY_FALLBACK_IMAGES[category]) {
    return CATEGORY_FALLBACK_IMAGES[category];
  }
  return IMAGE_NOT_AVAILABLE;
}

// ─── View labels & category aliases (unchanged) ───────────────────────────────
const VIEW_LABELS = {
  mobile: ["Front View", "Back View", "Side View"],
  laptop: ["Front View", "Open View", "Keyboard View"],
  electronics: ["Front View", "Side View", "Detail View"],
  fashion: ["Front View", "Back View", "Folded View"],
  beauty: ["Product View", "Packaging View", "Detail View"],
  default: ["Front View", "Side View", "Detail View"],
};

const CATEGORY_ALIASES = {
  Laptops: "Electronics",
  Tablets: "Electronics",
  "Smart Watches": "Electronics",
  Earbuds: "Electronics",
  Headphones: "Electronics",
  Cameras: "Electronics",
  TVs: "Electronics",
  Monitors: "Electronics",
  Keyboards: "Electronics",
  Mouse: "Electronics",
  "Men's Fashion": "Fashion",
  "Women's Fashion": "Fashion",
  Shoes: "Fashion",
  Watches: "Electronics",
  "Home Appliances": "Electronics",
  "Kitchen Appliances": "Electronics",
  Books: "Electronics",
  Fitness: "Electronics",
  electronics: "Electronics",
  jewelery: "Beauty",
  "men's clothing": "Fashion",
  "women's clothing": "Fashion",
};

function isValidImageUrl(url) {
  if (!url || typeof url !== "string") return false;
  const t = url.trim();
  // Also reject broken share links that aren't real image URLs
  if (t.includes("share.google") || t.includes("share.amazon")) return false;
  return t.startsWith("http://") || t.startsWith("https://") || t.startsWith("/");
}

function pickPrimary(product) {
  return (
    product.primary_image ||
    product.image ||
    product.image_url ||
    ""
  ).trim();
}

function viewLabelsFor(product) {
  const cat = (product.category || "").toLowerCase();
  if (cat === "mobiles") return VIEW_LABELS.mobile;
  if (cat === "electronics" || cat === "laptops") return VIEW_LABELS.electronics;
  if (cat === "fashion") return VIEW_LABELS.fashion;
  if (cat === "beauty") return VIEW_LABELS.beauty;
  return VIEW_LABELS.default;
}

export function normalizeCategory(cat) {
  if (!cat) return "Electronics";
  if (["Mobiles", "Electronics", "Fashion", "Beauty"].includes(cat)) return cat;
  return CATEGORY_ALIASES[cat] || cat;
}

/** Build gallery from stored product image fields.
 *  If the stored image is missing/invalid, resolves via name matching. */
export function resolveProductGallery(product) {
  const labels = viewLabelsFor(product);
  let primary = pickPrimary(product);

  // If stored image is invalid/missing, derive from name
  if (!isValidImageUrl(primary)) {
    primary = getProductImageByName(product.name || product.product_name, product.category);
  }

  const hasPrimary = isValidImageUrl(primary);
  const img1 = hasPrimary ? primary : IMAGE_NOT_AVAILABLE;
  const img2 = isValidImageUrl(product.image_2) ? product.image_2 : img1;
  const img3 = isValidImageUrl(product.image_3) ? product.image_3 : img1;

  const gallery = [
    { url: img1, label: labels[0], field: "primary_image" },
    { url: img2, label: labels[1], field: "image_2" },
    { url: img3, label: labels[2], field: "image_3" },
  ];

  return {
    primary_image: img1,
    image_2: img2,
    image_3: img3,
    image: img1,
    gallery,
    product_type: product.product_type || "default",
    image_labels: labels,
    fallbackImg: IMAGE_NOT_AVAILABLE,
  };
}

export function resolveProductImage(product) {
  let primary = pickPrimary(product);
  if (!isValidImageUrl(primary)) {
    primary = getProductImageByName(product.name || product.product_name, product.category);
  }
  const url = isValidImageUrl(primary) ? primary : IMAGE_NOT_AVAILABLE;
  const g = resolveProductGallery(product);
  return {
    url,
    field: "image",
    fallback: IMAGE_NOT_AVAILABLE,
    gallery: g.gallery,
    product_type: g.product_type,
  };
}

export function categoryFallbackImage(category) {
  return CATEGORY_FALLBACK_IMAGES[category] || IMAGE_NOT_AVAILABLE;
}