import React from 'react';
import { Link } from 'react-router-dom';
import ProfileChip from '../ProfileChip';
import styles from '../../stylus/components/EntityCard.module.scss';

/**
 * Generic card for displaying entities like events, services and rentals.
 * Accepts the entity data and a type string used to build the link.
 */
const EntityCard = ({ item, type }) => {
  if (!item) return null;
  const { 
    id, title, location, date, price, images, author, postedBy, description,
    // Service-specific fields
    category, basePrice, estimatedTime, estimated_time, duration,
    deliveryType, delivery_type, serviceType, rating, averageRating,
    reviewCount, review_count, totalReviews
  } = item;
  
  // Select the first image if available
  const imageUrl = images && images.length > 0 ? images[0] : null;
  
  // Prepend /app to entity URLs when the user is authenticated. The
  // marketplace lives under the /app namespace.
  const link = `/app/${type}/${id}`;
  
  // Enhanced service details
  const isService = type === 'services';
  const serviceDetails = isService ? {
    category: category || "",
    basePrice: basePrice || price || "",
    estimatedTime: estimatedTime || estimated_time || duration || "",
    deliveryType: deliveryType || delivery_type || serviceType || "",
    rating: rating || averageRating || "",
    reviewCount: reviewCount || review_count || totalReviews || 0
  } : {};
  
  return (
    <Link to={link} className={`${styles.card} ${isService ? styles.serviceCard : ''}`}>
      {imageUrl && (
        <div
          className={styles.image}
          style={{ backgroundImage: `url(${imageUrl})` }}
        >
          {isService && serviceDetails.category && (
            <div className={styles.categoryBadge}>
              <span className={styles.categoryIcon}>🛠️</span>
              {serviceDetails.category}
            </div>
          )}
          {isService && serviceDetails.rating && (
            <div className={styles.ratingBadge}>
              <span className={styles.ratingIcon}>⭐</span>
              {serviceDetails.rating}
              {serviceDetails.reviewCount > 0 && (
                <span className={styles.ratingCount}>({serviceDetails.reviewCount})</span>
              )}
            </div>
          )}
        </div>
      )}
      <div className={styles.content}>
        <h3 className={styles.title}>{title}</h3>
        
        {/* Service-specific enhanced display */}
        {isService ? (
          <div className={styles.serviceInfo}>
            {serviceDetails.basePrice && (
              <div className={styles.servicePriceRow}>
                <span className={styles.priceLabel}>From</span>
                <span className={styles.priceValue}>£{serviceDetails.basePrice}</span>
              </div>
            )}
            
            <div className={styles.serviceDetails}>
              {serviceDetails.estimatedTime && (
                <div className={styles.serviceDetail}>
                  <span className={styles.detailIcon}>⏱️</span>
                  <span className={styles.detailText}>{serviceDetails.estimatedTime}</span>
                </div>
              )}
              
              {serviceDetails.deliveryType && (
                <div className={styles.serviceDetail}>
                  <span className={styles.detailIcon}>📍</span>
                  <span className={styles.detailText}>{serviceDetails.deliveryType}</span>
                </div>
              )}
              
              {location && (
                <div className={styles.serviceDetail}>
                  <span className={styles.detailIcon}>🌍</span>
                  <span className={styles.detailText}>{location}</span>
                </div>
              )}
            </div>
            
            {description && (
              <p className={styles.description}>
                {description.length > 100 ? `${description.slice(0, 97)}…` : description}
              </p>
            )}
          </div>
        ) : (
          /* Original display for non-service items */
          <>
            {date && (
              <p className={styles.meta}>
                {date}
                {location && ` – ${location}`}
              </p>
            )}
            {!date && location && <p className={styles.meta}>{location}</p>}
            {price && <p className={styles.price}>£{price}</p>}
            {description && (
              <p className={styles.description}>
                {description.length > 80 ? `${description.slice(0, 77)}…` : description}
              </p>
            )}
          </>
        )}
        
        {/* Display the poster information using ProfileChip. Fallback to the legacy
           author field if postedBy is not present. */}
        {(postedBy || author) && (
          <ProfileChip user={postedBy || author} subtext={null} link={true} size="sm" />
        )}
      </div>
    </Link>
  );
};

export default EntityCard;