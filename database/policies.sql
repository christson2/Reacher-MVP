-- Reacher Row Level Security (RLS) Policies
-- Enforce data access control at the database level

-- ============================================================================
-- USERS TABLE RLS
-- ============================================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY users_select_own ON users FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own data
CREATE POLICY users_update_own ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Service to service: Allow anon to read (will be restricted via gateway)
CREATE POLICY users_select_public ON users FOR SELECT
  TO anon USING (TRUE);

-- ============================================================================
-- PROFILES TABLE RLS
-- ============================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read all profiles (public profiles)
CREATE POLICY profiles_select_public ON profiles FOR SELECT
  USING (TRUE);

-- Users can update their own profile
CREATE POLICY profiles_update_own ON profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can insert their own profile
CREATE POLICY profiles_insert_own ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- PRODUCTS TABLE RLS
-- ============================================================================
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Anyone can read active products
CREATE POLICY products_select_public ON products FOR SELECT
  USING (is_active = TRUE);

-- Sellers can read their own products (even inactive)
CREATE POLICY products_select_own ON products FOR SELECT
  USING (auth.uid() = seller_id);

-- Sellers can create products
CREATE POLICY products_insert_own ON products FOR INSERT
  WITH CHECK (auth.uid() = seller_id);

-- Sellers can update their own products
CREATE POLICY products_update_own ON products FOR UPDATE
  USING (auth.uid() = seller_id)
  WITH CHECK (auth.uid() = seller_id);

-- Sellers can delete their own products
CREATE POLICY products_delete_own ON products FOR DELETE
  USING (auth.uid() = seller_id);

-- ============================================================================
-- SERVICES TABLE RLS
-- ============================================================================
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Anyone can read active services
CREATE POLICY services_select_public ON services FOR SELECT
  USING (is_active = TRUE);

-- Providers can read their own services (even inactive)
CREATE POLICY services_select_own ON services FOR SELECT
  USING (auth.uid() = provider_id);

-- Providers can create services
CREATE POLICY services_insert_own ON services FOR INSERT
  WITH CHECK (auth.uid() = provider_id);

-- Providers can update their own services
CREATE POLICY services_update_own ON services FOR UPDATE
  USING (auth.uid() = provider_id)
  WITH CHECK (auth.uid() = provider_id);

-- Providers can delete their own services
CREATE POLICY services_delete_own ON services FOR DELETE
  USING (auth.uid() = provider_id);

-- ============================================================================
-- REQUESTS TABLE RLS
-- ============================================================================
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;

-- Consumers can see their own requests
CREATE POLICY requests_select_own ON requests FOR SELECT
  USING (auth.uid() = consumer_id);

-- Anyone can read open requests (for discovery)
CREATE POLICY requests_select_open ON requests FOR SELECT
  USING (status = 'open');

-- Consumers can create requests
CREATE POLICY requests_insert_own ON requests FOR INSERT
  WITH CHECK (auth.uid() = consumer_id);

-- Consumers can update their own requests
CREATE POLICY requests_update_own ON requests FOR UPDATE
  USING (auth.uid() = consumer_id)
  WITH CHECK (auth.uid() = consumer_id);

-- ============================================================================
-- BIDS TABLE RLS
-- ============================================================================
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;

-- Sellers can create bids on open requests
CREATE POLICY bids_insert_own ON bids FOR INSERT
  WITH CHECK (auth.uid() = seller_id);

-- Sellers can see their own bids
CREATE POLICY bids_select_own ON bids FOR SELECT
  USING (auth.uid() = seller_id);

-- Request owners can see bids on their requests
CREATE POLICY bids_select_request_owner ON bids FOR SELECT
  USING (auth.uid() IN (
    SELECT consumer_id FROM requests WHERE id = request_id
  ));

-- Sellers can update their own bids (if not yet accepted)
CREATE POLICY bids_update_own ON bids FOR UPDATE
  USING (auth.uid() = seller_id AND status != 'accepted')
  WITH CHECK (auth.uid() = seller_id);

-- ============================================================================
-- MESSAGES TABLE RLS
-- ============================================================================
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Users can read messages they sent or received
CREATE POLICY messages_select_own ON messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- Users can send messages
CREATE POLICY messages_insert_own ON messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- Users can mark messages as read
CREATE POLICY messages_update_own ON messages FOR UPDATE
  USING (auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = recipient_id);

-- ============================================================================
-- REVIEWS TABLE RLS
-- ============================================================================
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can read reviews
CREATE POLICY reviews_select_public ON reviews FOR SELECT
  USING (TRUE);

-- Authenticated users can create reviews
CREATE POLICY reviews_insert_auth ON reviews FOR INSERT
  WITH CHECK (auth.uid() = reviewer_id);

-- Reviewers can update their own reviews
CREATE POLICY reviews_update_own ON reviews FOR UPDATE
  USING (auth.uid() = reviewer_id)
  WITH CHECK (auth.uid() = reviewer_id);

-- ============================================================================
-- TRUST REPORTS TABLE RLS
-- ============================================================================
ALTER TABLE trust_reports ENABLE ROW LEVEL SECURITY;

-- Users can see reports they made
CREATE POLICY reports_select_own ON trust_reports FOR SELECT
  USING (auth.uid() = reporter_id);

-- Authenticated users can create reports
CREATE POLICY reports_insert_auth ON trust_reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- Admins would have special access (implement via role checks)
-- CREATE POLICY reports_select_admin ON trust_reports FOR SELECT
--   USING ('admin' = ANY(auth.jwt()->>'roles'::text[]));

-- ============================================================================
-- FAVORITES TABLE RLS
-- ============================================================================
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Users can see their own favorites
CREATE POLICY favorites_select_own ON favorites FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own favorites
CREATE POLICY favorites_insert_own ON favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own favorites
CREATE POLICY favorites_delete_own ON favorites FOR DELETE
  USING (auth.uid() = user_id);
