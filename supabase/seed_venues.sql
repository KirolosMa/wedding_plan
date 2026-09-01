-- Optional one-time seed: run in the Supabase SQL editor (after schema.sql) to bulk-load
-- venue options gathered from the "Wedding Venues" WhatsApp group export (chat + PDFs).
-- Prices/capacities are the vendors' own quoted minimums as of the shared documents; review
-- and adjust ratings/status on venues.html as you visit/decide.
insert into public.venues (name, location, price, capacity, notes, status) values
  (
    'Royal Maxim Palace Kempinski',
    null,
    875000,
    400,
    'Excelsior Ballroom min. revenue: EGP 700k weekday / 875k weekend (1 partition, up to 400 guests; 2 partitions up to 800; 3 partitions up to 1200). La Terrace min. revenue: EGP 350k weekday / 472.5k weekend. Buffet menus EGP 3,500-4,800/person; set menus EGP 3,800-4,600/person. Includes 2 nights suite + breakfast, groom day-use room, 5-layer cake, special couple''s dinner, up to 10% guests comp. Prices valid until 31 Mar 2026. EGP 80,000 deposit on signing + EGP 60,000 refundable insurance deposit.',
    'considering'
  ),
  (
    'Jayda (Open Air)',
    null,
    3300,
    null,
    'Per-person pricing (not a lump sum): Wedding Menu 1 EGP 3,300 / Menu 2 EGP 3,600 / Menu 3 EGP 4,000, all-inclusive of taxes. Includes 10% comp guests, welcome fruit cocktail, 5-layer cake, 2 nights Prestige suite for the couple, groom day-use room, complimentary parking.',
    'considering'
  ),
  (
    'Marriott Mena House (El Khalifa Ballroom)',
    'Pyramids of Giza, Cairo, Egypt',
    1315000,
    220,
    'El Khalifa weekday package EGP 1,315,000 for 200-220 guests; larger tier EGP 1,600,000 for 250-275 guests. Includes 2 nights Grand Deluxe room, groom day-use, couple''s massage for two, Zaffa/DJ/video/photographer, kosha + 22 centerpieces, plexi dance floor. Historic Pyramids-view property.',
    'considering'
  ),
  (
    'JW Marriott Cairo - The Terrace',
    'Ring Road, Mirage City, Heliopolis, Cairo, Egypt',
    325000,
    90,
    'Weekday (Sun-Thu): EGP 325,000/90 guests or EGP 430,000/135 guests. Weekend: EGP 575,000/180 guests. EGP 2,500 per extra guest. Includes DJ till 10PM, lighting package, zaffa, video, photographer, kosha, 1 night Junior Suite + groom day-use. Valid until end Sept 2026. Contact: +2 (02) 24115588.',
    'considering'
  ),
  (
    'JW Marriott Cairo - The Beach',
    'Ring Road, Mirage City, Heliopolis, Cairo, Egypt',
    650000,
    180,
    'Sun-Wed: EGP 650,000/180 guests. Thu & Sat (Fri excluded): EGP 800,000/225 guests. EGP 2,900 per extra guest. Same inclusions as The Terrace package (DJ, lighting, zaffa, video, photographer, kosha, 1 night Junior Suite + groom day-use). Valid until end Sept 2026. Contact: +2 (02) 24115588.',
    'considering'
  ),
  (
    'The Westin Cairo (Grand Ballroom)',
    null,
    1062500,
    250,
    'Grand Ballroom weekend minimum EGP 1,062,500 for 250 guests. Buffet menu tiers: EGP 4,250 / 5,250 / 5,750 per person (menus vary by station selection). Includes 2 nights suite + breakfast, groom day-use, 5-layer cake, 10% comp guests, Sabaheya breakfast for the couple.',
    'considering'
  ),
  (
    'Nile Ballroom',
    null,
    220000,
    90,
    'Base EGP 195,000 for min. 90 guests + EGP 25,000 required add-on for entertainment & decoration (~EGP 220,000 total). Extra guest EGP 2,200 all-inclusive. Includes 2 nights Prestige suite, groom day-use, DJ/Domiaty Zaffa/videographer, kosha + centerpieces, complimentary parking. Hotel/parent property not stated in the shared document.',
    'considering'
  ),
  (
    'Baron Palace',
    null,
    460000,
    null,
    'Venue rental only (empty space) - no catering or decoration included. Tourism police fees apply separately on top of this price.',
    'considering'
  ),
  (
    'Cairo Citadel - Dar El Darb',
    'Citadel of Cairo, Cairo, Egypt',
    141000,
    300,
    'Full wedding & event package (6 hrs): weekday EGP 121,000 / weekend EGP 141,000, deposit EGP 30,000, capacity 300. Also available: katb-kitab only, 3 hrs (weekday EGP 50,500 / weekend EGP 57,500, deposit EGP 12,500) and mini-wedding, 4 hrs (weekday EGP 86,000 / weekend EGP 99,750, deposit EGP 21,250). +EGP 11,400 per extra 50 guests (full wedding) or +EGP 5,700 (other tiers). Tourism police fees paid separately at the Citadel (contact 7-10 days ahead). No alcohol allowed; setup only on event day for the smaller tiers.',
    'considering'
  ),
  (
    'Cairo Citadel - Bir Yousef',
    'Citadel of Cairo, Cairo, Egypt',
    210500,
    500,
    'Full wedding package: weekday EGP 180,500 / weekend EGP 210,500, deposit EGP 42,500, capacity 500 (rental includes 150kW generator). Katb-kitab only: weekday EGP 65,000 / weekend EGP 73,250, deposit EGP 13,750. Mini-wedding: weekday EGP 115,500 / weekend EGP 134,250, deposit EGP 26,250. Same extra-guest surcharge and tourism police fee terms as other Citadel halls.',
    'considering'
  ),
  (
    'Cairo Citadel - Police Museum Square',
    'Citadel of Cairo, Cairo, Egypt',
    291000,
    700,
    'Full wedding package only: weekday EGP 271,000 / weekend EGP 291,000, deposit EGP 67,500, capacity 700. Same extra-guest surcharge and tourism police fee terms as other Citadel halls.',
    'considering'
  ),
  (
    'Cairo Citadel - El Mahkma',
    'Citadel of Cairo, Cairo, Egypt',
    371000,
    900,
    'Full wedding package only, same weekday & weekend price: EGP 371,000, deposit EGP 92,500, capacity 900 - the largest Citadel option. Same extra-guest surcharge and tourism police fee terms as other Citadel halls.',
    'considering'
  ),
  (
    'Cairo Citadel - Mohamed Ali Pasha Square',
    'Citadel of Cairo, Cairo, Egypt',
    77000,
    300,
    'Katb-kitab (ceremony only, no dancing/zaffa) available here: weekday EGP 68,000 / weekend EGP 77,000, deposit EGP 15,000, capacity 300 (rental includes 60kW generator). Not listed for the mini-wedding or full-wedding tiers in the shared price list.',
    'considering'
  ),
  (
    'Sofitel Cairo Nile El Gezirah (Sofitel Gezira)',
    '3 El Thawra Council St, Zamalek, Giza 11518, Cairo, Egypt',
    3100,
    130,
    'Per-person pricing, min. 130 guests weekday / 150 weekend (below that, Le Vendome ballroom used instead): Pearl EGP 3,100/guest (2 nights Panoramic room), Gold EGP 3,500/guest (2 nights Panoramic Prestige suite), Diamond EGP 3,950/guest (2 nights Opera suite). Renovated ballroom with indoor space + Nile-view outdoor terrace. Decor/entertainment NOT included. Add-on stations available (shawarma/pasta/sushi EGP 175-580/guest, whole-animal cooking EGP 2,300-3,500 each, corkage EGP 1,500/bottle). Contact: +202 2737 3737.',
    'considering'
  );
