import type { ImageCredit } from "@/types/recipe";

/**
 * Photos for the regional recipes (every Indian state, plus breakfasts, lunches
 * and snacks from around the world), from Wikimedia Commons. They are openly
 * licensed, so each carries its credit, which the recipe page shows under the photo.
 */
export const regionalPhotos: Record<string, { image: string; imageCredit: ImageCredit }> = {
  "himachali-madra": {
    image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8b/White_Chana_Madra.jpg/1280px-White_Chana_Madra.jpg",
    imageCredit: { author: "Niyati Sharma 1505", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:White_Chana_Madra.jpg" },
  },
  "haryanvi-kadhi-pakora": {
    image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/67/Kadhi_Pakora.jpg/1280px-Kadhi_Pakora.jpg",
    imageCredit: { author: "Ams4wiki", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:Kadhi_Pakora.jpg" },
  },
  "dal-baati-churma": {
    image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f0/Dal_Baati_Churma.jpg/1280px-Dal_Baati_Churma.jpg",
    imageCredit: { author: "Harshmander Rastogi", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:Dal_Baati_Churma.jpg" },
  },
  "pyaaz-kachori": {
    image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/78/Jodhpuri_Kanda%28Pyaaz%29_Kachori_with_tamarind_chutney.jpg/1280px-Jodhpuri_Kanda%28Pyaaz%29_Kachori_with_tamarind_chutney.jpg",
    imageCredit: { author: "PabIoChocobar", license: "CC0", source: "https://commons.wikimedia.org/wiki/File:Jodhpuri_Kanda(Pyaaz)_Kachori_with_tamarind_chutney.jpg" },
  },
  "ladakhi-thenthuk": {
    image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/56/Thenthuk.jpg/1280px-Thenthuk.jpg",
    imageCredit: { author: "Gaurav Dhwaj Khadka", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:Thenthuk.jpg" },
  },
  "khaman-dhokla": {
    image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/ce/Khaman_Dhokla_Gujrati.jpg/1280px-Khaman_Dhokla_Gujrati.jpg",
    imageCredit: { author: "Mrudit161187", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:Khaman_Dhokla_Gujrati.jpg" },
  },
  "methi-thepla": {
    image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/74/Thepla_main.jpg/1280px-Thepla_main.jpg",
    imageCredit: { author: "Rocky231293", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:Thepla_main.jpg" },
  },
  "goan-prawn-curry": {
    image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/14/Goan_prawn_curry.jpg/1280px-Goan_prawn_curry.jpg",
    imageCredit: { author: "Schellack at English Wikipedia", license: "CC BY 3.0", source: "https://commons.wikimedia.org/wiki/File:Goan_prawn_curry.jpg" },
  },
  "misal-pav": {
    image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a0/Kolhapuri_Misal_Pav.jpg/1280px-Kolhapuri_Misal_Pav.jpg",
    imageCredit: { author: "Ankushkr2020", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:Kolhapuri_Misal_Pav.jpg" },
  },
  "angakar-roti": {
    image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e3/Angakar_roti_%2C_Chhattisgarhi_Cuisine.jpg/1280px-Angakar_roti_%2C_Chhattisgarhi_Cuisine.jpg",
    imageCredit: { author: "Mettle30", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:Angakar_roti_,_Chhattisgarhi_Cuisine.jpg" },
  },
  "macher-jhol": {
    image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2e/Pabda_macher_jhol%2C_cuisine_of_West_Bengal_20200305142259.jpg/1280px-Pabda_macher_jhol%2C_cuisine_of_West_Bengal_20200305142259.jpg",
    imageCredit: { author: "বাক্যবাগীশ", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:Pabda_macher_jhol,_cuisine_of_West_Bengal_20200305142259.jpg" },
  },
  "kolkata-egg-roll": {
    image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/bc/EGG_ROLL.JPG/1280px-EGG_ROLL.JPG",
    imageCredit: { author: "Satadaldas1966", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:EGG_ROLL.JPG" },
  },
  "odia-dalma": {
    image: "https://upload.wikimedia.org/wikipedia/commons/1/13/Dalama_Odia_Cuisine.jpg",
    imageCredit: { author: "Subhashish Panigrahi", license: "CC BY-SA 3.0", source: "https://commons.wikimedia.org/wiki/File:Dalama_Odia_Cuisine.jpg" },
  },
  "litti-chokha": {
    image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ae/Litti_Chokha_2.jpg/1280px-Litti_Chokha_2.jpg",
    imageCredit: { author: "Eddie Stann", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:Litti_Chokha_2.jpg" },
  },
  "jharkhand-dhuska": {
    image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/9e/Dhuska-Jharkhand.jpg/1280px-Dhuska-Jharkhand.jpg",
    imageCredit: { author: "Rashid Jorvee", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:Dhuska-Jharkhand.jpg" },
  },
  "masor-tenga": {
    image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/54/Masor_Tenga.jpg/1280px-Masor_Tenga.jpg",
    imageCredit: { author: "Rupak76", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:Masor_Tenga.jpg" },
  },
  "meghalaya-jadoh": {
    image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f3/Jadoh.jpg/1280px-Jadoh.jpg",
    imageCredit: { author: "Wann Majaw", license: "CC0", source: "https://commons.wikimedia.org/wiki/File:Jadoh.jpg" },
  },
  "manipuri-eromba": {
    image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/67/Yongchaak_eromba_%282%29.jpg/1280px-Yongchaak_eromba_%282%29.jpg",
    imageCredit: { author: "Punshiba18", license: "CC BY-SA 3.0", source: "https://commons.wikimedia.org/wiki/File:Yongchaak_eromba_(2).jpg" },
  },
  "mizo-bai": {
    image: "https://upload.wikimedia.org/wikipedia/commons/4/40/Mizo_food.jpg",
    imageCredit: { author: "Coolcolney", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:Mizo_food.jpg" },
  },
  "naga-smoked-pork-bamboo-shoot": {
    image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e7/Naga_style_smoked_Pork_ribs_with_bamboo_shoots_and_rice.jpg/1280px-Naga_style_smoked_Pork_ribs_with_bamboo_shoots_and_rice.jpg",
    imageCredit: { author: "Satdeep Gill", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:Naga_style_smoked_Pork_ribs_with_bamboo_shoots_and_rice.jpg" },
  },
  "tripuri-wahan-mosdeng": {
    image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/fe/Wahan_Mosdeng_and_Ruti-_Agartala-_Tripura.jpg/1280px-Wahan_Mosdeng_and_Ruti-_Agartala-_Tripura.jpg",
    imageCredit: { author: "Tuhi2001", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:Wahan_Mosdeng_and_Ruti-_Agartala-_Tripura.jpg" },
  },
  "arunachali-thukpa": {
    image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/fe/Thukpa_1.jpg/1280px-Thukpa_1.jpg",
    imageCredit: { author: "Scudsvlad", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:Thukpa_1.jpg" },
  },
  "sikkimese-momos": {
    image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/9a/Steamed_Momos_-_KOLKATA.jpg/1280px-Steamed_Momos_-_KOLKATA.jpg",
    imageCredit: { author: "TAPAS KUMAR HALDER", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:Steamed_Momos_-_KOLKATA.jpg" },
  },
  "pesarattu": {
    image: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Pesarattu_with_ginger_chutney.jpg",
    imageCredit: { author: "Ashok Kumar P S", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:Pesarattu_with_ginger_chutney.jpg" },
  },
  "bisi-bele-bath": {
    image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6a/Bisi_Bele_Bath.jpg/1280px-Bisi_Bele_Bath.jpg",
    imageCredit: { author: "Devika.pujari", license: "CC0", source: "https://commons.wikimedia.org/wiki/File:Bisi_Bele_Bath.jpg" },
  },
  "chettinad-chicken": {
    image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c6/ChickenChettinad.JPG/1280px-ChickenChettinad.JPG",
    imageCredit: { author: "Maccess Corporation", license: "CC BY-SA 2.5", source: "https://commons.wikimedia.org/wiki/File:ChickenChettinad.JPG" },
  },
  "appam-vegetable-stew": {
    image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f1/Appam_and_stew.jpg/1280px-Appam_and_stew.jpg",
    imageCredit: { author: "Nithajay", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:Appam_and_stew.jpg" },
  },
  "sarson-da-saag-makki-roti": {
    image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/65/Makki_di_Roti_Te_Sarson_Da_Saag.jpg/1280px-Makki_di_Roti_Te_Sarson_Da_Saag.jpg",
    imageCredit: { author: "Yash Kapoor", license: "CC BY-SA 3.0", source: "https://commons.wikimedia.org/wiki/File:Makki_di_Roti_Te_Sarson_Da_Saag.jpg" },
  },
  "bal-mithai": {
    image: "https://upload.wikimedia.org/wikipedia/commons/9/9a/Bal_mithai.jpg",
    imageCredit: { author: "vkumar", license: "CC BY 3.0", source: "https://commons.wikimedia.org/wiki/File:Bal_mithai.jpg" },
  },
  "dal-bafla": {
    image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5d/Daal_Bafla.jpg/1280px-Daal_Bafla.jpg",
    imageCredit: { author: "Sumit Surai", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:Daal_Bafla.jpg" },
  },
  "banarasi-kachori-sabzi": {
    image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/9f/Kachori_Sabzi.JPG/1280px-Kachori_Sabzi.JPG",
    imageCredit: { author: "Srutiagarwal123", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:Kachori_Sabzi.JPG" },
  },
  "italian-vegetable-frittata": {
    image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/20/Frittata_-_Bam%27s_Kitchen_2024-04-02.jpg/1280px-Frittata_-_Bam%27s_Kitchen_2024-04-02.jpg",
    imageCredit: { author: "Andy Li", license: "CC0", source: "https://commons.wikimedia.org/wiki/File:Frittata_-_Bam%27s_Kitchen_2024-04-02.jpg" },
  },
  "classic-minestrone": {
    image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/32/Minestrone_soup.jpg/1280px-Minestrone_soup.jpg",
    imageCredit: { author: "Katrin Morenz from Aachen, Deutschland", license: "CC BY-SA 2.0", source: "https://commons.wikimedia.org/wiki/File:Minestrone_soup.jpg" },
  },
  "tomato-bruschetta": {
    image: "https://upload.wikimedia.org/wikipedia/commons/3/39/Bruschetta_with_Tomatoes-01.jpg",
    imageCredit: { author: "Mike_fleming", license: "CC BY-SA 2.0", source: "https://commons.wikimedia.org/wiki/File:Bruschetta_with_Tomatoes-01.jpg" },
  },
  "huevos-rancheros": {
    image: "https://upload.wikimedia.org/wikipedia/commons/3/32/Ela_huevos_rancheros.jpg",
    imageCredit: { author: "Elchavobeer", license: "CC BY-SA 3.0", source: "https://commons.wikimedia.org/wiki/File:Ela_huevos_rancheros.jpg" },
  },
  "guacamole-totopos": {
    image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/64/Guacamole_IMGP1271.jpg/1280px-Guacamole_IMGP1271.jpg",
    imageCredit: { author: "Nikodem Nijaki", license: "CC BY-SA 3.0", source: "https://commons.wikimedia.org/wiki/File:Guacamole_IMGP1271.jpg" },
  },
  "chinese-chicken-congee": {
    image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/0a/St_Regis_Singapore_Chicken_congee_%283694127914%29.jpg/1280px-St_Regis_Singapore_Chicken_congee_%283694127914%29.jpg",
    imageCredit: { author: "Matt @ PEK from Taipei, Taiwan", license: "CC BY-SA 2.0", source: "https://commons.wikimedia.org/wiki/File:St_Regis_Singapore_Chicken_congee_(3694127914).jpg" },
  },
  "tamagoyaki": {
    image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/07/Dashimaki_tamago_by_june29.jpg/1280px-Dashimaki_tamago_by_june29.jpg",
    imageCredit: { author: "june29", license: "CC BY 2.0", source: "https://commons.wikimedia.org/wiki/File:Dashimaki_tamago_by_june29.jpg" },
  },
  "salmon-onigiri": {
    image: "https://upload.wikimedia.org/wikipedia/commons/1/1c/Salmon_onigiri_by_yomi955.jpg",
    imageCredit: { author: "yomi955", license: "CC BY 2.0", source: "https://commons.wikimedia.org/wiki/File:Salmon_onigiri_by_yomi955.jpg" },
  },
  "gyeran-jjim": {
    image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e5/Gyeran-jjim.jpg/1280px-Gyeran-jjim.jpg",
    imageCredit: { author: "stu_spivack", license: "CC BY-SA 2.0", source: "https://commons.wikimedia.org/wiki/File:Gyeran-jjim.jpg" },
  },
  "tteokbokki": {
    image: "https://upload.wikimedia.org/wikipedia/commons/5/56/Korean.snacks-Tteokbokki-08.jpg",
    imageCredit: { author: "by jetalone (flickr)", license: "CC BY 2.0", source: "https://commons.wikimedia.org/wiki/File:Korean.snacks-Tteokbokki-08.jpg" },
  },
  "kimchi-jjigae": {
    image: "https://upload.wikimedia.org/wikipedia/commons/d/d6/Korean.cuisine-Kimchi_jjigae-01.jpg",
    imageCredit: { author: "by avlxyz", license: "CC BY-SA 2.0", source: "https://commons.wikimedia.org/wiki/File:Korean.cuisine-Kimchi_jjigae-01.jpg" },
  },
  "thai-khao-tom-pla": {
    image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/05/Khao_tom_pla.jpg/1280px-Khao_tom_pla.jpg",
    imageCredit: { author: "Takeaway", license: "CC BY-SA 3.0", source: "https://commons.wikimedia.org/wiki/File:Khao_tom_pla.jpg" },
  },
  "pad-thai": {
    image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/63/Thai-Pad-Thai_2023-06-04.jpg/1280px-Thai-Pad-Thai_2023-06-04.jpg",
    imageCredit: { author: "Andy Li", license: "CC0", source: "https://commons.wikimedia.org/wiki/File:Thai-Pad-Thai_2023-06-04.jpg" },
  },
  "thai-chicken-satay": {
    image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/66/DSCF1097_Golden_grilled_chicken_satay_skewers_laid_out_on_banana_leaves_ready_to_serve_at_a_bustling_street-food_stall.jpg/1280px-DSCF1097_Golden_grilled_chicken_satay_skewers_laid_out_on_banana_leaves_ready_to_serve_at_a_bustling_street-food_stall.jpg",
    imageCredit: { author: "PattayaPatrol", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:DSCF1097_Golden_grilled_chicken_satay_skewers_laid_out_on_banana_leaves_ready_to_serve_at_a_bustling_street-food_stall.jpg" },
  },
  "banh-mi": {
    image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/82/B%C3%A1nh_mi_Sandwich%28Takadanobaba%29IMG_20220215_104413_03.jpg/1280px-B%C3%A1nh_mi_Sandwich%28Takadanobaba%29IMG_20220215_104413_03.jpg",
    imageCredit: { author: "経済特区", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:B%C3%A1nh_mi_Sandwich(Takadanobaba)IMG_20220215_104413_03.jpg" },
  },
  "bun-cha": {
    image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/56/Bun_cha_Hanoi.jpg/1280px-Bun_cha_Hanoi.jpg",
    imageCredit: { author: "Weetjesman", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:Bun_cha_Hanoi.jpg" },
  },
  "goi-cuon": {
    image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f2/Goi_cuon_Phuongnhu.JPG/1280px-Goi_cuon_Phuongnhu.JPG",
    imageCredit: { author: "Phuongnhu", license: "CC BY-SA 3.0", source: "https://commons.wikimedia.org/wiki/File:Goi_cuon_Phuongnhu.JPG" },
  },
  "shakshuka": {
    image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/18/Shakshuka_by_Calliopejen1.jpg/1280px-Shakshuka_by_Calliopejen1.jpg",
    imageCredit: { author: "Calliopejen1", license: "CC BY-SA 3.0", source: "https://commons.wikimedia.org/wiki/File:Shakshuka_by_Calliopejen1.jpg" },
  },
  "classic-deviled-eggs": {
    image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/74/Deviled_Eggs_on_Plate.jpg/1280px-Deviled_Eggs_on_Plate.jpg",
    imageCredit: { author: "HeatherMarieKosur", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:Deviled_Eggs_on_Plate.jpg" },
  },
  "classic-hot-chocolate": {
    image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/cb/Hot_chocolate_%28Unsplash%29.jpg/1280px-Hot_chocolate_%28Unsplash%29.jpg",
    imageCredit: { author: "Alisa Anton", license: "CC0", source: "https://commons.wikimedia.org/wiki/File:Hot_chocolate_(Unsplash).jpg" },
  },
};
