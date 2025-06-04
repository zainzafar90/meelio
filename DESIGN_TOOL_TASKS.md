# Motion Design Tool Tasks

This document lists tasks for building a motion design tool that loads a JSON export from Figma. The project uses **PixiJS** for rendering and **GSAP** for animation. Each task assumes a single-post structure with flat layers linked by parent IDs.

## 1. Project Setup

- Review existing components and catalog reusable parts.
- Add `pixi.js` and `gsap` packages to the repo.
- Create a centralized animation module that wraps GSAP for common effects.

## 2. Rendering Engine

- Initialize a PixiJS application that mounts within the existing app shell.
- Build a layer manager that stores items in a flat array referencing parent IDs.
- Provide a function to convert the post structure into PixiJS display objects.

## 3. Editing Tools

- Implement selection, drag, resize, and rotate tools.
- Use GSAP for animated transformations when users manipulate elements.
- Allow group editing based on parent IDs.

## 4. Timeline and Animation

- Create a timeline editor UI to add keyframes and control playback.
- Sync GSAP timelines with the PixiJS stage for smooth previews.
- Enable saving and loading of animation data in JSON format.

## 5. Asset Management

- Add a loader for images, fonts, and videos.
- Cache assets in memory for fast rendering.
- Link assets to posts using unique identifiers.

## 6. Export and Sharing

- Provide export options for videos or GIFs using PixiJS renderer and GSAP's ticker.
- Allow sharing of designs via unique links referencing the single-post hierarchy.

## 7. Testing and Performance

- Write unit tests for the rendering and animation utilities.
- Profile rendering performance and optimize PixiJS settings.
- Ensure GSAP animations remain smooth with many layers.

