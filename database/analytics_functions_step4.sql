-- Step 4: Create get_daily_statistics function
CREATE FUNCTION get_daily_statistics(days_back INTEGER DEFAULT 7)
RETURNS TABLE (
  date DATE,
  orders_count BIGINT,
  revenue NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    o.created_at::DATE AS date,
    COUNT(*)::BIGINT AS orders_count,
    COALESCE(SUM(o.total), 0)::NUMERIC AS revenue
  FROM orders o
  WHERE o.created_at >= NOW() - (days_back || ' days')::INTERVAL
  GROUP BY o.created_at::DATE
  ORDER BY date DESC;
END;
$$;
