---
name: Raga Dynamic Fitness System
colors:
  surface: '#0f131c'
  surface-dim: '#0f131c'
  surface-bright: '#353942'
  surface-container-lowest: '#0a0e16'
  surface-container-low: '#181c24'
  surface-container: '#1c2028'
  surface-container-high: '#262a33'
  surface-container-highest: '#31353e'
  on-surface: '#dfe2ee'
  on-surface-variant: '#e3beb6'
  inverse-surface: '#dfe2ee'
  inverse-on-surface: '#2c3039'
  outline: '#aa8982'
  outline-variant: '#5b403a'
  surface-tint: '#ffb4a3'
  primary: '#ffb4a3'
  on-primary: '#630f00'
  primary-container: '#ff5a36'
  on-primary-container: '#5a0c00'
  inverse-primary: '#b52603'
  secondary: '#4edea3'
  on-secondary: '#003824'
  secondary-container: '#00a572'
  on-secondary-container: '#00311f'
  tertiary: '#c0c1ff'
  on-tertiary: '#1000a9'
  tertiary-container: '#8285ff'
  on-tertiary-container: '#0e009a'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdad2'
  primary-fixed-dim: '#ffb4a3'
  on-primary-fixed: '#3d0600'
  on-primary-fixed-variant: '#8c1900'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#e1e0ff'
  tertiary-fixed-dim: '#c0c1ff'
  on-tertiary-fixed: '#07006c'
  on-tertiary-fixed-variant: '#2f2ebe'
  background: '#0f131c'
  on-background: '#dfe2ee'
  surface-variant: '#31353e'
typography:
  display-timer:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 52px
  display-timer-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '800'
    lineHeight: 44px
  headline-metric:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 36px
  headline-metric-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 30px
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 24px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
  label-xs:
    fontFamily: Plus Jakarta Sans
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 12px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  margin: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
---

## Brand & Style
The design system delivers an approachable, encouraging, and distraction-free workout logging experience tailored for Indonesian fitness enthusiasts. Rather than adopting an intimidating, ultra-aggressive bodybuilder look (dark grunge, harsh neon yellows, sharp industrial bevels), this system champions an optimistic, humane, and clean lifestyle aesthetic. 

Key attributes:
- **Energetic & Hangat (Warm)**: Inviting coral and sunset hues provide vitality without inducing visual stress during intense exertion.
- **Ramah Pemula (Beginner-Friendly)**: Clear Indonesian terminology, high-legibility typographic hierarchies, and non-judgmental tracking paradigms.
- **Ergonomi Satu Tangan (One-Handed Usability)**: Thumb-zone focused interactions structured for use at arm's length on gym benches, treadmills, or home mats.
- **Tactile & Modern**: Smooth pill geometry, deep tap feedback, soft directional elevation, and high-contrast numerical readouts.

## Colors
The default palette defaults to dark mode ("Gym Mode") to maximize OLED battery longevity and eliminate screen glare in low-lit gym studios, while retaining full contrast parity for daytime light mode.

### Roles & System Accents
- **Primary Accent (`#FF5A36`)**: Vibrant Sunset Coral. Drives active sessions, primary action buttons ("Mulai Latihan", "Selesai"), active tab indicators, and current set focus states.
- **Secondary / Success Accent (`#10B981`)**: Mint Jade Green. Applied strictly to completed sets, PR (Rekor Pribadi) highlights, streak trackers, and checkmark toggles.
- **Tertiary / Rest Accent (`#6366F1`)**: Electric Indigo. Governs rest intervals, countdown clocks, stopwatch bars, and recovery advice cards.
- **Neutral Dark Tiers (Default Canvas)**:
  - Base Canvas: `#0B0F17` (Deep Obsidian Slate)
  - Surface Card (Level 1): `#182234` (Deep Navy Charcoal)
  - Surface Card (Level 2 / Interactive): `#1E293B` (Lifted Slate)
  - Subtle Borders & Dividers: `#334155`
  - Text High-Emphasis: `#F8FAFC`
  - Text Medium-Emphasis: `#94A3B8`
- **Neutral Light Tiers (Outdoor/Day Mode)**:
  - Base Canvas: `#F8FAFC`
  - Surface Card: `#FFFFFF`
  - Subtle Borders & Dividers: `#E2E8F0`
  - Text High-Emphasis: `#0F172A`
  - Text Medium-Emphasis: `#64748B`

## Typography
Plus Jakarta Sans was chosen for its geometric foundation, open counters, and Indonesian origin, bringing an authentic and contemporary voice to the app. 

### Typographic Principles:
- **Tabular Figures for Numerical Data**: All weight inputs (`kg`), repetition counts (`reps`), rest clocks (`01:30`), and progress metrics must implement `font-variant-numeric: tabular-nums` to eliminate jitter during active stepping or stopwatch countdowns.
- **Glanceable Legibility**: Display weights and rep tallies must be readable at 1 meter arm's length while a phone rests on a workout mat.
- **Strict Indonesian Localization**:
  - Sets $\rightarrow$ "Set"
  - Weight $\rightarrow$ "Beban (kg)"
  - Reps $\rightarrow$ "Repetisi"
  - Rest $\rightarrow$ "Istirahat"
  - Previous $\rightarrow$ "Sesi Lalu"
  - Streak $\rightarrow$ "Runtutan"

