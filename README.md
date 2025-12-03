# AI Phone Case Mockup Studio

A Next.js application that generates professional phone case mockups using Google's Gemini AI.

## Features

- 🎨 **AI-Powered Design**: Uses Gemini AI to analyze phone case geometry and generate realistic mockups
- 🖼️ **Multiple Angles**: Generates 5 grid images, each containing 5 different product angles
- ✂️ **Manual Cropping**: Built-in image cropper for custom selections
- ⚙️ **Auto-Split**: AI-powered automatic splitting of composite images
- 🎯 **Black & White Theme**: Modern, professional black and white design
- 📱 **Responsive**: Works on all device sizes

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

The `.env.local` file is already set up with:

```env
GEMINI_API_KEY=AIzaSyBtf-ghjT7YtH2M3oRiqZ5Hj__z44Pg_Xc
TEXT_MODEL=gemini-2.0-flash
IMAGE_MODEL=gemini-2.5-flash-image
```

⚠️ **Important**: Replace the API key with your own Gemini API key for production use.

### 3. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000/tool](http://localhost:3000/tool) in your browser.

## Project Structure

```
casetool/
├── app/
│   ├── tool/
│   │   ├── api/
│   │   │   ├── generate/route.ts     # Main generation API
│   │   │   └── auto-crop/route.ts    # Auto-split API
│   │   ├── page.tsx                  # Main tool UI
│   │   └── layout.tsx                # Tool layout
│   ├── globals.css                   # Global styles
│   └── layout.tsx                    # Root layout
├── components/
│   ├── ImageCard.tsx                 # Image result card
│   ├── CropModal.tsx                 # Cropping modal
│   ├── ProgressBar.tsx               # Progress indicator
│   ├── ConsoleOutput.tsx             # Debug console
│   └── ErrorBox.tsx                  # Error display
├── lib/
│   ├── gemini.ts                     # Gemini API client
│   ├── image-processing.ts           # Image utilities
│   ├── stream-helpers.ts             # SSE streaming
│   └── cropper-styles.ts             # Cropper CSS import
├── public/
│   ├── output/                       # Generated images
│   └── templates/                    # Template files
└── types/
    └── cropperjs.d.ts                # TypeScript definitions

```

## How It Works

### 1. Upload & Analysis
- User uploads a phone case image and enters the phone model
- Gemini AI analyzes the case geometry (camera cutouts, dimensions, materials)

### 2. Prompt Engineering
- AI generates a detailed prompt based on the analysis
- Ensures accuracy of camera islands, cutouts, and proportions

### 3. Image Generation
- Generates 5 composite grid images
- Each grid contains 5 different product angles:
  1. Front & back hero shot
  2. Back 3/4 view
  3. TPU lining showcase
  4. Flexibility demonstration
  5. Flat technical view

### 4. Post-Processing
- **Manual Crop**: Use the built-in cropper to extract specific areas
- **Auto-Split**: AI detects individual product shots and crops them automatically

## API Routes

### POST `/tool/api/generate`
Generates mockup images using streaming responses.

**Request:**
- `phone_model`: Target phone model name
- `case_image`: Phone case reference image

**Response:** Server-Sent Events stream with progress updates and generated images

### POST `/tool/api/auto-crop`
Auto-splits composite images into individual shots.

**Request:**
- `image_url`: URL of the image to split

**Response:**
```json
{
  "status": "ok",
  "slices": [
    {
      "id": 1,
      "label": "angle_1 (HD)",
      "url": "/output/auto_slice_hd_1234567890_1.png"
    }
  ]
}
```

## Technologies Used

- **Next.js 16** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling
- **Gemini AI** - Image analysis and generation
- **Cropper.js** - Image cropping
- **Canvas** - Server-side image processing

## Styling

The app uses a modern black and white theme:
- Background: `#000000` (Pure Black)
- Cards: `#18181b` (Zinc-900)
- Borders: `#27272a` (Zinc-800)
- Text: `#ffffff` (White)
- Accent: White with hover states

## Development Notes

### Canvas Package
The `canvas` package is used for server-side image processing. It requires native dependencies:

**Windows:**
```bash
npm install --global windows-build-tools
npm install canvas
```

**macOS:**
```bash
brew install pkg-config cairo pango libpng jpeg giflib librsvg
npm install canvas
```

**Linux:**
```bash
sudo apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev
npm install canvas
```

### Image Storage
Generated images are stored in `public/output/` and served statically.

## Troubleshooting

### Canvas Installation Issues
If canvas fails to install, you can use a different image processing library or skip the auto-crop feature.

### API Key Errors
Ensure your Gemini API key is valid and has sufficient quota.

### Large File Uploads
Adjust Next.js body size limits in `next.config.ts` if needed:

```typescript
experimental: {
  serverActions: {
    bodySizeLimit: '10mb',
  },
}
```

## License

This project is for demonstration purposes. Ensure you have proper licensing for all dependencies.

## Credits

Adapted from a PHP-based mockup generator to a modern Next.js application with enhanced features and styling.
