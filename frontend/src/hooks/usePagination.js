import { useState, useEffect } from 'react';

export const usePagination = (fetchFunction, initialParams = {}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [hasMore, setHasMore] = useState(true);
  const [filters, setFilters] = useState(initialParams);

  const fetchData = async (pageNum = page, filterParams = filters) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchFunction({
        page: pageNum,
        limit,
        ...filterParams,
      });
      
      if (pageNum === 1) {
        setData(response);
      } else {
        setData((prev) => [...prev, ...response]);
      }
      
      setHasMore(response.length === limit);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(1, filters);
  }, []);

  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchData(nextPage, filters);
    }
  };

  const refresh = () => {
    setPage(1);
    setData([]);
    fetchData(1, filters);
  };

  const updateFilters = (newFilters) => {
    setFilters(newFilters);
    setPage(1);
    setData([]);
    fetchData(1, newFilters);
  };

  return {
    data,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
    updateFilters,
    filters,
  };
};

