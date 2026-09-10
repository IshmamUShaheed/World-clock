# Time Bridge

A standalone web app for comparing Stockholm, Ottawa, Dhaka and Kuala Lumpur. Anyone with the public link can choose a city and local date/time, see the equivalent moment in all four places, and generate a PNG to share in a Messenger group.

No Meta bot, account connection, database, or API key is required.

## Run locally

With Node.js 20 or newer:

```powershell
npm start
```

Then open `http://localhost:3000`.

The app is also entirely static, so `index.html`, `styles.css`, and `app.js` can be hosted directly by GitHub Pages, Netlify, Cloudflare Pages, Vercel, or any basic web host.

## How the group uses it

1. Put the hosted Time Bridge link in the Messenger group description or pin it in the conversation.
2. A person opens the link and selects the reference city.
3. They choose the local date and time. All other clocks update instantly.
4. **Copy app link** copies a URL that preserves the selected city and moment.
5. **Screenshot & share** creates a clean PNG. On a supported phone, **Share image** opens the system share sheet; choose Messenger and the group. On other browsers, download the PNG and attach it manually.

## Included

- Live and planning modes
- Correct IANA timezone and daylight-saving conversion
- Clickable reference-city cards
- Day/date, UTC offset, day-shift, and working-hours hints
- URL state for sharing the exact selected moment
- Native Canvas PNG generation with no screenshot library
- Web Share support with a download fallback
- Responsive desktop and mobile layouts
- No runtime dependencies

## Publishing the link

### Fastest: Netlify Drop

Create a folder containing `index.html`, `styles.css`, `app.js`, and `site.webmanifest`, then drag that folder into Netlify Drop. Netlify provides a public HTTPS link that can be renamed and pasted into Messenger.

### GitHub Pages

Push these files to a GitHub repository, open **Settings → Pages**, choose the repository branch, and publish from the repository root. Use the generated Pages URL as the group link.

### Other static hosts

For Cloudflare Pages or Vercel, import the repository, use no build command, and publish the repository root.

## Useful next improvements

- Find and highlight overlapping working hours automatically.
- Allow people to add, remove, and reorder cities.
- Save named moments such as “Friday family call.”
- Generate `.ics` calendar invitations.
- Add meeting voting with two or three candidate times.
- Add Bengali, Swedish, French, and Malay translations.
- Add 12/24-hour display and configurable working hours.
