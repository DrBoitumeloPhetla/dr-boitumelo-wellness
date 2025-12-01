-- Step 2: Create get_top_products function
CREATE FUNCTION get_top_products(limit_count INTEGER DEFAULT 5)
RETURNS TABLE (
  product_id UUID,
  product_name TEXT,
  times_sold BIGINT,
  total_revenue NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    oi.product_id,
    p.name AS product_name,
    COUNT(*)::BIGINT AS times_sold,
    SUM(oi.quantity * oi.price)::NUMERIC AS total_revenue
  FROM order_items oi
  INNER JOIN orders o ON oi.order_id = o.id
  INNER JOIN products p ON oi.product_id = p.id
  GROUP BY oi.product_id, p.name
  ORDER BY times_sold DESC, total_revenue DESC
  LIMIT limit_count;
END;
$$;
