# NavJevan: Hourly Care Survey

A single scrolling survey page (questions appear one after another, top to bottom) for validating demand for on-demand, hourly caregivers.
Plain HTML, CSS and JavaScript. No build step.

## Structure

```
quickcare-survey/
├── images/        # logos, photos, backgrounds
├── index.html     # page shell (header, progress line, card container)
├── script.js      # questions, validation, submission
├── style.css      # healthcare theme and design tokens
└── README.md
```

## Edit the questions

Open `script.js` and find the `pages` array. Each page has a `title`, a `sub` and a list of `qs`.

| type    | use for                              | needs                      |
|---------|--------------------------------------|----------------------------|
| `radio` | single choice                        | `opts`                     |
| `check` | multiple choice                      | `opts`                     |
| `scale` | 1 to 5 rating                        | `lo`, `hi`, `hint`         |
| `text`  | long answer (add `optional:true`)    | none                       |
| `vip`   | early-access Yes/No plus contact box | none                       |

To add a question, copy an existing object and give it a new `id` such as `q10`.
If you add a question, also add it to your Apps Script sheet columns.

## Change the look

All colors are CSS variables at the top of `style.css` (`--teal`, `--mint`, `--pulse`, and so on).

## Connect Google Sheets (Apps Script)

1. In `script.js`, set `SCRIPT_URL` to your deployed web app URL (ends in `/exec`).
2. Deploy the script as a web app with access set to **Anyone**.
3. The page sends a form-encoded POST with `q1` to `q9`, `q9_contact` and `submittedAt`.
   `q5` holds the selected options joined with ` | `.

Minimal `doPost`:

```js
function doPost(e) {
  const p = e.parameter;
  SpreadsheetApp.getActiveSheet().appendRow([
    p.submittedAt, p.q1, p.q2, p.q3, p.q4, p.q5, p.q6, p.q7, p.q8, p.q9, p.q9_contact
  ]);
  return ContentService.createTextOutput('ok');
}
```

## Deploy

Push the folder to GitHub and import it in Vercel. No settings are needed.

## Icons and themes
Each question in `script.js` has `icon`, `topic` and `tone`. Icons live in the `ICONS` object
(pulse, pregnant, gauge, phone, elder, shield, baby, steth, gift). Tones are `teal, coral, indigo, amber, rose, green`
and are defined in `style.css`.

## Name field
Question `name` (type `short`) is required. To make it optional, add `optional:true` and remove the check in `cont()`.
In the Google Sheet, add a **Name** header in the column after "Q9 Contact" and add `p.name || ''` at the end of the `appendRow` list in Apps Script.
