/** @type {import('tailwindcss').Config} */

/**
 * COOKING ASSISTANT DESIGN TOKENS
 * ================================
 *
 * Design Philosophy: Warm & Inviting
 * This configuration defines a food-friendly, approachable design system
 * with warm tones, soft shadows, and generous rounded corners.
 *
 * COLOR MEANINGS:
 * - Primary (Terracotta): Main brand color, CTAs, links, key interactive elements
 * - Secondary (Amber): Complementary warmth, highlights, secondary actions
 * - Neutral (Warm Gray): Text, backgrounds, borders - uses warm undertones
 * - Cream: Warm off-white backgrounds for cozy feel
 * - Success (Sage): Positive feedback, completion states
 * - Warning (Honey): Caution states, attention-needed
 * - Error (Paprika): Errors, destructive actions, alerts
 */

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      /**
       * COLOR PALETTE
       * All colors chosen for warmth and food-appropriateness.
       * Each scale runs from lightest (50) to darkest (950).
       */
      colors: {
        // Primary: Terracotta - warm, earthy orange
        // Use for: buttons, links, key actions, brand elements
        primary: {
          50: '#fef6f3',
          100: '#fdeae4',
          200: '#fcd5c9',
          300: '#f9b8a3',
          400: '#f4906d',
          500: '#ec6b42',  // Main primary
          600: '#d94f28',  // Primary hover
          700: '#b53e1f',
          800: '#94351f',
          900: '#7a301f',
          950: '#42160b',
        },

        // Secondary: Amber/Golden - warm complement
        // Use for: secondary buttons, highlights, accent elements
        secondary: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',  // Bright accent
          500: '#f59e0b',  // Main secondary
          600: '#d97706',  // Secondary hover
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },

        // Neutral: Warm Gray - with slight brown/taupe undertones
        // Use for: text, backgrounds, borders, subtle elements
        neutral: {
          50: '#faf9f7',   // Lightest warm bg
          100: '#f5f3f0',  // Cards, alternate bg
          200: '#e8e4df',  // Borders, dividers
          300: '#d6d0c8',  // Disabled state borders
          400: '#b8b0a4',  // Placeholder text
          500: '#948a7b',  // Secondary text
          600: '#706658',  // Body text
          700: '#584f44',  // Headings
          800: '#433c34',  // Strong emphasis
          900: '#2e2924',  // Near black
          950: '#1a1815',  // Darkest text
        },

        // Cream: Warm off-white backgrounds
        // Use for: page backgrounds, cards, cozy atmospheric areas
        cream: {
          50: '#fffefa',
          100: '#fdfbf5',
          200: '#faf6ed',
          300: '#f5efe1',
          400: '#ede4d0',
          500: '#e2d5bb',
        },

        // Semantic: Success (Sage Green)
        // Use for: success messages, completed states, positive indicators
        success: {
          50: '#f4f9f4',
          100: '#e6f2e6',
          200: '#cee5cf',
          300: '#a6cfa8',
          400: '#76b279',
          500: '#539557',  // Main success
          600: '#407a43',
          700: '#356137',
          800: '#2d4e2f',
          900: '#264028',
          950: '#112313',
        },

        // Semantic: Warning (Honey Yellow)
        // Use for: warnings, attention-needed states, caution
        warning: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#eab308',  // Main warning
          600: '#ca8a04',
          700: '#a16207',
          800: '#854d0e',
          900: '#713f12',
          950: '#422006',
        },

        // Semantic: Error (Paprika Red)
        // Use for: errors, destructive actions, critical alerts
        error: {
          50: '#fef5f5',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#dc4545',  // Main error
          600: '#c23030',  // Error hover
          700: '#a12828',
          800: '#842626',
          900: '#6f2525',
          950: '#3c0f0f',
        },
      },

      /**
       * SHADOWS
       * Soft, diffused shadows for depth without harshness.
       * Uses warm-tinted shadows for cohesive feel.
       */
      boxShadow: {
        // Subtle elevation - cards, inputs
        'soft-sm': '0 1px 2px 0 rgba(46, 41, 36, 0.04)',

        // Default card shadow
        'soft': '0 2px 8px -2px rgba(46, 41, 36, 0.08), 0 2px 4px -2px rgba(46, 41, 36, 0.04)',

        // Elevated elements - dropdowns, modals
        'soft-md': '0 4px 12px -4px rgba(46, 41, 36, 0.12), 0 4px 6px -4px rgba(46, 41, 36, 0.06)',

        // High emphasis - active modals, popovers
        'soft-lg': '0 8px 24px -8px rgba(46, 41, 36, 0.16), 0 6px 12px -6px rgba(46, 41, 36, 0.08)',

        // Maximum elevation - toasts, tooltips
        'soft-xl': '0 16px 48px -12px rgba(46, 41, 36, 0.24), 0 12px 24px -8px rgba(46, 41, 36, 0.12)',

        // Inner shadow for inset elements
        'soft-inner': 'inset 0 2px 4px 0 rgba(46, 41, 36, 0.06)',

        // Focus ring shadow (for accessibility)
        'focus': '0 0 0 3px rgba(236, 107, 66, 0.3)',
      },

      /**
       * BORDER RADIUS
       * Generous rounded corners for approachability.
       */
      borderRadius: {
        'sm': '0.375rem',   // 6px - subtle rounding
        'DEFAULT': '0.5rem', // 8px - default
        'md': '0.625rem',   // 10px - cards, inputs
        'lg': '0.75rem',    // 12px - modals, larger cards
        'xl': '1rem',       // 16px - prominent elements
        '2xl': '1.25rem',   // 20px - hero sections
        '3xl': '1.5rem',    // 24px - maximum roundness
      },

      /**
       * TYPOGRAPHY
       * Font family pairings for warmth and readability.
       */
      fontFamily: {
        // Sans-serif for UI - clean and readable
        sans: [
          'Inter',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
        // Display font for headings - slightly more personality
        display: [
          '"DM Sans"',
          'Inter',
          'system-ui',
          'sans-serif',
        ],
        // Mono for code/technical content
        mono: [
          '"JetBrains Mono"',
          'ui-monospace',
          'SFMono-Regular',
          '"SF Mono"',
          'Menlo',
          'Consolas',
          '"Liberation Mono"',
          'monospace',
        ],
      },

      /**
       * FONT SIZES
       * Extended scale with appropriate line heights for readability.
       */
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1.15' }],
        '6xl': ['3.75rem', { lineHeight: '1.1' }],
      },

      /**
       * SPACING
       * Extended spacing scale for consistent layouts.
       */
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '30': '7.5rem',
      },

      /**
       * TRANSITIONS
       * Smooth, consistent animation timing.
       */
      transitionDuration: {
        DEFAULT: '200ms',
      },
      transitionTimingFunction: {
        DEFAULT: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
}
