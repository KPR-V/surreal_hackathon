# IPA Platform - Intellectual Property Asset Management

A comprehensive platform for registering, managing, and trading intellectual property assets on the blockchain, featuring Tomo Wallet integration and Story Network compatibility.

## 🏗️ Project Architecture

### Core Structure
\`\`\`
├── app/                          # Next.js App Router pages
│   ├── dashboard/               # Protected dashboard routes
│   │   ├── marketplace/         # IPA marketplace
│   │   ├── ai-chat/            # AI content generation
│   │   ├── my-account/         # User account management
│   │   ├── add-ipa/            # IPA registration wizard
│   │   └── secondary-market/   # Token trading marketplace
│   ├── globals.css             # Global styles with theme variables
│   ├── layout.tsx              # Root layout with providers
│   └── page.tsx                # Landing/intro page
├── components/                  # Reusable UI components
│   ├── navigation/             # Navigation components
│   ├── providers/              # Context providers
│   └── ui/                     # shadcn/ui components
├── config/                     # Configuration files
│   └── theme.ts               # Centralized theme configuration
├── hooks/                      # Custom React hooks
│   └── use-optimized-search.ts # High-performance search hook
└── lib/                        # Core business logic
    ├── story/                  # Story Network integration
    └── wallet/                 # Tomo Wallet integration
\`\`\`

## 🚀 Features

### Core Functionality
- **IPA Registration**: Step-by-step wizard for registering intellectual property
- **Marketplace**: Browse and license IP assets with advanced filtering
- **AI Content Generation**: Create images, videos, and audio using AI
- **Secondary Market**: Trade license and royalty tokens
- **Account Management**: Track assets, revenue, and token holdings

### Technical Features
- **Optimized Search**: Debounced search with fuzzy matching and virtualization
- **Wallet Integration**: Seamless Tomo Wallet connectivity
- **Story Network**: Blockchain-based IP registration and management
- **Responsive Design**: Mobile-first approach with floating navigation
- **Performance**: Virtual scrolling for large datasets

## 🛠️ Technology Stack

- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS with custom theme system
- **UI Components**: shadcn/ui with custom extensions
- **Animations**: Framer Motion for smooth interactions
- **Search**: Fuse.js for fuzzy search capabilities
- **Virtualization**: react-window for performance
- **Blockchain**: Tomo Wallet + Story Network integration

## 📦 Installation

1. **Clone the repository**
   \`\`\`bash
   git clone <repository-url>
   cd ipa-platform
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   # or
   yarn install
   \`\`\`

3. **Set up environment variables**
   \`\`\`bash
   cp .env.example .env.local
   \`\`\`
   Configure the following variables:
   - `NEXT_PUBLIC_API_URL`: API endpoint
   - `STORY_NETWORK_API_KEY`: Story Network API key
   - `TOMO_WALLET_CONFIG`: Tomo Wallet configuration

4. **Run the development server**
   \`\`\`bash
   npm run dev
   # or
   yarn dev
   \`\`\`

## 🎨 Theme Configuration

The platform uses a centralized theme system located in `config/theme.ts`. This allows for easy customization of:

- **Colors**: Primary, secondary, and accent colors
- **Typography**: Font families and sizes
- **Spacing**: Consistent spacing scale
- **Border Radius**: Rounded corner styles
- **Shadows**: Elevation and depth effects

### Customizing the Theme

\`\`\`typescript
// config/theme.ts
export const themeConfig = {
  colors: {
    primary: {
      500: '#f97316', // Change primary orange color
      // ... other shades
    },
    // ... other color configurations
  }
}
\`\`\`

## 🔌 Integrations

### Tomo Wallet
- **Location**: `lib/wallet/tomo-wallet.ts`
- **Features**: Connect, disconnect, balance checking, transaction signing
- **Usage**: Automatic connection persistence and error handling

### Story Network
- **Location**: `lib/story/story-network.ts`
- **Features**: IPA registration, license minting, royalty management
- **Usage**: Blockchain-based IP asset management

## 🔍 Search & Performance

The platform implements a high-performance search system:

- **Debouncing**: 300ms delay to prevent excessive API calls
- **Fuzzy Search**: Fuse.js with 0.3 threshold for flexible matching
- **Virtualization**: react-window for rendering large lists
- **Preprocessing**: Normalized search strings for faster matching

## 📱 Navigation

The platform features a floating dock navigation system:
- **Desktop**: Animated dock with hover effects
- **Mobile**: Collapsible menu with smooth animations
- **Position**: Fixed at bottom center for easy access

## 🧪 Development

### Adding New Components
1. Create component in appropriate directory
2. Export from index file if needed
3. Add to Storybook if applicable

### Modifying Theme
1. Update `config/theme.ts`
2. Restart development server
3. Changes apply globally

### Adding New Integrations
1. Create service in `lib/` directory
2. Add TypeScript interfaces
3. Implement error handling
4. Add to providers if needed

## 🚀 Deployment

### Vercel (Recommended)
\`\`\`bash
npm run build
vercel --prod
\`\`\`

### Docker
\`\`\`bash
docker build -t ipa-platform .
docker run -p 3000:3000 ipa-platform
\`\`\`

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Contact the development team
- Check the documentation wiki
\`\`\`

