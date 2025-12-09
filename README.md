# Blizlab Tools  
A suite of fast, privacy-friendly, browser-based tools for creators.

Blizlab is a collection of lightweight single-page web apps designed to run locally in your browser with no accounts, no tracking, and no data sent to servers. Each tool solves a very specific problem faced by video editors, photographers, designers, and content creators.

Explore them at: **https://blizlab.com**

---

## Contents
- [Apps](#apps)
  - [OctoFind](#octofind)
  - [BGone](#bgone)
  - [RetroIt](#retroit)
  - [Checksy](#checksy)
  - [MultiSearch](#multisearch)
- [Project Philosophy](#project-philosophy)
- [Tech Stack](#tech-stack)
- [Contributing](#contributing)
- [License](#license)

---

# Apps

## OctoFind
Smart multi-site search for creators who need fast reference images.

**What it does**
- Search once; open multiple stock-photo and reference sites at once.  
- Works with any websites you configure locally.  
- Ideal for mood boards, thumbnails, inspiration, research, and production design.

**Key features**
- Instant multi-tab search  
- Custom site list  
- Clean UI for rapid lookup  
- Privacy: runs fully client-side

---

## BGone
An advanced background-removal tool powered by U²-Net (AI segmentation) running entirely in your browser.

**What it does**
- Removes backgrounds from photos without uploading files to any server.  
- Offers fine-tuning with brushes to restore or erase details.  
- Outputs transparent PNGs for use in thumbnails, graphics, or compositing.

**Key features**
- Offline-capable  
- Precise brush tools  
- High-quality segmentation model  
- Drag-and-drop simplicity

---

## RetroIt
Instant retro conversion for modern images.

**What it does**
- Makes a modern photo look like an image from the early 1900s (or other eras).  
- Applies grain, blur, monochrome toning, and age artifacts.  
- Perfect for history videos, documentaries, and stylized projects.

**Key features**
- Tunable intensity  
- Non-destructive preview  
- Exports final JPG/PNG  
- Offline, private, fast

---

## Checksy
Handle and username availability checker for multiple platforms at once.

**What it does**
- Checks whether a username is free or taken across many social networks.  
- Simple, fast, no clutter.

**Key features**
- Editable platform list  
- Validates and normalizes input  
- Instant results  
- Fully client-side URLs (no API keys needed)

---

## MultiSearch
The original Blizlab tool.

**What it does**
- Lets you type a query and instantly open several curated sites (videos, photos, public-domain sources, PNG sites).  
- Useful for research, media sourcing, inspiration, and collecting assets.

**Key features**
- Light/Dark mode  
- Language toggle (EN/ES)  
- Enable/disable categories  
- Settings saved locally (localStorage)  
- Popup warning helper for browsers that block new tabs

---

# Project Philosophy

Blizlab is built on four principles:

1. **Speed** – Tools should load instantly and stay out of the user’s way.  
2. **Privacy** – Everything runs in the browser; no uploads, no accounts, no telemetry.  
3. **Simplicity** – Each app does one thing extremely well.  
4. **Customization** – Users can modify behavior (lists, settings, assets) without a backend.

These tools were originally developed to accelerate video production workflows and are now shared freely for other creators.

---

# Tech Stack

- Pure HTML/CSS/JavaScript  
- No frameworks  
- U²-Net for AI background removal (optimized for client-side inference)  
- IndexedDB & localStorage for optional persistent settings  
- Static hosting via GitHub Pages  
- Responsive UI (mobile-friendly)

---

# Contributing

Blizlab is a personal project but improvements and suggestions are welcome.

Ways to contribute:
- Bug reports  
- UI/UX suggestions  
- New site lists for OctoFind / MultiSearch  
- Optimization ideas  
- Documentation fixes

Open an Issue or submit a Pull Request.

---

# License

All tools and code are released under **CC BY-NC-SA 4.0** unless otherwise noted.  
You are free to remix, adapt, and share non-commercially with attribution and share-alike.

---

Made by **Alex** (@aaloyola37 @peorcaso).  
If you find the tools useful, consider [supporting on Ko-fi](https://ko-fi.com/)  
