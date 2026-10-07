# Mobile navigation update

The former twelve-card scrolling menu is now two sections with six destinations each.
Upgrades contains Gear, Skills, Artifacts, Cases, Brawlers and Smith. Adventure contains
Progress, Collection, Pets & prestige, Idle, Players and Showdown. Hero stats remain
available through the existing Hero HUD button and the Gear page's Stats tab.

Gear, Skills, Artifacts and Cases also have dedicated town shortcuts. They are hidden
outside town, during arena/rift play, while dead and while another page is open.
On short screens narrower than 760px, players use the compact menu instead of the
extra HUD shortcuts, preserving space for movement and combat controls. Cases retain
their count; gear, skill and artifact actions retain notification indicators. Icons
are cached static UI assets; this adds no 3D models or rendering passes.

## Verification

Browser checks used an isolated `?test=100` profile without spending materials or
opening cases. Both menu sections were measured at 360x640, 390x844, 568x320 and
844x390. Each had equal client/scroll heights, all buttons inside the panel and
viewport, and a minimum touch target of 44px. Screenshots were inspected in portrait
and landscape. The shortcut dock was adjusted to avoid the minimap and tutorial tips;
the boss pointer's top boundary respects the dock while it is present.

Gear, Skills, Artifacts and Cases opened through the shortcuts. Content pages retain
their independent scrolling, section selection retains keyboard focus and closing
a page returns to town. No browser console errors were observed.

`node tools/check_release.cjs`: 21 checks passed.
`node tools/check_test_mode.cjs`: 7 checks passed.

These are desktop browser viewport checks. Physical device touch interaction, notch
insets, thermal performance and iOS/Android packaged builds remain untested.
