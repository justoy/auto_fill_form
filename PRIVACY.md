Seamless Form AutoFiller — Privacy Policy

This Privacy Policy describes how the Seamless Form AutoFiller Chrome extension (the “Extension”) handles information. We value your privacy and design the Extension to minimize data collection and processing.

Information Processed by the Extension (not collected by the developer)
- Profile data you enter: Stored locally in your browser via Chrome’s `chrome.storage.local`. The developer does not receive or have access to this data. It remains on your device unless you export it yourself.
- Form structure only: When you trigger auto‑fill, the Extension may send the HTML structure of a detected form (field names/labels and DOM structure, not your personal values) directly from your browser to your selected LLM provider (OpenAI, Anthropic, or Google) to compute a field mapping. The developer does not receive these requests or responses.
- Usage state: Minimal settings are stored locally (e.g., provider selection and API key). There is no persistent global on/off state; auto‑fill is triggered manually via right‑click.

No Developer Collection or Servers
- The developer does not collect, receive, or store any personal information, form contents, or API keys.
- The Extension does not use a developer‑operated backend. Network requests go directly from your browser to the chosen LLM provider using your own API key.

What We Do Not Collect
- We (the developer) do not collect, receive, or store your profile values (e.g., your actual name, address, phone) or browsing contents.
- The Extension does not transmit your profile values to LLM providers; only form structure (labels/HTML) is sent when you trigger auto‑fill.
- We do not run third‑party analytics, ads, or trackers.
- We do not sell or share personal data for advertising purposes.

How Information Is Used
- Local processing: Your locally stored profile data is used in your browser to suggest form completions.
- LLM requests: Only form structure is sent directly from your browser to your chosen LLM provider strictly to generate a field mapping for the current form. Requests use your provider API key, which you configure in the options page; the key is stored only in your local Chrome storage.

Third‑Party Services
The Extension can integrate with the following providers, depending on your selection:
- OpenAI (api.openai.com)
- Anthropic (api.anthropic.com)
- Google Gemini (generativelanguage.googleapis.com)

Each provider processes requests under its own terms and privacy policies. Review the provider’s policy before use. Your API key is used only to authenticate your requests to that provider and is not shared with the developer.

Permissions and Access
- The Extension uses the Chrome `contextMenus`, `scripting`, `activeTab`, and `storage` permissions to provide functionality:
  - `contextMenus`: show an enable/disable toggle in the right‑click menu.
  - `scripting`/`activeTab`: inject the content script into the current tab when you enable auto‑fill.
  - `storage`: store your settings, profiles, and provider API keys locally.

Your Choices and Controls
- Enable/Disable: Auto‑fill is disabled by default. You can enable/disable it at any time from the page right‑click menu.
- Profiles: You can create, edit, export, and import profiles in the options page.
- Delete data: Remove the Extension or clear extension storage to delete locally stored data.

Data Retention
- Profile data and settings are retained locally until you delete them or remove the Extension.
- The Extension does not store data on external servers.

Security
- Data is stored using Chrome’s extension storage. We recommend protecting your device and browser profile with appropriate security measures.
