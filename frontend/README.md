# PixelPrep Frontend

Professional React frontend for PixelPrep image optimization service, featuring the **EntryThingy design system**.

## 🎨 Design System

PixelPrep implements the EntryThingy design language for professional, consistent user experience:

### Key Features
- **Typography**: Outfit font (variable weight 100-900) with proper hierarchy
- **Color System**: Semantic CSS variables supporting light/dark modes
- **Dark Mode**: Complete theme support with user preference persistence
- **Layout**: Professional spacing and component patterns
- **Accessibility**: WCAG compliant with proper focus states and reduced motion support

### Color Palette
```css
/* Light Mode */
--color-bg-primary: white
--color-text-primary: #111827
--color-accent-primary: #3b82f6    /* Blue - Primary actions */
--color-accent-secondary: #16a34a  /* Green - Success states */
--color-accent-purple: #6b21a8     /* Purple - Admin functions */

/* Dark Mode */
--color-bg-primary: #111827
--color-text-primary: #f3f4f6
--color-accent-primary: #60a5fa
```

## 🛠️ Tech Stack

- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite with hot module replacement
- **Styling**: TailwindCSS v3 with custom CSS variables
- **State Management**: React hooks + Context API
- **HTTP Client**: Fetch API with retry logic
- **Authentication**: GitHub OAuth + JWT tokens
- **File Upload**: react-dropzone for drag & drop

## 📁 Project Structure

```
frontend/src/
├── components/
│   ├── UploadZone.tsx          # Drag & drop file upload
│   ├── PresetSelector.tsx      # Image optimization presets
│   ├── ProcessingStatus.tsx    # Loading states
│   ├── ResultsDisplay.tsx      # Download interface
│   ├── UserHeader.tsx          # User management
│   ├── DarkModeToggle.tsx      # Theme switcher
│   └── LoginPrompt.tsx         # Authentication modal
├── hooks/
│   └── useDarkMode.ts          # Dark mode state management
├── services/
│   ├── api.ts                  # Backend API integration
│   ├── auth.ts                 # Authentication service
│   ├── storage.ts              # Local storage utilities
│   └── supabase.ts             # Database client
├── index.css                   # EntryThingy design system CSS
├── App.tsx                     # Main application component
└── types.ts                    # TypeScript interfaces
```

## 🚀 Development

### Prerequisites
- Node.js 18+ and npm
- Backend server running on localhost:8000

### Setup
```bash
cd frontend
npm install
npm run dev
```

### Available Scripts
```bash
npm run dev         # Start development server
npm run build       # Production build
npm run lint        # ESLint code checking
npm run preview     # Preview production build
npm run type-check  # TypeScript validation
```

## 🔧 Configuration

### Environment Variables
Create `.env.local` for local development:
```env
VITE_API_URL=http://localhost:8000
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Tailwind Configuration
The design system is configured in `tailwind.config.js`:
- Custom color variables
- Outfit font family
- Dark mode support
- Extended spacing scale

## 📱 Responsive Design

The interface adapts to all screen sizes:
- **Mobile**: Single column layout with touch-friendly interactions
- **Tablet**: Two-column preset grid with optimized spacing
- **Desktop**: Full three-column layout with hover states

## ♿ Accessibility

- **Keyboard Navigation**: Full tab navigation support
- **Screen Readers**: Semantic HTML and ARIA labels
- **Reduced Motion**: Respects user preferences for animations
- **Color Contrast**: WCAG AA compliant color ratios
- **Focus Management**: Visible focus indicators

## 🎯 User Experience

### Anonymous Users
1. Upload image via drag & drop or file picker
2. Select optimization preset
3. Download processed image
4. Usage tracking with gentle upgrade prompts

### Authenticated Users
1. GitHub OAuth sign-in flow
2. Persistent image gallery
3. Unlimited optimizations
4. Processing history and metadata

## 🔄 State Management

### Global State
- User authentication status
- Dark/light mode preference
- Upload progress and results
- Error handling and notifications

### Local State
- Form inputs and validation
- UI component states
- Modal visibility
- Loading indicators

## 📦 Build & Deployment

### Production Build
```bash
npm run build
```

### GitHub Pages Deployment
The frontend automatically deploys to GitHub Pages via GitHub Actions:
- **URL**: https://third-south-capital.github.io/pixelprep/
- **Trigger**: Push to main branch
- **Build**: Vite static build with asset optimization

## 🧪 Development Tools

- **Hot Reload**: Instant updates during development
- **TypeScript**: Full type safety and IntelliSense
- **ESLint**: Code quality and consistency checking
- **Prettier**: Automated code formatting
- **Dev Tools**: React DevTools and browser debugging

## 📖 Design System Usage

### Using CSS Variables
```tsx
// Good - uses semantic variables
<div className="bg-primary text-primary border-primary">

// Avoid - hardcoded colors
<div className="bg-white text-gray-900 border-gray-200">
```

### Button Patterns
```tsx
// Primary action
<button className="accent-primary-bg text-inverse px-8 py-3 rounded-lg">

// Secondary action
<button className="accent-purple-bg text-inverse px-4 py-2 rounded-full">

// Tertiary action
<button className="bg-primary border border-primary hover:bg-secondary">
```

### Component Hierarchy
1. **App.tsx** - Layout and global state
2. **UploadZone** - File handling and validation
3. **PresetSelector** - Optimization options
4. **ProcessingStatus** - Loading feedback
5. **ResultsDisplay** - Download interface