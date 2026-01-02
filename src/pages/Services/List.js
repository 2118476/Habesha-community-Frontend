import React, { useState, useEffect } from 'react';
import api from '../../api/axiosInstance';
import { toast } from 'react-toastify';
import EntityCard from '../../components/common/EntityCard';
import styles from '../../stylus/sections/Services.module.scss';
import buttonStyles from '../../stylus/components/Button.module.scss';

/**
 * Browse available services with pagination.  Utilises the new
 * enterprise API returning enriched service DTOs.  Cards display
 * basic information and provider summaries.
 */
const ServicesList = () => {
  const [services, setServices] = useState([]);
  const [page, setPage] = useState(0);
  const size = 6;
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchServices(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const fetchServices = async (p) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/api/services?page=${p}&size=${size}`);
      setServices(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const nextPage = () => {
    if (services.length === size) setPage((prev) => prev + 1);
  };
  const prevPage = () => {
    setPage((prev) => Math.max(prev - 1, 0));
  };

  return (
    <div className={styles.container}>
      <h2>Service Marketplace</h2>
      <div>
        <button
          className={`${buttonStyles.btn} ${buttonStyles.primary}`}
          onClick={() => (window.location.href = '/app/services/post')}
        >
          Post Service
        </button>
      </div>
      {loading ? (
        <p>Loading services…</p>
      ) : (
        <>
          {services.length === 0 ? (
            <p>No services yet. Be the first to post!</p>
          ) : (
            <div className={styles.list}>
              {services.map((srv) => (
                <EntityCard key={srv.id} item={srv} type="services" />
              ))}
            </div>
          )}
          <div className={styles.pagination}>
            <button
              onClick={prevPage}
              disabled={page === 0}
              className={buttonStyles.btn}
            >
              Previous
            </button>
            <span>Page {page + 1}</span>
            <button
              onClick={nextPage}
              disabled={services.length < size}
              className={buttonStyles.btn}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ServicesList;
