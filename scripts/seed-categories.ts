import axios from 'axios';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import caseMainPool from './db-main';

interface Category {
  name: string;
  slug: string;
  imageUrl: string;
  section: 'custom-designed' | 'our-categories';
  sortOrder: number;
}

const categories: Category[] = [
  // Section 1: Our Custom Designed Cases
  { name: 'Silicone Cases', slug: 'designer-slim-case', imageUrl: 'https://atcasa.co.in/cdn/shop/files/IMG_23942.jpg?v=1749472271&width=480', section: 'custom-designed', sortOrder: 1 },
  { name: 'Protective Bumper Case', slug: 'black-bumper-case', imageUrl: 'https://atcasa.co.in/cdn/shop/files/WhatsAppImage2025-09-29at17.14.52.jpg?v=1759147624&width=480', section: 'custom-designed', sortOrder: 2 },
  { name: 'Clear Bumper Cases', slug: 'black-transparent-bumper-iphone-cases', imageUrl: 'https://atcasa.co.in/cdn/shop/files/Untitled_design.png?v=1758969377&width=720', section: 'custom-designed', sortOrder: 3 },
  { name: 'Best Sellers', slug: 'best-sellers-custom-cases', imageUrl: 'https://atcasa.co.in/cdn/shop/files/IMG-4431.jpg?v=1722080440&width=720', section: 'custom-designed', sortOrder: 4 },
  { name: 'Gripper Cases', slug: 'gripper-phone-cases', imageUrl: 'https://atcasa.co.in/cdn/shop/files/0f09a7fa-03df-4f6d-86a0-d0c94bb5.jpg?v=1722080410&width=720', section: 'custom-designed', sortOrder: 5 },
  { name: 'Name Initial Cases', slug: 'initial-phone-cases', imageUrl: 'https://atcasa.co.in/cdn/shop/files/IMG_24152.jpg?v=1749471133&width=480', section: 'custom-designed', sortOrder: 6 },
  { name: 'Evil Eye Cases', slug: 'evil-eye-phone-cases', imageUrl: 'https://atcasa.co.in/cdn/shop/files/IMG_23812.jpg?v=1749472905&width=480', section: 'custom-designed', sortOrder: 7 },
  { name: 'Full Print Silicone Case', slug: 'full-print-silicone-case', imageUrl: 'https://atcasa.co.in/cdn/shop/files/231b4dd4-852c-4f1f-a3b2-da46339a8d08-1-e1631617887863.jpg?v=1722081289&width=720', section: 'custom-designed', sortOrder: 8 },

  // Section 2: Our Categories
  { name: 'New Arrivals', slug: 'new-arrivals', imageUrl: 'https://atcasa.co.in/cdn/shop/files/IMG_8602.jpg?v=1758718099&width=480', section: 'our-categories', sortOrder: 9 },
  { name: 'Magsafe Cases', slug: 'magsafe-cases', imageUrl: 'https://atcasa.co.in/cdn/shop/files/43b07cfe-e148-4dc8-bdda-c3427b90a65d.jpg?v=1750678618&width=720', section: 'our-categories', sortOrder: 10 },
  { name: 'Bow Collection', slug: 'bow-custom-cases', imageUrl: 'https://atcasa.co.in/cdn/shop/files/WhatsApp-Image-2023-05-04-at-11.29.56-AM.jpg?v=1722076352&width=720', section: 'our-categories', sortOrder: 11 },
  { name: 'Cat Phone Cases', slug: 'cat-phone-cases', imageUrl: 'https://atcasa.co.in/cdn/shop/files/IMG_8820.jpg?v=1758967840&width=480', section: 'our-categories', sortOrder: 12 },
  { name: 'Flowers Name Cases', slug: 'floral-custom-cases', imageUrl: 'https://atcasa.co.in/cdn/shop/files/IMG_0835_59ffbf9e-109e-457e-9f96-3083f2d2f7e3.jpg?v=1762855283&width=480', section: 'our-categories', sortOrder: 13 },
  { name: 'Evil Eye Collection', slug: 'evil-eye-collection', imageUrl: 'https://atcasa.co.in/cdn/shop/files/WhatsApp-Image-2023-03-14-at-6.19.39-PM-1.jpg?v=1722079205&width=720', section: 'our-categories', sortOrder: 14 },
  { name: 'Cheeky Girl Cases', slug: 'cheeky-girl-case', imageUrl: 'https://atcasa.co.in/cdn/shop/files/IMG_24232.jpg?v=1749301454&width=480', section: 'our-categories', sortOrder: 15 },
  { name: 'Travel Cases', slug: 'travel-phone-cases', imageUrl: 'https://atcasa.co.in/cdn/shop/files/IMG_2379_2.jpg?v=1749473033&width=480', section: 'our-categories', sortOrder: 16 },
  { name: 'Aesthetic Cases', slug: 'aesthetic-phone-cases', imageUrl: 'https://atcasa.co.in/cdn/shop/files/225_1fb7024b-7a4f-4e4f-b6f7-a356b8cabf32.png?v=1750330921&width=720', section: 'our-categories', sortOrder: 17 },
  { name: 'Silicon Cases', slug: 'silicon-cases', imageUrl: 'https://atcasa.co.in/cdn/shop/files/IMG_8613.jpg?v=1758736788&width=480', section: 'our-categories', sortOrder: 18 },
  { name: 'Leopard Love', slug: 'leopard-phone-cases', imageUrl: 'https://atcasa.co.in/cdn/shop/files/35b4b398-266f-464c-bd48-f0dcc9e31179.jpg?v=1722080440&width=550', section: 'our-categories', sortOrder: 19 },
  { name: 'Pet Cases', slug: 'pet-phone-cases', imageUrl: 'https://atcasa.co.in/cdn/shop/files/IMG_0874_3a786d67-57aa-4e1d-a25a-1e4688addbce.jpg?v=1762843079&width=480', section: 'our-categories', sortOrder: 20 },
  { name: 'Name Cases', slug: 'name-phone-cases', imageUrl: 'https://atcasa.co.in/cdn/shop/files/il_794xN.3035293480_duub-e1646138531902.jpg?v=1722081593&width=360', section: 'our-categories', sortOrder: 21 },
  { name: 'Coffee Love', slug: 'coffee-love-cases', imageUrl: 'https://atcasa.co.in/cdn/shop/files/WhatsApp-Image-2024-03-27-at-6.58.45-PM.jpg?v=1722078197&width=720', section: 'our-categories', sortOrder: 22 },
  { name: 'Zodiac Cases', slug: 'zodiac-phone-cases', imageUrl: 'https://atcasa.co.in/cdn/shop/files/IMG_8978.jpg?v=1759148722&width=480', section: 'our-categories', sortOrder: 23 },
  { name: 'Positive Quotes Cases', slug: 'positive-quote-phone-cases', imageUrl: 'https://atcasa.co.in/cdn/shop/files/IMG_9218.jpg?v=1759319993&width=480', section: 'our-categories', sortOrder: 24 },
  { name: 'Full Print Collection', slug: 'full-print-collection', imageUrl: 'https://atcasa.co.in/cdn/shop/files/IMG_9007.jpg?v=1759148961&width=480', section: 'our-categories', sortOrder: 25 },
];

