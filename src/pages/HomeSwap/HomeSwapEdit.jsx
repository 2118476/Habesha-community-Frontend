// src/pages/HomeSwap/HomeSwapEdit.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import useAuth from "../../hooks/useAuth";
import { getHomeSwap } from "../../api/homeswap";
import { updateHomeSwap } from "../../api/homeswap";

import formStyles from "../../stylus/components/Form.module.scss";
import buttonStyles from "../../stylus/components/Button.module.scss";
import styles from "../../stylus/sections/HomeSwap.module.scss";
import { PageLoader } from "../../components/ui/PageLoader/PageLoader";

/**
 * Edit HomeSwap screen.
 *
 * This page loads an existing home swap post, checks that the current user
 * is allowed to edit it (owner only) and allows editing of the basic
 * fields: title, location, description, home type and bedrooms.  On save
 * it issues a PUT to the backend via the `/api/home-swap/{id}` endpoint and
 * navigates back to the details page.  The UI mirrors the create form
 * found in HomeSwapPost.jsx and Rentals editing UX.
 */
export default function HomeSwapEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    title: "",
    location: "",
    description: "",
    homeType: "entire",
    bedrooms: "1",
  });
  const [errorMsg, setErrorMsg] = useState("");

  // Fetch existing post on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await getHomeSwap(id);
        if (cancelled) return;
        // Permission check: only owner may edit.  The backend will also enforce
        // but we provide a client hint to prevent confusion.
        const ownerId = data?.userId ?? data?.ownerId ?? null;
        const meId = user?.id ?? user?.userId ?? user?._id ?? null;
        const sameUser =
          meId != null && ownerId != null && String(meId) === String(ownerId);
        if (!sameUser) {
          toast.error("You are not allowed to edit this post");
          navigate(`/app/home-swap/${id}`);
          return;
        }
        setForm({
          title: data?.title ?? "",
          location: data?.location ?? "",
          description: data?.description ?? "",
          homeType: data?.homeType ?? data?.home_type ?? "entire",
          bedrooms: data?.bedrooms != null ? String(data.bedrooms) : "1",
        });
      } catch (e) {
        const msg =
          e?.response?.data?.message ||
          e?.response?.data?.error ||
          e?.message ||
          "Failed to load home swap.";
        toast.error(msg);
        setErrorMsg(msg);
        navigate(-1);
        return;
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user]);

  // Form field handlers
  const setField = (key) => (e) => {
    const { value } = e.target;
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const canSubmit = useMemo(() => {
    return !!form.title.trim() && !!form.location.trim();
  }, [form.title, form.location]);

  async function onSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    try {
      await updateHomeSwap(id, {
        title: form.title.trim(),
        location: form.location.trim(),
        description: form.description?.trim() || "",
        homeType: form.homeType,
        bedrooms: String(form.bedrooms ?? "1"),
        // availableFrom and availableTo could be passed here if the backend stores them
      });
      toast.success("Home swap updated");
      navigate(`/app/home-swap/${id}`);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Update failed";
      setErrorMsg(msg);
      toast.error(msg);
    }
  }

  if (loading) return (
    <div style={{ padding: 16 }}>
      <PageLoader message="Loading home swap..." />
    </div>
  );
  if (errorMsg) return <div style={{ padding: 16 }}>{errorMsg}</div>;

  return (
    <div className={`${formStyles.wrap} ${styles.wrap}`}>
      <h2 className={`${formStyles.title} ${styles.title}`}>Edit Home Swap</h2>
      <form onSubmit={onSubmit} className={formStyles.form} noValidate>
        <label>
          Title*
          <input
            value={form.title}
            onChange={setField("title")}
            required
            disabled={false}
          />
        </label>

        <label>
          Location*
          <input
            value={form.location}
            onChange={setField("location")}
            required
            disabled={false}
          />
        </label>

        <label>
          Home type
          <select
            value={form.homeType}
            onChange={setField("homeType")}
          >
            <option value="entire">Entire place</option>
            <option value="room">Private room</option>
          </select>
        </label>

        <label>
          Bedrooms
          <input
            type="number"
            min="0"
            value={form.bedrooms}
            onChange={setField("bedrooms")}
          />
        </label>

        <label>
          Description
          <textarea
            rows={4}
            value={form.description}
            onChange={setField("description")}
          />
        </label>

        <div className={`${formStyles.actions} ${styles.actions}`} style={{ marginTop: 16 }}>
          <button
            type="submit"
            className={buttonStyles.primary}
            disabled={!canSubmit}
          >
            Save
          </button>
          <button
            type="button"
            className={buttonStyles.secondary}
            onClick={() => navigate(-1)}
            style={{ marginLeft: 8 }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}