# Shumpiss - Interactive Pin Map

A modern, feature-rich interactive map application for tracking and managing location-based data. Built with SvelteKit, TypeScript, and Leaflet, featuring dual-view modes and comprehensive pin management.

## ✨ Features

### 🗺️ Interactive Map
- **Click-to-Place Pins**: Simply click anywhere on the map to create a new pin
- **Real-time Editing**: Edit pin details, descriptions, and types inline
- **Multiple Pin Types**: Support for different pin categories (Shit 💩, Cum 🍆, Piss 💦)
- **Visual Pin Styling**: Color-coded pins based on type with custom styling
- **Popup Information**: Rich popups showing pin details, creation time, and actions

### 📅 Date-Based View
- **Chronological Organization**: View all pins organized by date
- **Smart Date Display**: Shows "Today @ Time" for today's pins, "Date @ Time" for others
- **Advanced Filtering**: Filter pins by type, search by title/description, and date range
- **Date Range Filtering**: Filter pins by "after" and "before" date selections
- **Sorting Options**: Sort by newest or oldest first
- **Sticky Filter Panel**: Filter controls remain visible during scrolling

### 🎛️ Dual-View Architecture
- **Seamless Switching**: Toggle between Map and Date views instantly
- **Keyboard Shortcuts**: `Alt+M` for Map view, `Alt+D` for Date view
- **Cross-View Navigation**: Click pins in Date view to navigate to them on the map
- **Synchronized Data**: Real-time synchronization between views

### 🎨 Modern UI/UX
- **Responsive Design**: Works beautifully on desktop, tablet, and mobile
- **Material Design**: Clean, modern interface with Google Maps-inspired styling
- **Smooth Animations**: Polished transitions and hover effects
- **Accessibility**: Proper ARIA labels and keyboard navigation
- **Dark/Light Themes**: Adapts to system preferences

### 💾 Data Management
- **Local Storage**: Persistent pin storage in browser localStorage
- **Export/Import**: (Ready for implementation) Backup and restore functionality
- **Real-time Sync**: Multi-tab synchronization for consistent data
- **Data Validation**: Input validation and error handling

## 🛠️ Technical Stack

- **Frontend Framework**: SvelteKit 5.0
- **Language**: TypeScript with strict type checking
- **Styling**: Tailwind CSS 4.0 with custom components
- **Map Library**: Leaflet with OpenStreetMap tiles
- **Build Tool**: Vite with hot module replacement
- **Testing**: Vitest with Playwright browser testing

## 🏗️ Architecture

### Modern Development Patterns
- **Component-Based**: Modular Svelte components with clear separation of concerns
- **Type-Safe**: Comprehensive TypeScript types and interfaces
- **Error Handling**: Structured error handling with custom error classes
- **Logging System**: Environment-aware logging with different levels
- **Constants Management**: Centralized configuration and constants

### File Structure
```
src/
├── lib/
│   ├── components/          # Reusable Svelte components
│   │   ├── DateView.svelte     # Date-based pin view
│   │   ├── InteractiveMap.svelte  # Main map component
│   │   ├── MapComponent.svelte    # Core Leaflet integration
│   │   └── LocationPanel.svelte   # Pin creation/editing panel
│   ├── utils/              # Utility functions and classes
│   │   ├── pinStorage.ts      # Pin data management
│   │   ├── logger.ts          # Logging system
│   │   └── dateHelpers.ts     # Date formatting utilities
│   ├── types.ts            # TypeScript type definitions
│   └── constants.ts        # Application constants
├── routes/
│   └── +page.svelte        # Main application route
└── app.html               # HTML template
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm, pnpm, or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd shumpiss
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   Navigate to `http://localhost:5173`

### Build for Production

```bash
npm run build
npm run preview
```

## 🎮 Usage

### Creating Pins
1. Click anywhere on the map
2. Fill in the pin details (title is required)
3. Select one or more pin types
4. Click "Save Pin"

### Managing Pins
- **Edit**: Click the edit icon in pin popups
- **Delete**: Click the delete icon in pin popups
- **Navigate**: Use the Date view to click pins and navigate to them on the map

### Keyboard Shortcuts
- `Alt + M`: Switch to Map view
- `Alt + D`: Switch to Date view
- `Escape`: Close panels/modals

### Filtering (Date View)
- **Search**: Type to filter by pin title or description
- **Type Filter**: Click type badges to filter by pin type
- **Date Range Filter**: Use "After" and "Before" date inputs to filter by date range
- **Sort**: Toggle between newest and oldest first
- **Clear**: Clear all active filters

## 🧪 Development

### Available Scripts
- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run preview`: Preview production build
- `npm run check`: Run TypeScript and Svelte checks
- `npm run test`: Run unit tests
- `npm run format`: Format code with Prettier
- `npm run lint`: Check code formatting

### Key Development Features
- **Hot Module Replacement**: Instant updates during development
- **TypeScript Integration**: Full type checking and IntelliSense
- **Component Testing**: Browser-based testing with Playwright
- **Code Formatting**: Automatic formatting with Prettier
- **Error Logging**: Comprehensive error tracking and debugging

## 📱 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Leaflet](https://leafletjs.com/) for the excellent mapping library
- [OpenStreetMap](https://www.openstreetmap.org/) for the map data
- [SvelteKit](https://kit.svelte.dev/) for the amazing framework
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework