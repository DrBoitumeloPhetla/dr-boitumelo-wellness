-- Analytics Functions for Dashboard Statistics
-- Run this in your Supabase SQL Editor to enable analytics

-- Function to get order statistics by time period
CREATE OR REPLACE FUNCTION get_order_statistics(time_period TEXT DEFAULT 'today')
RETURNS TABLE(
  period_label TEXT,
  total_orders BIGINT,
  total_revenue DECIMAL,
  average_order_value DECIMAL
) AS $$
DECLARE
  start_date TIMESTAMPTZ;
  end_date TIMESTAMPTZ;
BEGIN
  end_date := NOW();

  -- Calculate start date based on period
  CASE time_period
    WHEN 'today' THEN
      start_date := DATE_TRUNC('day', NOW());
    WHEN 'week' THEN
      start_date := DATE_TRUNC('week', NOW());
    WHEN 'month' THEN
      start_date := DATE_TRUNC('month', NOW());
    WHEN 'year' THEN
      start_date := DATE_TRUNC('year', NOW());
    ELSE
      start_date := DATE_TRUNC('day', NOW());
  END CASE;

  RETURN QUERY
  SELECT
    time_period AS period_label,
    COUNT(*)::BIGINT AS total_orders,
    COALESCE(SUM(total), 0)::DECIMAL AS total_revenue,
    COALESCE(AVG(total), 0)::DECIMAL AS average_order_value
  FROM orders
  WHERE created_at >= start_date
    AND created_at <= end_date
    AND status != 'cancelled';
END;
$$ LANGUAGE plpgsql;

-- Function to get booking statistics by time period
CREATE OR REPLACE FUNCTION get_booking_statistics(time_period TEXT DEFAULT 'today')
RETURNS TABLE(
  period_label TEXT,
  total_bookings BIGINT,
  confirmed_bookings BIGINT,
  pending_bookings BIGINT,
  cancelled_bookings BIGINT
) AS $$
DECLARE
  start_date TIMESTAMPTZ;
  end_date TIMESTAMPTZ;
BEGIN
  end_date := NOW();

  -- Calculate start date based on period
  CASE time_period
    WHEN 'today' THEN
      start_date := DATE_TRUNC('day', NOW());
    WHEN 'week' THEN
      start_date := DATE_TRUNC('week', NOW());
    WHEN 'month' THEN
      start_date := DATE_TRUNC('month', NOW());
    WHEN 'year' THEN
      start_date := DATE_TRUNC('year', NOW());
    ELSE
      start_date := DATE_TRUNC('day', NOW());
  END CASE;

  RETURN QUERY
  SELECT
    time_period AS period_label,
    COUNT(*)::BIGINT AS total_bookings,
    COUNT(*) FILTER (WHERE status = 'confirmed')::BIGINT AS confirmed_bookings,
    COUNT(*) FILTER (WHERE status = 'pending')::BIGINT AS pending_bookings,
    COUNT(*) FILTER (WHERE status = 'cancelled')::BIGINT AS cancelled_bookings
  FROM appointments
  WHERE created_at >= start_date
    AND created_at <= end_date;
END;
$$ LANGUAGE plpgsql;

-- Function to get daily statistics for chart (last 7/30 days)
CREATE OR REPLACE FUNCTION get_daily_statistics(days_back INTEGER DEFAULT 7)
RETURNS TABLE(
  date DATE,
  orders_count BIGINT,
  revenue DECIMAL,
  bookings_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH date_series AS (
    SELECT generate_series(
      CURRENT_DATE - (days_back - 1),
      CURRENT_DATE,
      '1 day'::INTERVAL
    )::DATE AS date
  ),
  daily_orders AS (
    SELECT
      DATE(created_at) AS order_date,
      COUNT(*) AS order_count,
      SUM(total) AS daily_revenue
    FROM orders
    WHERE created_at >= CURRENT_DATE - (days_back - 1)
      AND status != 'cancelled'
    GROUP BY DATE(created_at)
  ),
  daily_bookings AS (
    SELECT
      DATE(created_at) AS booking_date,
      COUNT(*) AS booking_count
    FROM appointments
    WHERE created_at >= CURRENT_DATE - (days_back - 1)
    GROUP BY DATE(created_at)
  )
  SELECT
    ds.date,
    COALESCE(do.order_count, 0)::BIGINT AS orders_count,
    COALESCE(do.daily_revenue, 0)::DECIMAL AS revenue,
    COALESCE(db.booking_count, 0)::BIGINT AS bookings_count
  FROM date_series ds
  LEFT JOIN daily_orders do ON ds.date = do.order_date
  LEFT JOIN daily_bookings db ON ds.date = db.booking_date
  ORDER BY ds.date;
END;
$$ LANGUAGE plpgsql;

-- Function to get top selling products
CREATE OR REPLACE FUNCTION get_top_products(limit_count INTEGER DEFAULT 5)
RETURNS TABLE(
  product_name TEXT,
  times_sold INTEGER,
  total_revenue DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.name AS product_name,
    p.total_sold AS times_sold,
    (p.total_sold * p.price)::DECIMAL AS total_revenue
  FROM products p
  WHERE p.total_sold > 0
  ORDER BY p.total_sold DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get overview statistics (for dashboard cards)
CREATE OR REPLACE FUNCTION get_dashboard_overview()
RETURNS TABLE(
  total_orders BIGINT,
  total_revenue DECIMAL,
  total_bookings BIGINT,
  pending_bookings BIGINT,
  low_stock_count BIGINT,
  total_customers BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM orders WHERE status != 'cancelled')::BIGINT,
    (SELECT COALESCE(SUM(total), 0) FROM orders WHERE status != 'cancelled')::DECIMAL,
    (SELECT COUNT(*) FROM appointments)::BIGINT,
    (SELECT COUNT(*) FROM appointments WHERE status = 'pending')::BIGINT,
    (SELECT COUNT(*) FROM products WHERE stock_quantity <= low_stock_threshold AND status = 'active')::BIGINT,
    (SELECT COUNT(DISTINCT email) FROM appointments)::BIGINT;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_order_statistics TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_booking_statistics TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_daily_statistics TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_top_products TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_dashboard_overview TO anon, authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Analytics functions created successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'Available functions:';
  RAISE NOTICE '1. get_order_statistics(period) - Get order stats by period';
  RAISE NOTICE '2. get_booking_statistics(period) - Get booking stats by period';
  RAISE NOTICE '3. get_daily_statistics(days) - Get daily data for charts';
  RAISE NOTICE '4. get_top_products(limit) - Get best selling products';
  RAISE NOTICE '5. get_dashboard_overview() - Get overview statistics';
  RAISE NOTICE '';
  RAISE NOTICE 'Periods: ''today'', ''week'', ''month'', ''year''';
END $$;
