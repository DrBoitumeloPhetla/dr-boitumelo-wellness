-- Step 3: Create get_order_statistics function
CREATE FUNCTION get_order_statistics(period TEXT DEFAULT 'week')
RETURNS TABLE (
  total_orders BIGINT,
  total_revenue NUMERIC,
  average_order_value NUMERIC
)
LANGUAGE plpgsql
AS $$
DECLARE
  days_back INTEGER;
BEGIN
  CASE period
    WHEN 'today' THEN days_back := 1;
    WHEN 'week' THEN days_back := 7;
    WHEN 'month' THEN days_back := 30;
    WHEN 'year' THEN days_back := 365;
    ELSE days_back := 7;
  END CASE;

  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT AS total_orders,
    COALESCE(SUM(o.total), 0)::NUMERIC AS total_revenue,
    COALESCE(AVG(o.total), 0)::NUMERIC AS average_order_value
  FROM orders o
  WHERE o.created_at >= NOW() - (days_back || ' days')::INTERVAL;
END;
$$;
