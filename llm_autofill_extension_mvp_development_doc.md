# LLM Autofill Extension — MVP Development Doc

## 1) Purpose

Help users quickly fill non‑standard web forms (e.g., passport info, address, credit card) by:

* Detecting form fields even when sites misuse attributes.
* Using an LLM to map detected fields to a single local profile’s keys.
* Filling values with one click while preserving privacy.

Example Use Case:
1. user set up their info with the extension, e.g., passport_num = 123445, all info are stored locally 
2. user clicks one button to let LLM model auto fill forms 
3. Extension calls LLM model to match form fields with local variable name, e.g., passport_num, e.g., `{"Passport Number":"passport_num"}`
4. based on LLM model output, the extension auto fill forms

---

## 2) Scope & Assumptions (MVP)

* **Single local profile** only (e.g., `passport_num`, `first_name`, `last_name`, address fields).
* **Form-only + form-like blocks**: operate on elements inside <form> and on obvious form-like containers (e.g., a <div> grouping multiple inputs) outside <form>.
* **Manual trigger**: we inject an **“Auto Fill with LLM”** button alongside each detected form; user clicks to run.
* **User Provide LLM API Key**: User sets up LLM API key and select model, e,g., open ai gpt-5-mini
* **LLM input**: send the **form’s HTML** (structure only) to the LLM; no extra heuristics, no nearby-text scanning.
* **LLM output**: mapping from form fields → profile keys.

---

## 3) Primary User Stories

1. As a user, I can save my passport and address info locally.
2. When a page has a `<form>`, I see an **Auto Fill with LLM** button next to it.
3. Clicking the button fills the form based on the LLM’s mapping.

**Acceptance:** On a sample set of forms, the majority of key fields (passport + address) are filled correctly after one click.

---

## 4) High‑Level Design

**Components**

* **Popup UI:** Minimal profile editor and a global on/off toggle.
* **Background (Service Worker):** Relays LLM requests and holds provider config.
* **Content Script:** Detects <form> elements and form-like blocks (containers with multiple inputs), injects Auto Fill with LLM buttons, extracts the HTML of the chosen target (form or container), sends it to background, and fills fields from the returned mapping.
* **LLM Service:** Takes form HTML and returns `{selectorOrKey → profileKey}`.
* **Local Storage:** Stores the single profile.

**Data Flow**

1. On page load (or on demand), content script finds forms and form-like blocks and adds a button next to each.
2. User clicks **Auto Fill with LLM**.
3. Content script captures the **form’s HTML** (form or container), sends it to background.
4. Background calls LLM; receives mapping.
5. Content script fills inputs and dispatches standard events as needed.

---

## 5) Technologies & Browser APIs

* **Manifest V3**.
* **APIs:** `content_scripts`, `chrome.scripting` (for on-click injections), `chrome.runtime` messaging, `chrome.storage` (local), `chrome.action` (if we want a toolbar toggle), optional `chrome.commands` for a shortcut.
* **Permissions:** minimal host permissions.
* **UI:** Lightweight popup (TypeScript + minimal UI lib or vanilla).
* **LLM:** Simple HTTP `fetch` from the service worker to your chosen provider.
* **No i18n**, **no preview**, **no undo**.

---

## 6) Data Model (MVP)

* **Profile (single):** flat key/value map (user can customize both keys and values).

  * Example keys: `passport_num`, `passport_country`, `first_name`, `last_name`, `addr_line1`, `addr_line2`, `city`, `state`, `postal_code`, `country`, `phone`, `email`.
* **Network:** No PII leaves the device.

---

## 7) Form Detection & Payload

**Detection**

* Find all `<form>` elements on the page and form-like blocks -- containers (e.g., <div>, <section>, <fieldset>) outside any <form> that include ≥ 2 eligible inputs (input, textarea).
* For each form, inject a small inline button **Auto Fill with LLM** (positioned above or below the form).

**Payload to LLM**

* Send the form’s **HTML structure** (e.g., sanitized `form.outerHTML` with current values stripped).
* Optional: include a flat list of candidate input names/ids/types found in the form.
* Do **not** include any user-entered values; only structure/attributes.

**Constraints**

* Ignore fields outside `<form>`.
* Ignore cross-origin iframes and shadow DOM in v1.

## 8) Mapping & Filling

**What we send to the LLM**

* The form’s HTML string (e.g., `form.outerHTML`) and the list of available **profile keys** (like `passport_num`, `first_name`, etc.).

**What we want back**

* A tiny JSON mapping that tells us which field matches which profile key, using the simplest identifiers that already exist in the HTML.
* Prefer `id` if present; otherwise use `name`; if neither exists, an **index** within the form is acceptable.

**Output format example**

```json
{
  "id:passport_number": "passport_num",
  "name:surname": "last_name",
  "name:givenName": "first_name",
  "name:address1": "addr_line1",
  "name:zip": "postal_code"
}
```

Here, each **left-hand side** is just a way to point to a specific input (by `id`, `name`, or index). The **right-hand side** is one of our profile keys.

**How the extension fills**

1. For each mapping entry, locate the input:

   * If the key starts with `id:`, find the element with that `id`.
   * If it starts with `name:`, find the element with that `name`.
   * If it starts with `index:`, pick the N‑th input inside the form.
2. Put the value from the local profile into the input field.

**Notes**

* If a field isn’t in the mapping, we skip it.

---

## 9) Privacy & Security

* **PII storage:** `chrome.storage.local` only. Optional encryption using WebCrypto (future), but not required for MVP.
* **Network policy:** send **metadata only** to LLM (form HTML/structure), never the user’s values.
* **User controls:** manual **Auto Fill with LLM** trigger only

