# YouTube Refined

A small Chrome extension that cleans up YouTube. You choose what to show and what to hide. It works right away, with no page reloads and no tracking.

![YouTube Refined popup](screenshots/preview.png)

## Why I made it

YouTube is full of things that pull your attention away. Shorts, extra shelves, promo cards, a crowded home feed. This extension lets you turn those off and set up the site the way you like it.

## Features

**Home feed**
- Set the video grid to anywhere from 1 to 10 columns.
- Hide "Explore more topics", membership promos, Mixes and the filter chips at the top.
- Filter out live streams, playlists or videos you have already watched.

**Shorts**
- Remove Shorts shelves, chips and cards.
- Shorts links are sent back to the home page.

**Navigation bar**
- Hide the Create button, Voice Search, the notification bell or the country code.
- Add a quick Settings shortcut next to your profile.
- Hide the thin mini-sidebar. The menu button still works.

**Watch page**
- Hide comments, the recommendation sidebar or end-screen cards.

Changes apply to every open YouTube tab straight away. Styles load early, so you don't see the page flicker.

## Built with

- Plain JavaScript, HTML and CSS
- Chrome Manifest V3
- Chrome storage API, to save your settings and sync them across tabs

There are no libraries and no build step.

## Installation

1. Download `youtube-refined-1.0.0.zip` from the [Releases](../../releases) page and unzip it.
2. Open `chrome://extensions` in Chrome.
3. Turn on **Developer mode** in the top right.
4. Click **Load unpacked** and pick the unzipped folder (the one with `manifest.json`).
5. Pin **YouTube Refined** from the puzzle-piece menu.

You need Chrome 109 or newer.

To run it from the source instead, clone this repo and load the `ext` folder in step 4.

## How to use it

1. Open YouTube.
2. Click the YouTube Refined icon in your toolbar.
3. Switch options on or off and move the column slider.

Your changes show up on the page as you make them.

![Settings in use](screenshots/settings-in-use.png)

## Project structure

```
ext/
├── manifest.json
├── icons/
└── src/
    ├── background.js    # extension background worker
    ├── content.js       # runs on YouTube pages
    ├── core/            # one file per feature (grid, shorts, filters...)
    └── popup/           # the settings popup
```

## Privacy

Everything stays on your computer. The extension makes no network calls and collects no data. It only asks for access to `youtube.com` and for storage, to remember your settings.

## License

Released under the [MIT License](LICENSE).
