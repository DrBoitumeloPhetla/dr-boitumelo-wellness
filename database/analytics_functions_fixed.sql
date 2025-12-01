-- ============================================
-- ANALYTICS FUNCTIONS (FIXED FOR JSON ITEMS)
-- Functions for calculating statistics from existing orders only
-- Works with orders table where items are stored as JSON
-- ============================================

-- Drop existing functions first to avoid type conflicts
DROP FUNCTION IF EXISTS get_top_products(INTEGER);
DROP FUNCTION IF EXISTS get_order_statistics(TEXT);
DROP FUNCTION IF EXISTS get_daily_statistics(INTEGER);

-- ============================================
-- FUNCTION: get_top_products
-- Returns the top selling products based on existing orders
-- Works with JSON items column
-- ============================================

CREATE OR REPLACE FUNCTION get_top_products(limit_count INTEGER DEFAULT 5)
RETURNS TABLE (
  product_id TEXT,
  product_name TEXT,
  times_sold BIGINT,
  total_revenue NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    item->>'id' AS product_id,
    item->>'name' AS product_name,
    SUM((item->>'quantity')::INTEGER)::BIGINT AS times_sold,
    SUM((item->>'quantity')::INTEGER * (item->>'price')::NUMERIC)::NUMERIC AS total_revenue
  FROM orders o,
  jsonb_array_elements(o.items::jsonb) AS item
  GROUP BY item->>'id', item->>'name'
  ORDER BY times_sold DESC, total_revenue DESC
  LIMIT limit_count;
END;
$$;

COMMENT ON FUNCTION get_top_products IS 'Returns top selling products based on current orders only (works with JSON items column)';


-- ============================================
-- FUNCTION: get_order_statistics
-- Returns order statistics for a specific time period
-- ============================================

CREATE OR REPLACE FUNCTION get_order_statistics(period TEXT DEFAULT 'week')
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

COMMENT ON FUNCTION get_order_statistics IS 'Returns order statistics (count, revenue, avg) for a time period (today, week, month, year)';


-- ============================================
-- FUNCTION: get_daily_statistics
-- Returns daily order counts and revenue for the last N days
-- ============================================

CREATE OR REPLACE FUNCTION get_daily_statistics(days_back INTEGER DEFAULT 7)
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

COMMENT ON FUNCTION get_daily_statistics IS 'Returns daily order counts and revenue for the last N days (only includes existing orders)';