## Layout & Spacing
The layout follows a mobile-first, thumb-zone hierarchy designed specifically for progressive web applications (PWAs) operating within device safe areas (`env(safe-area-inset-bottom)`).

### Grid & Ergonomic Rhythm
- **Primary Viewport**: Max container width of 480px centered on viewports exceeding mobile screens. Fluid full-width on smartphones with fixed 16px lateral padding.
- **Vertical Hierarchy**:
  - Top Zone: Header bar, exercise selector, and offline badge status.
  - Middle Zone: Scrollable list of exercises and set tables.
  - Bottom Thumb Zone: Sticky action buttons, stepper modules, and rest timer drawer anchored in the lower 35% of the viewport.
- **Touch Target Integrity**: No interactive element (stepper button, set check, pill selector) shall be under 48x48px in actual hit boundary, ensuring high error tolerance when hands are trembling post-set.

## Elevation & Depth
Depth is built using tactile tonal surface shifts paired with colored ambient glows rather than aggressive drop shadows.

- **Level 0 (Kanvas Dasar)**: `#0B0F17`. Deep flat base surface.
- **Level 1 (Kartu Konten)**: `#182234` enclosed with a 1px border of `#334155` at 60% opacity. Casts a soft shadow: `0px 4px 16px rgba(0, 0, 0, 0.3)`.
- **Level 2 (Modul Aktif & Stepper)**: `#1E293B`. Interactive elements inside cards. Pressed state shifts depth via an inner hairline shadow (`inset 0px 2px 4px rgba(0, 0, 0, 0.4)`).
- **Floating Modals & Rest Drawer**: `#182234` overlay with backdrop blur (`backdrop-filter: blur(12px)`) and a subtle brand glow `0px -8px 24px rgba(255, 90, 54, 0.12)`.

## Shapes
A roundedness factor of 2 provides a balanced, organic form factor that feels approachable and friendly without looking juvenile.

- Standard card surfaces and dialog containers utilize `rounded-2xl` (16px to 20px).
- Primary buttons, stepper toggles, and day tracking pills use fully circular or pill shapes (`rounded-full` / 9999px).
- Input chips, numerical stepper buttons, and set counter badges use unified `rounded-xl` (12px) styling.

## Components

### 1. Tombol Utama & Sekunder (Buttons)
- **Tombol Aksi Utama (CTA)**: Full-width container, minimum height 54px. Background: `#FF5A36`, Text: `#FFFFFF` (16px, semibold). Pressed state: scales to 0.98 with tactile haptic feedback.
- **Tombol Sekunder**: Pill container, height 44px. Background: `rgba(255, 90, 54, 0.12)`, Text: `#FF5A36`, Border: `1px solid rgba(255, 90, 54, 0.24)`.
- **Tombol Hantu (Ghost Icon)**: 48x48px square touch zone with 24px icon. Used for deletion, historical stats, and settings.

### 2. Baris Set Latihan (Set Row Stepper)
- Structured in a 4-column horizontal row:
  1. **Indikator Set**: Badge pill displaying "1", "2", "W" (Pemanasan), or "D" (Drop set).
  2. **Beban (kg)**: Counter displaying current weight with small secondary label underneath showing historical reference (contoh: "Lalu: 20 kg"). Includes `[-]` and `[+]` 40px tap zones for quick adjustment.
  3. **Repetisi**: Stepper display with single tap increments.
  4. **Penyelesaian (Checkmark Target)**: 48x48px circular checkmark. Incomplete state is `#1E293B` with border `#334155`. Completed state transitions instantaneously to `#10B981` with white checkmark and initiates the rest timer.

### 3. Bilah Timer Istirahat (Rest & Stopwatch Bar)
- **Collapsed Floating State**: Anchored above the bottom navigation/safe area. Features an electric indigo (`#6366F1`) animated progress bar line, remaining time readout (e.g., "Istirahat: 01:15"), and "+30d" quick-add button.
- **Expanded Drawer**: Draggable bottom sheet with prominent `display-timer` numbers, vibration alert toggle ("Getar saat selesai"), and "Lewati" (Skip) pill button.

### 4. Pelacak Hari Mingguan (Day Pills)
- 7-column horizontal segmented strip representing Monday to Sunday ("Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min").
- Completed days feature a solid `#10B981` micro-dot beneath the day abbreviation.
- Active workout day highlighted with a Coral `#FF5A36` background ring.

### 5. Lencana Sinkronisasi Offline (Status Badges)
- Discreet top status capsule (Height: 24px, Padding: 4px 10px, Rounded: 9999px):
  - *Tersimpan offline*: Neutral slate background with an offline cloud icon.
  - *Sinkronisasi...*: Subtle amber pulse.
  - *Terhubung*: Mint green dot with transient fade-out confirmation.