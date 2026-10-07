# Adventure hero redesign

Original reference art generated with OpenAI image generation, 7 October 2026.
These are image-to-3D references, not finished 3D models. The live hero manifest
remains unchanged until a textured, animated mesh passes the game preview.

## Art direction

Natural faces and skin-colored noses; heroic stylized adventure proportions;
layered leather, cloth, weathered metal and restrained rune accents. Distinct
silhouettes and class palettes must remain legible in the overhead combat view.
Avoid baby mascot proportions, clown noses, baseball caps, plastic surfaces,
excessive bloom and photoreal pores. Keep the existing gameplay and hero IDs.

## Pip reference prompt

Single full-body image-to-3D character reference for Rune Pathfinder Pip, an
original premium adventure RPG mobile shooter hero. Natural skin-colored small
nose, calm adult heroic face, dark hazel eyes, swept chestnut hair, stylized
heroic proportions of approximately 4.5 heads tall. Teal cloth tunic, brown
layered leather cuirass and bracers, antique brass fasteners, azure rune clasp,
short shoulder cape, sturdy leather boots. Painterly albedo and broad readable
material shapes, crisp phone-readable details. Symmetrical relaxed A-pose,
empty hands, arms separated from torso, separated legs, entire figure visible.
Transparent background, no floor, shadows, scenery, text or logo. No red nose,
red cheeks, clown, huge eyes, baseball cap, oversize ears, plastic toy shine,
photoreal pores or baby body.

Mode: new image, transparent background. File: `pip-reference.png`.

## Mesh acceptance

- Actual textured GLB, complete front/back/side silhouette and natural face.
- Aim for 8,000–12,000 triangles and one 1024px texture; measure actual output.
- Normalize to the game's height convention; verify feet contact, orientation,
  hand grip, leg animation and all five equipment overlays.
- Test studio and combat views, desktop and narrow mobile layout. Physical
  iOS/Android performance requires device testing; desktop FPS is insufficient.
- Keep meshes lazy loaded and retain the existing fallback on load failure.
- Use the approved total $12 Hugging Face budget; validate one pilot before
  commissioning the remaining roster. Current balance is not verified.

## Generator checks

Hugging Face account: Casper565 (Pro). On 7 October, authenticated access to
`facebook/dinov3-vitl16-pretrain-lvd1689m` was denied, while the TRELLIS.2 and
original `microsoft/TRELLIS-image-large` pipeline repositories were readable.
The original TRELLIS pipeline uses DINOv2 and is the ungated pilot alternative.
The free community demo returned an uninformative upstream exception.
CPU job `6ac66b76e7a0dae8a277cc07` verified that the official TRELLIS container
has the required packages and that a generated artifact can be downloaded
through a temporary Gradio share. Only export files are shared.
