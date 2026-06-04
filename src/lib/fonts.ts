// Popular sports/football jersey fonts
export const JERSEY_FONTS = [
    // Classic Sports Fonts
    { value: 'Anton', label: 'Anton - Bold & Classic', category: 'Classic' },
    { value: 'Bebas Neue', label: 'Bebas Neue - Athletic', category: 'Classic' },
    { value: 'Oswald', label: 'Oswald - Professional', category: 'Classic' },
    { value: 'Roboto Condensed', label: 'Roboto Condensed - Modern', category: 'Classic' },

    // Bold & Impact Fonts
    { value: 'Russo One', label: 'Russo One - Heavy Impact', category: 'Bold' },
    { value: 'Archivo Black', label: 'Archivo Black - Extra Bold', category: 'Bold' },
    { value: 'Black Ops One', label: 'Black Ops One - Military', category: 'Bold' },
    { value: 'Alfa Slab One', label: 'Alfa Slab One - Chunky', category: 'Bold' },
    { value: 'Titan One', label: 'Titan One - Powerful', category: 'Bold' },
    { value: 'Fugaz One', label: 'Fugaz One - Bold Italic', category: 'Bold' },
    { value: 'Passion One', label: 'Passion One - Strong', category: 'Bold' },

    // Collegiate & Traditional
    { value: 'Graduate', label: 'Graduate - College Style', category: 'Collegiate' },
    { value: 'Saira Condensed', label: 'Saira Condensed - Varsity', category: 'Collegiate' },
    { value: 'Barlow Condensed', label: 'Barlow Condensed - Team', category: 'Collegiate' },
    { value: 'Staatliches', label: 'Staatliches - Retro', category: 'Collegiate' },

    // Note: Custom local fonts (Old Sport Athletic, Jersey M54, etc.) 
    // require actual font files. They have been removed until files are provided.
    // Users can still upload their own TTF/WOFF files via the font selector UI.

    // Modern & Futuristic
    { value: 'Orbitron', label: 'Orbitron - Futuristic', category: 'Modern' },
    { value: 'Exo 2', label: 'Exo 2 - Tech Sport', category: 'Modern' },
    { value: 'Rajdhani', label: 'Rajdhani - Sharp & Clean', category: 'Modern' },
    { value: 'Teko', label: 'Teko - Minimalist', category: 'Modern' },
    { value: 'Quantico', label: 'Quantico - Geometric', category: 'Modern' },
    { value: 'Audiowide', label: 'Audiowide - Digital', category: 'Modern' },
    { value: 'Space Grotesk', label: 'Space Grotesk - Contemporary', category: 'Modern' },
    { value: 'Chakra Petch', label: 'Chakra Petch - Tech', category: 'Modern' },
    { value: 'Syne', label: 'Syne - Modern Sans', category: 'Modern' },

    // Display & Stylish
    { value: 'Bungee', label: 'Bungee - Urban Style', category: 'Display' },
    { value: 'Bungee Inline', label: 'Bungee Inline - Outlined', category: 'Display' },
    { value: 'Bungee Shade', label: 'Bungee Shade - 3D Effect', category: 'Display' },
    { value: 'Righteous', label: 'Righteous - Curvy Bold', category: 'Display' },
    { value: 'Concert One', label: 'Concert One - Rounded', category: 'Display' },
    { value: 'Lilita One', label: 'Lilita One - Friendly Bold', category: 'Display' },
    { value: 'Squada One', label: 'Squada One - Square', category: 'Display' },
    { value: 'Gruppo', label: 'Gruppo - Casual Athletic', category: 'Display' },
    { value: 'Press Start 2P', label: 'Press Start 2P - Gaming', category: 'Display' },

    // International & Versatile
    { value: 'Kanit', label: 'Kanit - Thai Modern', category: 'International' },
    { value: 'Saira', label: 'Saira - Global Sports', category: 'International' },
    { value: 'Khand', label: 'Khand - Light & Bold', category: 'International' },
    { value: 'Barlow', label: 'Barlow - Universal', category: 'International' },
    { value: 'Pathway Extreme', label: 'Pathway Extreme - Variable', category: 'International' },

    // Hand-drawn & Unique
    { value: 'Permanent Marker', label: 'Permanent Marker - Hand Drawn', category: 'Unique' },
];

export const FONT_CATEGORIES = [
    'All',
    'Classic',
    'Bold',
    'Collegiate',
    'Modern',
    'Display',
    'International',
    'Unique'
];

export const getFontsByCategory = (category: string) => {
    if (category === 'All') return JERSEY_FONTS;
    return JERSEY_FONTS.filter(font => font.category === category);
};
