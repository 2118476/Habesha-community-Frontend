// src/pages/Settings/Privacy.js
import React from "react";
import useUserSettings from "./hooks/useUserSettings";
import styles from "../../stylus/sections/Settings.module.scss";
import { SectionLoader } from "../../components/ui/SectionLoader/SectionLoader";

const VIS = ["PUBLIC", "FRIENDS", "REQUEST", "ONLY_ME"];
const MENTIONS = ["EVERYONE", "FRIENDS", "NO_ONE"];
const DMS = ["EVERYONE", "FOAF", "FRIENDS", "NO_ONE"];

export default function PrivacySettings() {
  const { settings, update, saving } = useUserSettings();
  if (!settings) return (
    <div className={styles.panel}>
      <SectionLoader message="Loading settings..." />
    </div>
  );

  const set = (k) => (e) => update({ [k]: e.target.value });

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Privacy & Safety</h1>

      <section className={styles.panelGrid}>
        <div>
          <h2>Contact info visibility</h2>
          <label>Email</label>
          <select value={settings.emailVisibility || "FRIENDS"} onChange={set("emailVisibility")}>
            {VIS.map(v => <option key={v} value={v}>{v.replace("_"," ")}</option>)}
          </select>

          <label className={styles.mt8}>Phone</label>
          <select value={settings.phoneVisibility || "REQUEST"} onChange={set("phoneVisibility")}>
            {VIS.map(v => <option key={v} value={v}>{v.replace("_"," ")}</option>)}
          </select>
          <p className={styles.help}>
            “REQUEST” shows a Request button on your profile; accepted requests reveal the field.
          </p>
        </div>

        <div>
          <h2>Status & discoverability</h2>
          <label className={styles.switch}>
            <input type="checkbox"
                   checked={!!settings.showOnlineStatus}
                   onChange={(e) => update({ showOnlineStatus: e.target.checked })} />
            <span>Show online status</span>
          </label>

          <label className={styles.switch}>
            <input type="checkbox"
                   checked={!!settings.showLastSeen}
                   onChange={(e) => update({ showLastSeen: e.target.checked })} />
            <span>Show last seen</span>
          </label>

          <label className={styles.switch}>
            <input type="checkbox"
                   checked={!!settings.searchable}
                   onChange={(e) => update({ searchable: e.target.checked })} />
            <span>Allow others to find me in search</span>
          </label>
        </div>

        <div>
          <h2>Mentions & DMs</h2>
          <label>Who can @mention me</label>
          <select value={settings.mentionsPolicy || "EVERYONE"} onChange={set("mentionsPolicy")}>
            {MENTIONS.map(v => <option key={v} value={v}>{v.replace("_"," ")}</option>)}
          </select>

          <label className={styles.mt8}>Who can DM me</label>
          <select value={settings.dmPolicy || "FRIENDS"} onChange={set("dmPolicy")}>
            {DMS.map(v => <option key={v} value={v}>{v.replace("_"," ")}</option>)}
          </select>
        </div>
      </section>

      <section className={styles.panel}>
        <h2>Blocked users</h2>
        <p className={styles.help}>You can unblock users here. (Wiring to backend unblock endpoint can be added later.)</p>
        {/* Placeholder list; swap with real data when endpoint is ready */}
        <div className={styles.table}>
          <div className={styles.th}>User</div>
          <div className={styles.th}>Action</div>
          <div className={styles.tr}><div>@sampleUser</div><div><button className={styles.btnSecondary} disabled>Unblock</button></div></div>
        </div>
      </section>

      <section className={styles.panel}>
        <h2>Safety tips</h2>
        <ul className={styles.tips}>
          <li>Don’t share passwords, 2FA codes, or financial info in chat.</li>
          <li>Meet in public places for in-person exchanges; bring a friend when possible.</li>
          <li>Use in-app messaging until you trust the person; be cautious with external links.</li>
          <li>Report suspicious behaviour to moderators; block users who violate rules.</li>
        </ul>
      </section>

      <div className={styles.footerRow}>{saving ? "Saving…" : " "}</div>
    </div>
  );
}
