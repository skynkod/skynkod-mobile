// What each skin issue is, why it happens and how long it lasts (Lita,
// 2026-10-24): every sheet explains the problem, not only what it looks like.
// Same sources as the sheets (DermNet, NHS). Guidance, never a diagnosis.
//   what: what is happening in the skin, in plain words
//   why: causes and what makes it worse
//   course: does it go away on its own, and how long it lasts
export const CONDITION_EXPLAIN = {
  'comedonal-acne': {
    what: 'Pores get blocked by oil and dead skin cells. When the blocked pore stays open, the plug darkens in contact with air: a blackhead. When it stays closed under the skin, it forms a small white bump: a whitehead. It isn’t dirt.',
    why: ['Skin that makes a lot of oil', 'Dead cells that don’t shed properly and clog the pore', 'Hormones, especially in the teenage years and around periods', 'Heavy, pore-clogging creams or makeup', 'Squeezing, which pushes the plug deeper'],
    course: 'It often comes and goes for years, especially in the teens and twenties. With the right routine, most people see clearer skin in 8 to 12 weeks.',
  },
  'inflammatory-acne': {
    what: 'A blocked pore becomes inflamed: bacteria that normally live on the skin multiply inside it and the body reacts. That gives red, tender bumps (papules) and spots with a white or yellow top (pustules).',
    why: ['Blocked pores and extra oil', 'Skin bacteria (C. acnes) multiplying in the pore', 'Hormones', 'Stress and lack of sleep can make it worse', 'Picking and squeezing, which spread the inflammation'],
    course: 'Each spot lasts a few days to two weeks. Acne itself can last months or years, but it is very treatable: give a treatment 8 to 12 weeks before judging it.',
  },
  'cystic-acne': {
    what: 'The most severe form of acne. The inflammation happens deep in the skin and forms large, painful, swollen lumps (nodules and cysts) that can last for weeks and often leave scars.',
    why: ['A strong inflammatory reaction deep in the pore', 'Hormones', 'Family history: it often runs in families', 'Squeezing, which can push the infection deeper'],
    course: 'It rarely clears with skincare alone and can leave lasting scars. See a dermatologist early: prescription treatments work and prevent scarring.',
  },
  'hormonal-acne': {
    what: 'Acne linked to hormones (androgens) that make the oil glands work harder. It typically appears on the jaw, chin and lower cheeks, and often flares before periods. It is common in adult women.',
    why: ['Monthly hormone changes, often a flare before periods', 'Stopping or changing the pill', 'Polycystic ovary syndrome (PCOS)', 'Stress, which raises hormones that boost oil', 'Pregnancy and the years before menopause'],
    course: 'It can last for years and follows your cycle. Skincare helps, but hormonal treatments from a doctor are often what calms it for good.',
  },
  'fungal-acne': {
    what: 'Not real acne: it is an overgrowth of a yeast (Malassezia) that normally lives on the skin, inside the hair follicles. It gives many small, itchy bumps that all look the same, often on the forehead.',
    why: ['Heat, humidity and sweat', 'Rich, oily creams that feed the yeast', 'Antibiotics, which upset the skin’s balance', 'Tight clothes or headbands that trap sweat'],
    course: 'It doesn’t go away on its own and acne treatments don’t work on it. With antifungal care it usually clears in a few weeks, but it can come back.',
  },
  'oily-skin': {
    what: 'Your oil glands make more sebum than your skin needs. The skin looks shiny, pores look bigger, and spots appear more easily. It is a skin type, not a disease, and it also protects the skin.',
    why: ['Genetics: it runs in families', 'Hormones, especially in the teens and around periods', 'Heat and humidity', 'Harsh cleansers that strip the skin, which can make it produce more'],
    course: 'It often lessens with age. You can control the shine every day, but you can’t change your skin type for good.',
  },
  'enlarged-pores': {
    what: 'Pores are the openings of the oil glands. They look bigger when the skin is oily, when they are filled with sebum, or when the skin around them loses firmness with age.',
    why: ['Oily skin and genetics', 'Pores filled with oil and dead cells', 'Loss of firmness with age', 'Sun damage, which weakens the skin around the pore'],
    course: 'Pores don’t open and close and don’t disappear. Keeping them clean and the skin firm can make them look smaller.',
  },
  'sebaceous-filaments': {
    what: 'Small grey or beige dots, mostly on the nose. They are a normal lining of oil inside every pore, not blackheads. Everyone has them; they are just more visible on oily skin.',
    why: ['Normal oil production', 'Oily skin and bigger pores make them more visible'],
    course: 'They refill within days after you remove them: that is normal. Regular care makes them less visible but they never disappear completely.',
  },
  'milia': {
    what: 'Tiny, hard, white bumps just under the surface, often around the eyes. They are small cysts filled with keratin (a skin protein) trapped under the skin. They aren’t spots and contain no pus.',
    why: ['Dead skin that gets trapped instead of shedding', 'Heavy, rich creams around the eyes', 'Sun damage', 'After a burn, a blister or a strong treatment'],
    course: 'In babies they go away on their own. In adults they can stay for months or years. Don’t squeeze them: a professional removes them safely in seconds.',
  },
  'sebaceous-hyperplasia': {
    what: 'Oil glands that have grown bigger. They form small, soft, yellowish bumps with a tiny dip in the middle, mostly on the forehead and cheeks. They are harmless.',
    why: ['Age: oil glands enlarge after 40', 'Genetics', 'Sun damage', 'Some medicines, such as ciclosporin'],
    course: 'They don’t go away on their own. They are harmless, but a dermatologist should check any new bump, because some skin cancers can look similar.',
  },
  rosacea: {
    what: 'A common, long-term skin condition: the small blood vessels of the face react too much and widen easily, causing redness and flushing. It isn’t contagious and isn’t caused by poor hygiene. It comes in flare-ups.',
    why: ['Reactive skin and blood vessels, often in the family', 'Sun, heat, cold and wind', 'Alcohol, spicy food and hot drinks', 'Stress and strong emotions', 'Harsh or perfumed products', 'Tiny mites (Demodex) that live on the skin may play a part'],
    course: 'It doesn’t go away for good, but it can be controlled very well. Flare-ups come and go; knowing your triggers helps a lot.',
  },
  'visible-vessels': {
    what: 'Tiny blood vessels near the surface that have stayed widened. They show as thin red lines on the cheeks or around the nose. They are harmless.',
    why: ['Rosacea', 'Sun damage over the years', 'Genetics and thin skin', 'Big temperature changes, alcohol', 'Long use of strong cortisone creams'],
    course: 'Once they are there, they don’t go away on their own and creams can’t remove them. Laser or IPL closes them.',
  },
  'sensitive-skin': {
    what: 'Skin that reacts easily: stinging, burning, tightness or redness with products or the weather. The skin barrier (the protective outer layer) is often weakened, so irritants get in more easily.',
    why: ['A weakened skin barrier', 'Too many products or too many actives', 'Fragrance and alcohol in products', 'Cold, wind, sun and pollution', 'Sometimes a condition behind it: rosacea, eczema or an allergy'],
    course: 'It often improves a lot within a few weeks when you simplify your routine and repair the barrier. Some skins stay a bit sensitive for life.',
  },
  'perioral-dermatitis': {
    what: 'A rash of small red bumps around the mouth and nose, often with a clear line of normal skin right next to the lips. It can sting or burn. It looks like acne but is a different condition.',
    why: ['Cortisone creams on the face, even mild ones', 'Heavy, rich creams and makeup', 'Fluoride toothpaste in some people', 'Hormones', 'Too many products'],
    course: 'It can last for months if the trigger continues. Stopping the trigger and treatment from a doctor usually clear it in 4 to 8 weeks.',
  },
  'seborrheic-dermatitis': {
    what: 'Red, flaky, sometimes greasy patches in oily areas: the sides of the nose, the eyebrows, the hairline and the scalp (dandruff is the mild form). It is linked to a yeast that lives on the skin and an over-reaction to it. It isn’t contagious.',
    why: ['A yeast (Malassezia) on the skin', 'Oily skin', 'Stress and tiredness', 'Cold, dry weather', 'Some conditions, such as Parkinson’s disease, make it more likely'],
    course: 'It comes and goes, often for years, with flare-ups in winter and under stress. It can be controlled well, but it usually comes back.',
  },
  eczema: {
    what: 'A skin barrier that doesn’t hold water well and an immune system that over-reacts. The skin becomes dry, red, itchy and sometimes cracked. On the face it often affects the eyelids and around the mouth. It isn’t contagious.',
    why: ['Genetics, often with asthma or hay fever in the family', 'A weak skin barrier', 'Soap, fragrance and harsh products', 'Cold, dry air and heating', 'Stress, sweat and some allergens'],
    course: 'It often lasts for years with flare-ups and calm periods. Many children grow out of it. With a good routine and treatment, it can be controlled well.',
  },
  'facial-psoriasis': {
    what: 'An immune condition where skin cells grow much too fast and pile up. That gives thick, red patches covered in silvery scales. On the face it often shows at the hairline, eyebrows and around the ears. It isn’t contagious.',
    why: ['The immune system, often in the family', 'Stress', 'Infections such as a sore throat', 'Injuries to the skin', 'Alcohol, smoking and some medicines'],
    course: 'It is long-term and comes in flare-ups. There is no cure yet, but treatments today control it very well.',
  },
  'contact-dermatitis': {
    what: 'The skin reacts to something it touched. Irritation happens when a product is too strong for your skin. An allergy happens when your immune system reacts to one ingredient, even in small amounts. Both cause redness, itching or burning.',
    why: ['Too strong or too many actives (acids, retinol)', 'Fragrance and preservatives', 'Hair dye, nail products', 'Nickel in jewellery', 'A new product added to your routine'],
    course: 'It calms in a few days to a few weeks once you stop the cause. An allergy stays for life: you will need to avoid that ingredient.',
  },
  'post-acne-redness': {
    what: 'Red or pink flat marks left after a spot has healed. The small blood vessels that widened during the inflammation stay visible for a while. It isn’t a scar: the skin surface is smooth.',
    why: ['Inflammation from spots', 'Picking and squeezing', 'Sun, which makes them last longer', 'Fair to medium skin shows them more'],
    course: 'They fade on their own, usually within 3 to 6 months. Sunscreen and not touching them speed things up.',
  },
  melasma: {
    what: 'Brown or grey-brown patches, often on both cheeks, the forehead and above the lip. The pigment cells make too much pigment, mostly because of hormones and light. It is common in women and in medium to deep skin tones.',
    why: ['Sun and visible light, even through windows', 'Hormones: pregnancy, the pill', 'Heat', 'Genetics', 'Some perfumed products in the sun'],
    course: 'It is long-term and comes back easily, especially in summer. It can fade a lot with daily sun protection and the right care, but needs to be kept under control.',
  },
  pih: {
    what: 'Brown marks left after a spot, a scratch or irritation. The inflammation tells pigment cells to make extra pigment, which stays in the skin. It is flat and isn’t a scar. Deeper skin tones get it more.',
    why: ['Spots and acne', 'Picking and squeezing', 'Irritation and eczema', 'Sun, which darkens the marks'],
    course: 'It fades on its own, but slowly: from 3 months to more than a year. Sunscreen every day and brightening ingredients speed it up.',
  },
  'sun-spots': {
    what: 'Flat brown spots on areas that get a lot of sun: the face, hands and chest. Years of sun make pigment cells produce more pigment in one place. They are harmless.',
    why: ['Years of sun exposure', 'Sunbeds', 'Age: they appear more after 40', 'Fair to medium skin'],
    course: 'They don’t go away on their own and can get darker with sun. Have any spot that changes, grows or bleeds checked by a dermatologist.',
  },
  'dry-skin': {
    what: 'Skin that doesn’t make enough oil. It feels tight, rough and can flake or itch. It is a skin type: the skin lacks fats (lipids) to hold water in.',
    why: ['Genetics', 'Age: the skin makes less oil over time', 'Cold, wind and heating', 'Hot water and harsh soap', 'Some medicines, such as acne treatments'],
    course: 'It is often lifelong, and worse in winter. A good moisturizer every day keeps it comfortable.',
  },
  'dehydrated-skin': {
    what: 'Skin that lacks water, not oil. Any skin type can be dehydrated, even oily skin. It feels tight, looks dull and shows fine lines that disappear when you moisturize.',
    why: ['A weakened skin barrier', 'Harsh cleansers and too many actives', 'Heating, air conditioning and wind', 'Not drinking enough, alcohol and lack of sleep'],
    course: 'It is temporary. It improves within days to a few weeks with gentle care and hydrating products.',
  },
  'chapped-lips': {
    what: 'Lips have a very thin skin with no oil glands, so they dry out quickly. They become rough, flaky and can crack or split.',
    why: ['Cold, wind, sun and dry air', 'Licking your lips: saliva dries them more', 'Breathing through the mouth', 'Some toothpastes, lipsticks or flavours', 'Acne medicines (isotretinoin)'],
    course: 'It usually heals within a few days with a good balm. If it lasts more than 2 to 3 weeks, see a doctor.',
  },
  'angular-cheilitis': {
    what: 'Red, sore cracks at the corners of the mouth. Saliva collects there, keeps the skin wet and lets yeast or bacteria grow.',
    why: ['Saliva in the corners of the mouth', 'Licking your lips', 'Dentures or braces', 'Yeast (Candida) or bacteria', 'Lack of iron or B vitamins'],
    course: 'It usually heals in 1 to 2 weeks with the right treatment. If it keeps coming back, see a doctor to check for an infection or a deficiency.',
  },
  'fine-lines': {
    what: 'Thin, shallow lines, often around the eyes and on the forehead. With time, the skin makes less collagen and holds less water, and repeated movements fold it in the same place.',
    why: ['Natural ageing: less collagen each year', 'Sun, the main cause of early ageing', 'Dehydration', 'Smoking', 'Repeated expressions: smiling, frowning'],
    course: 'They don’t go away on their own, but they respond well to care: hydration helps in days, retinoids in a few months.',
  },
  'deep-wrinkles': {
    what: 'Deeper folds that stay even when your face is relaxed. Collagen and elastin, which keep the skin firm and supple, have decreased, and the skin can no longer bounce back.',
    why: ['Age', 'Years of sun exposure', 'Smoking', 'Repeated expressions', 'Weight changes'],
    course: 'They don’t go away on their own. Skincare can soften them a little; clinic treatments do more.',
  },
  sagging: {
    what: 'The skin and the tissues under it lose firmness and slowly move down. The jawline looks less sharp and the neck less tight. It comes from less collagen and elastin, but also from changes in fat and bone.',
    why: ['Age', 'Sun damage', 'Big weight changes', 'Smoking', 'Genetics'],
    course: 'It continues slowly with age. Skincare can firm the surface a bit; real lifting needs clinic treatments.',
  },
  'volume-loss': {
    what: 'With age, the fat pads under the skin shrink and move, and the bones change. The cheeks and temples look hollower and the face less full.',
    why: ['Age', 'Weight loss', 'Genetics', 'Intense sport with a very low body fat level'],
    course: 'It continues slowly with age. Skincare can’t restore volume: only clinic treatments such as fillers can.',
  },
  'uneven-texture': {
    what: 'Skin that feels rough or bumpy instead of smooth. Dead skin builds up, pores are blocked, or small scars and sun damage change the surface.',
    why: ['A build-up of dead skin cells', 'Small blocked pores', 'Old acne marks', 'Sun damage', 'Dryness'],
    course: 'It often improves within a few weeks with gentle, regular exfoliation. Scars need longer or clinic treatments.',
  },
  dullness: {
    what: 'Skin that looks tired and lacks glow. Dead cells build up on the surface and reflect light less well, and the skin may lack water.',
    why: ['Dead skin cells building up', 'Dehydration', 'Lack of sleep and stress', 'Sun damage', 'Smoking'],
    course: 'It is usually temporary. Gentle exfoliation, hydration and sleep improve it within days to weeks.',
  },
  'dark-circles': {
    what: 'Darker skin under the eyes. It can be extra pigment (brown circles), blood vessels showing through thin skin (blue or purple circles), or a shadow from a hollow under the eye.',
    why: ['Genetics: the most common cause', 'Thin skin under the eyes', 'Extra pigment, common in deeper skin tones', 'A hollow that casts a shadow', 'Lack of sleep, allergies and rubbing the eyes'],
    course: 'Circles from genetics usually stay. Those from tiredness or allergies improve when the cause is treated.',
  },
  'puffy-eyes': {
    what: 'Swelling under or around the eyes. Fluid can build up in the thin skin there, especially overnight. With age, the fat around the eye can also push forward and form bags.',
    why: ['Fluid building up overnight', 'Salty food and alcohol', 'Lack of sleep and crying', 'Allergies', 'Age, which makes the fat move forward'],
    course: 'Morning puffiness usually goes down within a few hours. Bags from age stay and only surgery removes them.',
  },
  'acne-scars': {
    what: 'Dents in the skin left after deep or inflamed acne. The inflammation destroyed collagen and the skin healed with a hollow. They can be narrow and deep (ice pick), wide (rolling) or square (boxcar).',
    why: ['Deep, inflamed or cystic acne', 'Picking and squeezing', 'Treating acne too late', 'Genetics'],
    course: 'They are permanent and don’t fade on their own. Clinic treatments can improve them a lot. Treating acne early prevents new ones.',
  },
  'raised-scars': {
    what: 'Scars that rise above the skin. The skin made too much collagen while healing. A hypertrophic scar stays within the wound; a keloid grows beyond it.',
    why: ['Genetics and deeper skin tones', 'Deep wounds or acne', 'Piercings and surgery', 'Areas such as the jaw, chest and shoulders'],
    course: 'Hypertrophic scars often flatten slowly over 1 to 2 years. Keloids don’t go away and can grow: see a dermatologist early.',
  },
  sunburn: {
    what: 'A burn from the sun’s UV rays. They damage the skin cells and their DNA, and the skin reacts with redness, heat and pain. All skin tones can burn.',
    why: ['Too much sun without protection', 'Not enough sunscreen or not reapplying it', 'Strong sun: midday, summer, altitude, snow, water', 'Some medicines and acids, which make the skin more sensitive'],
    course: 'It heals in 3 to 7 days, often peeling. The damage to the skin stays and adds up over the years. See a doctor for blisters over a large area, fever or chills.',
  },
  'sun-damage': {
    what: 'Years of sun change the skin: brown spots, rough texture, wrinkles, lost firmness and sometimes small red vessels. It is called photoageing and causes most visible skin ageing.',
    why: ['Years of sun without protection', 'Sunbeds', 'Sunburns, especially in childhood', 'Living in a sunny place or working outdoors'],
    course: 'It doesn’t go away on its own, but daily sunscreen stops it from getting worse and the skin repairs part of it. Have any spot that changes checked.',
  },
}