async function downloadImage(url: string, filename: string): Promise<string> {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data);
    
    const cdnDir = join(process.cwd(), 'public', 'cdn', 'categories');
    if (!existsSync(cdnDir)) {
      await mkdir(cdnDir, { recursive: true });
    }
    
    const filePath = join(cdnDir, filename);
    await writeFile(filePath, buffer);
    
    return `/cdn/categories/${filename}`;
  } catch (error) {
    console.error(`Failed to download ${url}:`, error);
    return url; // Fallback to original URL
  }
}

export async function seedCategories() {
  console.log('Starting category seeding...');
  
  for (const category of categories) {
    try {
      // Download image
      const extension = category.imageUrl.includes('.png') ? 'png' : 'jpg';
      const filename = `${category.slug}.${extension}`;
      console.log(`Downloading image for ${category.name}...`);
      const localImagePath = await downloadImage(category.imageUrl, filename);
      
      // Insert into database
      console.log(`Inserting ${category.name} into database...`);
      await caseMainPool.execute(
        `INSERT INTO categories (name, slug, image_url, description, sort_order, is_active)
         VALUES (?, ?, ?, ?, ?, TRUE)
         ON DUPLICATE KEY UPDATE
         name = VALUES(name),
         image_url = VALUES(image_url),
         description = VALUES(description),
         sort_order = VALUES(sort_order)`,
        [
          category.name,
          category.slug,
          localImagePath,
          `Browse our ${category.name} collection`,
          category.sortOrder
        ]
      );
      
      console.log(`✓ ${category.name} added successfully`);
    } catch (error) {
      console.error(`Error seeding ${category.name}:`, error);
    }
  }
  
  console.log('Category seeding completed!');
}

// Run if executed directly
if (require.main === module) {
  seedCategories()
    .then(() => {
      console.log('Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}
