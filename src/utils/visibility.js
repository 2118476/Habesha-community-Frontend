// src/utils/visibility.js
// Helper utilities for showing/hiding contact fields (email/phone) on public pages
// based on a user's privacy visibility policy and the viewer->owner relationship.
//
// Visibility policies: PUBLIC | FRIENDS | REQUEST | ONLY_ME
// Relations: SELF | FRIENDS | FOAF | PUBLIC
//
// Typical usage:
//   import { decisionForContact, requestContact } from "../utils/visibility";
//   const d = decisionForContact({ value: user.email, visibility: user.emailVisibility, relation });
//   if (d.mode === "show") render(d.value);
//   if (d.mode === "request") render(<Button onClick={() => requestContact(user.id, "EMAIL")}>Request Email</Button>);
//   if (d.mode === "hidden") render("Hidden");
//
// Endpoints used:
//   POST /contact/request  body: { targetId, type: "EMAIL" | "PHONE" }

import api from "../api/axiosInstance";

export const Visibility = Object.freeze({
  PUBLIC: "PUBLIC",
  FRIENDS: "FRIENDS",
  REQUEST: "REQUEST",
  ONLY_ME: "ONLY_ME",
});

export const Relation = Object.freeze({
  SELF: "SELF",
  FRIENDS: "FRIENDS",
  FOAF: "FOAF",   // friends-of-friends (not used for contact visibility logic)
  PUBLIC: "PUBLIC",
});

/**
 * Returns true if the field should be shown in clear text.
 * REQUEST never shows directly (it should present a Request button instead).
 */
export function shouldShow(visibility, relation) {
  const vis = String(visibility || "").toUpperCase();
  const rel = String(relation || "PUBLIC").toUpperCase();

  if (vis === Visibility.PUBLIC) return true;
  if (vis === Visibility.FRIENDS) return rel === Relation.FRIENDS || rel === Relation.SELF;
  if (vis === Visibility.ONLY_ME) return rel === Relation.SELF;
  if (vis === Visibility.REQUEST) return false;
  // Fallback: hide
  return false;
}

/**
 * Compute a render decision for a contact field.
 * Returns one of:
 *  - { mode: "show", value }     → render the value plainly
 *  - { mode: "request", hint }   → render a Request button (hint is a masked preview if available)
 *  - { mode: "hidden" }          → render "Hidden"
 *  - { mode: "empty" }           → nothing to show (no value configured)
 *
 * `kind` is "EMAIL" | "PHONE" (optional; improves the masked hint).
 */
export function decisionForContact({ value, visibility, relation, kind }) {
  const vis = String(visibility || "").toUpperCase();

  // If there is no saved value at all, there's nothing meaningful to show or request.
  if (!value && vis !== Visibility.REQUEST) {
    return { mode: "empty" };
  }

  if (shouldShow(vis, relation)) {
    return { mode: "show", value };
  }

  if (vis === Visibility.REQUEST) {
    // Offer a Request button and optionally show a masked hint if a value exists
    const hint = value ? previewContact(value, kind) : undefined;
    return { mode: "request", hint };
  }

  return { mode: "hidden" };
}

/**
 * POST /contact/request  ({ targetId, type })
 * type: "EMAIL" | "PHONE"
 */
export async function requestContact(targetId, type) {
  const payload = { targetId, type: String(type || "").toUpperCase() };
  return api.post("/contact/request", payload);
}

/**
 * Produce a short masked preview for emails/phones.
 */
export function previewContact(value, kind) {
  const k = String(kind || "").toUpperCase();
  if (k === "EMAIL") return maskEmail(value);
  if (k === "PHONE") return maskPhone(value);
  // Default generic masking
  return maskGeneric(value);
}

/* ------------------------ internal mask helpers ------------------------ */

function maskEmail(email) {
  if (!email || typeof email !== "string" || !email.includes("@")) return "••••••@••••";
  const [user, host] = email.split("@");
  const u = user.length <= 2 ? user[0] || "" : user.slice(0, 2);
  const h = host.length <= 3 ? host[0] || "" : host.slice(0, 3);
  return `${u}***@${h}***`;
}

function maskPhone(phone) {
  if (!phone || typeof phone !== "string") return "•••••••";
  const digits = phone.replace(/\D+/g, "");
  if (digits.length <= 4) return `***${digits.slice(-2)}`;
  const last = digits.slice(-3);
  return `*** *** **${last}`;
}

function maskGeneric(text) {
  if (!text) return "••••";
  if (text.length <= 4) return "••••";
  return `${text.slice(0, 2)}***`;
}
