// src/components/reviews/ServiceReviews.jsx
//
// Reviews for a service provider. Shows the average + list, and a write/edit
// form that only appears when the backend says the viewer is eligible (i.e. they
// have had a genuine two-way conversation with the provider).

import React, { useEffect, useState, useCallback } from 'react';
import { Star } from 'lucide-react';
import { toast } from 'react-toastify';
import Avatar from '../Avatar';
import PostedDate from '../PostedDate/PostedDate';
import { makeApiUrl } from '../../api/httpUrl';
import {
  getProviderReviews,
  submitProviderReview,
  deleteProviderReview,
} from '../../api/reviews';
import styles from './ServiceReviews.module.scss';

function Stars({ value = 0, size = 16 }) {
  const rounded = Math.round(value);
  return (
    <span className={styles.stars} aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          className={n <= rounded ? styles.starOn : styles.starOff}
          fill={n <= rounded ? 'currentColor' : 'none'}
        />
      ))}
    </span>
  );
}

export default function ServiceReviews({ providerId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!providerId) return;
    setLoading(true);
    try {
      const res = await getProviderReviews(providerId);
      setData(res);
      if (res?.myReview) {
        setRating(res.myReview.rating);
        setComment(res.myReview.comment || '');
      }
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [providerId]);

  useEffect(() => { load(); }, [load]);

  const submit = async (e) => {
    e.preventDefault();
    if (rating < 1) { toast.warn('Pick a rating (1–5 stars).'); return; }
    setSubmitting(true);
    try {
      await submitProviderReview(providerId, { rating, comment: comment.trim() });
      toast.success('Thanks for your review!');
      await load();
    } catch (err) {
      toast.error(
        err?.normalized?.message ||
        err?.response?.data?.message ||
        err?.response?.data ||
        'Could not submit your review.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async () => {
    try {
      await deleteProviderReview(providerId);
      setRating(0);
      setComment('');
      await load();
      toast.success('Review removed.');
    } catch {
      toast.error('Could not remove your review.');
    }
  };

  if (!providerId) return null;

  return (
    <section className={styles.wrap} aria-label="Reviews">
      <header className={styles.head}>
        <h3 className={styles.title}>Reviews</h3>
        {data && data.count > 0 && (
          <div className={styles.summary}>
            <Stars value={data.average} size={18} />
            <strong>{Number(data.average).toFixed(1)}</strong>
            <span className={styles.muted}>({data.count})</span>
          </div>
        )}
      </header>

      {loading ? (
        <div className={styles.muted}>Loading reviews…</div>
      ) : !data ? null : (
        <>
          {data.canReview ? (
            <form className={styles.form} onSubmit={submit}>
              <div className={styles.ratePick} role="radiogroup" aria-label="Your rating">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    type="button"
                    key={n}
                    className={n <= rating ? styles.pickOn : styles.pickOff}
                    onClick={() => setRating(n)}
                    aria-label={`${n} star${n > 1 ? 's' : ''}`}
                  >
                    <Star size={26} fill={n <= rating ? 'currentColor' : 'none'} />
                  </button>
                ))}
              </div>
              <textarea
                className={styles.textarea}
                rows={3}
                placeholder="Share your experience with this provider…"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={2000}
              />
              <div className={styles.formActions}>
                <button type="submit" className={styles.submitBtn} disabled={submitting}>
                  {data.myReview ? 'Update review' : 'Post review'}
                </button>
                {data.myReview && (
                  <button type="button" className={styles.deleteBtn} onClick={remove}>
                    Delete
                  </button>
                )}
              </div>
            </form>
          ) : (
            <div className={styles.gate}>{data.reason}</div>
          )}

          {data.reviews?.length > 0 ? (
            <ul className={styles.list}>
              {data.reviews.map((r) => (
                <li key={r.id} className={styles.item}>
                  <Avatar
                    user={r.reviewer}
                    src={r.reviewer?.id ? makeApiUrl(`/users/${r.reviewer.id}/profile-image`) : undefined}
                    alt={r.reviewer?.name || 'User'}
                    size="sm"
                  />
                  <div className={styles.itemBody}>
                    <div className={styles.itemTop}>
                      <span className={styles.reviewer}>
                        {r.reviewer?.name || r.reviewer?.username || 'User'}
                      </span>
                      <Stars value={r.rating} size={14} />
                    </div>
                    {r.comment && <p className={styles.comment}>{r.comment}</p>}
                    {r.createdAt && (
                      <PostedDate date={r.createdAt} prefix={false} className={styles.date} />
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className={styles.muted}>No reviews yet — be the first.</div>
          )}
        </>
      )}
    </section>
  );
}
