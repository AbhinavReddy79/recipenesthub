import type { ImageCredit } from "@/types/recipe";

/**
 * Photos for the regional Indian recipes, from Wikimedia Commons. These are
 * openly licensed (Creative Commons), so each one carries its credit, which the
 * recipe page shows under the photo.
 */
export const indianPhotos: Record<string, { image: string; imageCredit: ImageCredit }> = {
  "masala-dosa": {
    image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/ba/Masala_Dosa_2023.jpg/1920px-Masala_Dosa_2023.jpg",
    imageCredit: { author: "Yakshitha", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:Masala_Dosa_2023.jpg" },
  },
  "poha": {
    image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e6/Maharastrian_Kanda_Poha.jpg/1920px-Maharastrian_Kanda_Poha.jpg",
    imageCredit: { author: "Pranit pawar", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:Maharastrian_Kanda_Poha.jpg" },
  },
  "chole-bhature": {
    image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/9e/Chole_Bhature_from_Nagpur.JPG/1920px-Chole_Bhature_from_Nagpur.JPG",
    imageCredit: { author: "Dheerajk88", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:Chole_Bhature_from_Nagpur.JPG" },
  },
  "palak-paneer": {
    image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b7/Palakpaneer_Rayagada_Odisha_0009.jpg/1920px-Palakpaneer_Rayagada_Odisha_0009.jpg",
    imageCredit: { author: "Lopanayak", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:Palakpaneer_Rayagada_Odisha_0009.jpg" },
  },
  "pav-bhaji": {
    image: "https://upload.wikimedia.org/wikipedia/commons/4/4a/Bambayya_Pav_bhaji.jpg",
    imageCredit: { author: "Rupali Banarase", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:Bambayya_Pav_bhaji.jpg" },
  },
  "aloo-gobi": {
    image: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Aloo_Ghobi.jpg",
    imageCredit: { author: "Sapanabehl", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:Aloo_Ghobi.jpg" },
  },
  "rajma": {
    image: "https://upload.wikimedia.org/wikipedia/commons/3/37/Rajma_Masala_%2832081557778%29.jpg",
    imageCredit: { author: "Gaurav Nemade", license: "CC BY-SA 2.0", source: "https://commons.wikimedia.org/wiki/File:Rajma_Masala_(32081557778).jpg" },
  },
  "dal-makhani": {
    image: "https://upload.wikimedia.org/wikipedia/commons/6/69/Punjabi_style_Dal_Makhani.jpg",
    imageCredit: { author: "Radhikamprabhu82", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:Punjabi_style_Dal_Makhani.jpg" },
  },
  "rogan-josh": {
    image: "https://upload.wikimedia.org/wikipedia/commons/6/67/Rogan_Josh_Kashmiri.jpg",
    imageCredit: { author: "Spice Eats", license: "CC BY 3.0", source: "https://commons.wikimedia.org/wiki/File:Rogan_Josh_Kashmiri.jpg" },
  },
  "chicken-tikka-masala": {
    image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/00/Chicken_tikka_masala_%28cropped%29.jpg/1920px-Chicken_tikka_masala_%28cropped%29.jpg",
    imageCredit: { author: "Michael Hays", license: "CC BY 2.0", source: "https://commons.wikimedia.org/wiki/File:Chicken_tikka_masala_(cropped).jpg" },
  },
  "malai-kofta": {
    image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ee/Malai_Kofta_Garnished_and_Ready_to_Eat_India.jpg/1920px-Malai_Kofta_Garnished_and_Ready_to_Eat_India.jpg",
    imageCredit: { author: "Divya Kudua", license: "CC BY 2.0", source: "https://commons.wikimedia.org/wiki/File:Malai_Kofta_Garnished_and_Ready_to_Eat_India.jpg" },
  },
  "gulab-jamun": {
    image: "https://upload.wikimedia.org/wikipedia/commons/c/c1/Gulab-jamun-wallpaper-1.jpg",
    imageCredit: { author: "Sapra5379", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:Gulab-jamun-wallpaper-1.jpg" },
  },
  "lassi": {
    image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7b/Tasty_Mango_lassi_picture.JPG/1920px-Tasty_Mango_lassi_picture.JPG",
    imageCredit: { author: "Nithyasrm", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:Tasty_Mango_lassi_picture.JPG" },
  },
  "masala-chai": {
    image: "https://upload.wikimedia.org/wikipedia/commons/8/89/Chai_In_Sakora.jpg",
    imageCredit: { author: "Dadhichbittu007", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:Chai_In_Sakora.jpg" },
  },
};
