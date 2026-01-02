import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axiosInstance';
import { toast } from 'react-toastify';
import styles from '../../stylus/sections/TravelDetails.module.scss';
import buttonStyles from '../../stylus/components/Button.module.scss';
import EntityMetaBar from '../../components/EntityMetaBar';
import { PageLoader } from '../../components/ui/PageLoader/PageLoader';

/**
 * TravelDetails displays a single travel post retrieved from the
 * backend. It shows the itinerary, the poster’s info and allows
 * authenticated users to contact the poster directly. A link to view
 * the poster’s public profile is also provided.
 */
const TravelDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  // Nothing to send; contact via message thread

  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/travel/${id}`);
        setPost(data);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load travel post');
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id]);

  // No contact request logic needed; direct messaging will be used via ContactButton

  if (loading) {
    return (
      <div className={styles.container}>
        <PageLoader message="Loading travel post..." />
      </div>
    );
  }
  if (!post) {
    return <div className={styles.container}>Travel post not found.</div>;
  }

  return (
    <div className={styles.container}>
      <h2>Travel Details</h2>
      {/* Poster meta bar */}
      <EntityMetaBar
        postedBy={post.postedBy || {
          id: post.userId,
          displayName: post.userName,
          username: post.userUsername,
          avatarUrl: post.userAvatar,
        }}
        createdAt={post.createdAt}
        context={{ type: 'travel', id: post.id }}
      />
      <div className={styles.detailCard}>
        <p>
          <strong>Route:</strong> {post.originCity} → {post.destinationCity}
        </p>
        <p>
          <strong>Date:</strong> {formatDate(post.travelDate)}
        </p>
        {post.message && (
          <p>
            <strong>Message:</strong> {post.message}
          </p>
        )}
        {post.contactMethod && (
          <p>
            <strong>Preferred contact:</strong> {post.contactMethod}
          </p>
        )}
        <p>
          <strong>Posted by:</strong> 
          <span 
            style={{ 
              cursor: 'pointer', 
              color: 'var(--primary, #2563eb)',
              fontWeight: '600',
              textDecoration: 'none',
              marginLeft: '6px'
            }}
            onClick={() => {
              const posterId = post.postedBy?.id || post.userId;
              const posterUsername = post.postedBy?.username || post.userUsername;
              if (posterUsername) {
                navigate(`/app/u/${posterUsername}`);
              } else if (posterId) {
                navigate(`/app/profile/${posterId}`);
              }
            }}
            title="View profile"
          >
            {post.postedBy?.displayName || post.userName || 'Traveller'}
          </span>
        </p>
      </div>
      <div className={styles.actions}>
        {/* Contact button replaced by direct message thread */}
        <button
          className={`${buttonStyles.btn} ${buttonStyles.primary}`}
          onClick={() =>
            navigate(`/app/messages/thread/${(post.postedBy?.id) || post.userId}`, {
              state: { focusComposer: true },
            })
          }
        >
          Message poster
        </button>
        <button
          className={`${buttonStyles.btn}`}
          onClick={() => {
            const posterId = post.postedBy?.id || post.userId;
            const posterUsername = post.postedBy?.username || post.userUsername;
            if (posterId) {
              navigate(`/app/profile/${posterId}`);
            } else if (posterUsername) {
              navigate(`/app/u/${posterUsername}`);
            }
          }}
        >
          View poster profile
        </button>
      </div>
    </div>
  );
};

function formatDate(iso) {
  if (!iso) return '-';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString();
  } catch {
    return iso;
  }
}

export default TravelDetails;