// src/pages/Services/Details.js
import React, { useEffect, useState } from 'react';
import useAuth from '../../hooks/useAuth';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axiosInstance';
import { toast } from 'react-toastify';
import styles from '../../stylus/sections/Services.module.scss';
import buttonStyles from '../../stylus/components/Button.module.scss';
import EntityMetaBar from '../../components/EntityMetaBar.jsx';
import ContactButton from '../../components/ContactButton.jsx';
import { PageLoader } from '../../components/ui/PageLoader/PageLoader';

export default function ServiceDetails() {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/api/services/${id}`);
        setService(data || null);
      } catch (e) {
        console.error(e);
        toast.error('Failed to load service');
        setService(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return (
    <div className="page">
      <PageLoader message="Loading service..." />
    </div>
  );
  if (!service) return <div className="page">Not found</div>;

  // Resolve poster (object + fallbacks)
  const posterObj =
    service.postedBy ||
    service.provider ||
    service.owner ||
    service.author ||
    service.organizer ||
    service.user ||
    null;

  const posterId =
    posterObj?.id ??
    service.providerId ??
    service.ownerId ??
    service.userId ??
    service.posterId ??
    null;

  const isOwner =
    user?.id != null && posterId != null && String(user.id) === String(posterId);

  const viewProfile = () => {
    if (!posterId) {
      toast.error('Provider profile unavailable.');
      return;
    }
    // ✅ Match HomeSwap/Rentals: ID-based profile route
    navigate(`/app/profile/${posterId}`);
  };

  // Extract comprehensive service details
  const serviceDetails = {
    category: service?.category || "",
    description: service?.description || "",
    estimatedTime: service?.estimatedTime || service?.estimated_time || service?.duration || "",
    basePrice: service?.basePrice || service?.base_price || service?.price || "",
    deliveryType: service?.deliveryType || service?.delivery_type || service?.serviceType || "",
    rating: service?.rating || service?.averageRating || "",
    reviewCount: service?.reviewCount || service?.review_count || service?.totalReviews || 0,
    location: service?.location || "",
    availability: service?.availability || service?.availableHours || "",
    requirements: service?.requirements || service?.prerequisites || "",
    includes: service?.includes || service?.whatIsIncluded || "",
    excludes: service?.excludes || service?.whatIsNotIncluded || "",
    cancellationPolicy: service?.cancellationPolicy || service?.cancellation_policy || "",
    experience: service?.experience || service?.yearsOfExperience || "",
    certifications: service?.certifications || service?.qualifications || "",
    portfolio: service?.portfolio || service?.previousWork || "",
    languages: service?.languages || service?.spokenLanguages || "",
    serviceArea: service?.serviceArea || service?.coverageArea || "",
    minBookingTime: service?.minBookingTime || service?.minimumBookingTime || "",
    maxBookingTime: service?.maxBookingTime || service?.maximumBookingTime || ""
  };

  return (
    <div className={`page ${styles.serviceDetails}`}>
      {/* Header Section */}
      <div className={styles.serviceHeader}>
        <div className={styles.serviceTitleSection}>
          <h1 className={styles.serviceTitle}>{service.title}</h1>
          {serviceDetails.category && (
            <div className={styles.serviceCategoryBadge}>
              <span className={styles.serviceCategoryIcon}>🛠️</span>
              {serviceDetails.category}
            </div>
          )}
        </div>

        {serviceDetails.rating && (
          <div className={styles.serviceRating}>
            <span className={styles.ratingStars}>⭐</span>
            <span className={styles.ratingValue}>{serviceDetails.rating}</span>
            {serviceDetails.reviewCount > 0 && (
              <span className={styles.reviewCount}>({serviceDetails.reviewCount} reviews)</span>
            )}
          </div>
        )}
      </div>

      <EntityMetaBar
        postedBy={posterObj || undefined}
        createdAt={service.createdAt}
        context={{ type: 'service', id: String(service.id ?? id) }}
      />

      {/* Main Content Grid */}
      <div className={styles.serviceContent}>
        {/* Left Column - Main Details */}
        <div className={styles.serviceMainDetails}>
          {/* Service Image */}
          <div className={styles.serviceImageContainer}>
            <img
              src={`${api.defaults.baseURL}/api/services/${id}/image`}
              alt="Service"
              className={styles.serviceImage}
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          </div>

          {/* Description */}
          {serviceDetails.description && (
            <div className={styles.serviceSection}>
              <h3 className={styles.sectionTitle}>Description</h3>
              <p className={styles.serviceDescription}>{serviceDetails.description}</p>
            </div>
          )}

          {/* What's Included */}
          {serviceDetails.includes && (
            <div className={styles.serviceSection}>
              <h3 className={styles.sectionTitle}>What's Included</h3>
              <div className={styles.serviceIncludes}>
                {serviceDetails.includes.split(',').map((item, index) => (
                  <div key={index} className={styles.includeItem}>
                    <span className={styles.includeIcon}>✅</span>
                    {item.trim()}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* What's Not Included */}
          {serviceDetails.excludes && (
            <div className={styles.serviceSection}>
              <h3 className={styles.sectionTitle}>What's Not Included</h3>
              <div className={styles.serviceExcludes}>
                {serviceDetails.excludes.split(',').map((item, index) => (
                  <div key={index} className={styles.excludeItem}>
                    <span className={styles.excludeIcon}>❌</span>
                    {item.trim()}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Requirements */}
          {serviceDetails.requirements && (
            <div className={styles.serviceSection}>
              <h3 className={styles.sectionTitle}>Requirements</h3>
              <p className={styles.serviceRequirements}>{serviceDetails.requirements}</p>
            </div>
          )}

          {/* Cancellation Policy */}
          {serviceDetails.cancellationPolicy && (
            <div className={styles.serviceSection}>
              <h3 className={styles.sectionTitle}>Cancellation Policy</h3>
              <p className={styles.serviceCancellation}>{serviceDetails.cancellationPolicy}</p>
            </div>
          )}
        </div>

        {/* Right Column - Service Info */}
        <div className={styles.serviceSidebar}>
          {/* Pricing Card */}
          <div className={styles.servicePricingCard}>
            <h3 className={styles.pricingTitle}>Service Details</h3>
            
            {serviceDetails.basePrice && (
              <div className={styles.priceSection}>
                <span className={styles.priceLabel}>Starting from</span>
                <span className={styles.priceValue}>£{serviceDetails.basePrice}</span>
              </div>
            )}

            <div className={styles.serviceInfoGrid}>
              {serviceDetails.estimatedTime && (
                <div className={styles.infoItem}>
                  <span className={styles.infoIcon}>⏱️</span>
                  <div className={styles.infoContent}>
                    <span className={styles.infoLabel}>Duration</span>
                    <span className={styles.infoValue}>{serviceDetails.estimatedTime}</span>
                  </div>
                </div>
              )}

              {serviceDetails.deliveryType && (
                <div className={styles.infoItem}>
                  <span className={styles.infoIcon}>📍</span>
                  <div className={styles.infoContent}>
                    <span className={styles.infoLabel}>Service Type</span>
                    <span className={styles.infoValue}>{serviceDetails.deliveryType}</span>
                  </div>
                </div>
              )}

              {serviceDetails.location && (
                <div className={styles.infoItem}>
                  <span className={styles.infoIcon}>🌍</span>
                  <div className={styles.infoContent}>
                    <span className={styles.infoLabel}>Location</span>
                    <span className={styles.infoValue}>{serviceDetails.location}</span>
                  </div>
                </div>
              )}

              {serviceDetails.serviceArea && (
                <div className={styles.infoItem}>
                  <span className={styles.infoIcon}>📍</span>
                  <div className={styles.infoContent}>
                    <span className={styles.infoLabel}>Service Area</span>
                    <span className={styles.infoValue}>{serviceDetails.serviceArea}</span>
                  </div>
                </div>
              )}

              {serviceDetails.availability && (
                <div className={styles.infoItem}>
                  <span className={styles.infoIcon}>🕒</span>
                  <div className={styles.infoContent}>
                    <span className={styles.infoLabel}>Availability</span>
                    <span className={styles.infoValue}>{serviceDetails.availability}</span>
                  </div>
                </div>
              )}

              {serviceDetails.languages && (
                <div className={styles.infoItem}>
                  <span className={styles.infoIcon}>🗣️</span>
                  <div className={styles.infoContent}>
                    <span className={styles.infoLabel}>Languages</span>
                    <span className={styles.infoValue}>{serviceDetails.languages}</span>
                  </div>
                </div>
              )}

              {serviceDetails.minBookingTime && (
                <div className={styles.infoItem}>
                  <span className={styles.infoIcon}>⏰</span>
                  <div className={styles.infoContent}>
                    <span className={styles.infoLabel}>Min. Booking</span>
                    <span className={styles.infoValue}>{serviceDetails.minBookingTime}</span>
                  </div>
                </div>
              )}

              {serviceDetails.maxBookingTime && (
                <div className={styles.infoItem}>
                  <span className={styles.infoIcon}>⏰</span>
                  <div className={styles.infoContent}>
                    <span className={styles.infoLabel}>Max. Booking</span>
                    <span className={styles.infoValue}>{serviceDetails.maxBookingTime}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Provider Info Card */}
          {(serviceDetails.experience || serviceDetails.certifications) && (
            <div className={styles.providerInfoCard}>
              <h3 className={styles.providerTitle}>Provider Information</h3>
              
              {serviceDetails.experience && (
                <div className={styles.providerItem}>
                  <span className={styles.providerIcon}>🎯</span>
                  <div className={styles.providerContent}>
                    <span className={styles.providerLabel}>Experience</span>
                    <span className={styles.providerValue}>{serviceDetails.experience}</span>
                  </div>
                </div>
              )}

              {serviceDetails.certifications && (
                <div className={styles.providerItem}>
                  <span className={styles.providerIcon}>🏆</span>
                  <div className={styles.providerContent}>
                    <span className={styles.providerLabel}>Certifications</span>
                    <span className={styles.providerValue}>{serviceDetails.certifications}</span>
                  </div>
                </div>
              )}

              {serviceDetails.portfolio && (
                <div className={styles.providerItem}>
                  <span className={styles.providerIcon}>💼</span>
                  <div className={styles.providerContent}>
                    <span className={styles.providerLabel}>Portfolio</span>
                    <span className={styles.providerValue}>{serviceDetails.portfolio}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className={styles.serviceActions}>
            {!isOwner && posterId && (
              <ContactButton
                toUserId={posterId}
                context={{ type: 'service', id: String(service.id ?? id) }}
                className={`${buttonStyles.btn} ${styles.primaryAction}`}
              >
                💬 Message Provider
              </ContactButton>
            )}

            {isOwner && (
              <button
                className={`${buttonStyles.btn} ${styles.editAction}`}
                onClick={() => navigate(`/app/services/${service.id}/edit`)}
              >
                ✏️ Edit Service
              </button>
            )}

            <button
              className={`${buttonStyles.btn} ${styles.secondaryAction}`}
              onClick={viewProfile}
              disabled={!posterId}
            >
              👤 View Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
