/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        zen: {
          background: '#F9F6F0', // Very soft, warm off-white matching the new design
          surface: '#FFFFFF', // Clean white for cards
          primary: '#8FA491', // Soft sage green for primary actions/accents
          primaryHover: '#798E7B',
          text: '#334155', // Slate 700 for main text (softer than black)
          textMuted: '#64748B', // Slate 500 for secondary text
          border: '#E2E8F0', // Slate 200 for soft borders
          line: '#B8A898', // Warm brown for tree connection lines (matching image 1)
          danger: '#E09891', // Soft red for delete/cancel
          // Node role colors (matching design images)
          nodeAncestor: '#F5EDD8',       // Warm beige for grandparents/ancestors
          nodeAncestorBorder: '#C9B99A', // Darker beige border
          nodeParent: '#B8D4B2',         // Soft sage green for parents
          nodeParentBorder: '#7FA87A',   // Darker green border for parents
          nodeRoot: '#F5EDD8',           // Same beige but larger/highlighted for "Tú"
          nodeRootBorder: '#8FA491',     // Sage green border for root
          nodeChild: '#F5EDD8',          // Warm beige for children
          nodeChildBorder: '#C9B99A',    // Same beige border
          nodePartner: '#B8D4B2',        // Same green as parent for partners
          nodePartnerBorder: '#7FA87A',  // Same green border
        }
      },
      fontFamily: {
        zen: ['Inter', 'system-ui', 'sans-serif'], // We'll import Inter in styles.css
      },
      boxShadow: {
        'zen': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        'zen-hover': '0 10px 25px -5px rgba(0, 0, 0, 0.08)',
      }
    },
  },
  plugins: [],
}
