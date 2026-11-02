-- =====================================================================
-- Tour Task Management System (completely new tables)
-- SPOC of a tour = tours.agent_id. Review is optional (template flag).
-- Push notifications only (push_subscriptions). Run manually.
-- =====================================================================

-- 1. Categories -------------------------------------------------------
CREATE TABLE IF NOT EXISTS task_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  color text DEFAULT '#6366f1',
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Templates (admin master data) ------------------------------------
CREATE TABLE IF NOT EXISTS task_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  step_key text NOT NULL, -- ai-builder, concierge-config, hotel-selection, activity, restaurant, transport, guide, driver, payment-receive, po-creation, finance-controlling, profit-loss, general
  category_id uuid REFERENCES task_categories(id) ON DELETE SET NULL,
  default_priority text NOT NULL DEFAULT 'medium' CHECK (default_priority IN ('low','medium','high','urgent')),
  due_offset_days int,                                   -- null = no default due date
  due_offset_basis text NOT NULL DEFAULT 'creation' CHECK (due_offset_basis IN ('creation','tour_start')),
  requires_review boolean NOT NULL DEFAULT false,
  points int NOT NULL DEFAULT 10,
  default_assignee_role text,                            -- optional: 'admin' | 'agent' | null
  auto_create_on_step boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_task_templates_step ON task_templates(step_key) WHERE is_active;

-- 3. Tasks --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tour_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_no bigint GENERATED ALWAYS AS IDENTITY,
  tour_id uuid REFERENCES tours(id) ON DELETE CASCADE,   -- null = custom non-tour task
  template_id uuid REFERENCES task_templates(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  step_key text NOT NULL DEFAULT 'general',
  context_type text,                                     -- e.g. 'purchase_order', 'hotel', 'driver'
  context_id text,
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','on_hold','in_review','completed','cancelled')),
  due_at timestamptz,
  due_offset_days int,
  due_offset_basis text CHECK (due_offset_basis IN ('creation','tour_start')),
  assigned_to uuid NOT NULL REFERENCES users(id),
  assigned_by uuid NOT NULL REFERENCES users(id),
  hold_note text,
  resume_on date,
  review_note text,
  requires_review boolean NOT NULL DEFAULT false,
  points int NOT NULL DEFAULT 10,
  started_at timestamptz,
  completed_at timestamptz,
  approved_by uuid REFERENCES users(id),
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tour_tasks_hold_note_chk CHECK (status <> 'on_hold' OR coalesce(btrim(hold_note),'') <> '')
);
CREATE INDEX IF NOT EXISTS idx_tour_tasks_assignee ON tour_tasks(assigned_to, status);
CREATE INDEX IF NOT EXISTS idx_tour_tasks_tour ON tour_tasks(tour_id);
CREATE INDEX IF NOT EXISTS idx_tour_tasks_due ON tour_tasks(due_at) WHERE status NOT IN ('completed','cancelled');

-- 4. Audit events (append-only) ---------------------------------------
CREATE TABLE IF NOT EXISTS tour_task_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tour_tasks(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES users(id),
  event_type text NOT NULL, -- created, status_changed, reassigned, due_changed, note, approved
  from_value text,
  to_value text,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tour_task_events_task ON tour_task_events(task_id, created_at);

-- 5. Comments / proof --------------------------------------------------
CREATE TABLE IF NOT EXISTS tour_task_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tour_tasks(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES users(id),
  body text,
  attachment_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tour_task_comments_content_chk CHECK (coalesce(btrim(body),'') <> '' OR attachment_url IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS idx_tour_task_comments_task ON tour_task_comments(task_id, created_at);

-- 6. Watchers ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tour_task_watchers (
  task_id uuid NOT NULL REFERENCES tour_tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, user_id)
);

-- 7. Gamification --------------------------------------------------------
CREATE TABLE IF NOT EXISTS task_points_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id uuid REFERENCES tour_tasks(id) ON DELETE SET NULL,
  tour_id uuid REFERENCES tours(id) ON DELETE SET NULL,
  points int NOT NULL,
  reason text NOT NULL, -- completed, on_time_bonus, early_bonus, streak_bonus
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (task_id, user_id, reason)
);
CREATE INDEX IF NOT EXISTS idx_points_user ON task_points_ledger(user_id, created_at);

CREATE TABLE IF NOT EXISTS task_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  icon text DEFAULT '🏅',
  criteria_type text NOT NULL, -- tasks_completed, streak_days, on_time_count
  criteria_value int NOT NULL,
  is_active boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS user_task_badges (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id uuid NOT NULL REFERENCES task_badges(id) ON DELETE CASCADE,
  awarded_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, badge_id)
);

-- 8. Push subscriptions (PWA) -------------------------------------------
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_push_subs_user ON push_subscriptions(user_id);

-- 9. Leaderboard views ---------------------------------------------------
CREATE OR REPLACE VIEW v_task_leaderboard AS
SELECT l.user_id,
       coalesce(a.first_name || ' ' || a.last_name, u.email) AS user_name,
       sum(l.points) FILTER (WHERE l.created_at >= date_trunc('week', now()))  AS points_week,
       sum(l.points) FILTER (WHERE l.created_at >= date_trunc('month', now())) AS points_month,
       sum(l.points) AS points_total,
       count(DISTINCT l.task_id) FILTER (WHERE l.reason = 'completed') AS tasks_completed
FROM task_points_ledger l
JOIN users u ON u.id = l.user_id
LEFT JOIN agent_profiles a ON a.id = l.user_id
GROUP BY l.user_id, a.first_name, a.last_name, u.email;

CREATE OR REPLACE VIEW v_tour_task_progress AS
SELECT tour_id,
       count(*) FILTER (WHERE status <> 'cancelled') AS total_tasks,
       count(*) FILTER (WHERE status = 'completed') AS completed_tasks,
       count(*) FILTER (WHERE status NOT IN ('completed','cancelled') AND due_at < now()) AS overdue_tasks,
       count(*) FILTER (WHERE status = 'on_hold') AS on_hold_tasks
FROM tour_tasks
WHERE tour_id IS NOT NULL
GROUP BY tour_id;

-- 10. RLS ---------------------------------------------------------------
-- App reads/writes via service role (createAdminClient); RLS protects direct access.
ALTER TABLE task_categories      ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_templates       ENABLE ROW LEVEL SECURITY;
ALTER TABLE tour_tasks           ENABLE ROW LEVEL SECURITY;
ALTER TABLE tour_task_events     ENABLE ROW LEVEL SECURITY;
ALTER TABLE tour_task_comments   ENABLE ROW LEVEL SECURITY;
ALTER TABLE tour_task_watchers   ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_points_ledger   ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_badges          ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_task_badges     ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions   ENABLE ROW LEVEL SECURITY;

CREATE POLICY task_categories_read ON task_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY task_categories_admin ON task_categories FOR ALL TO authenticated
  USING (get_user_role(auth.uid()) = 'admin') WITH CHECK (get_user_role(auth.uid()) = 'admin');

CREATE POLICY task_templates_read ON task_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY task_templates_admin ON task_templates FOR ALL TO authenticated
  USING (get_user_role(auth.uid()) = 'admin') WITH CHECK (get_user_role(auth.uid()) = 'admin');

CREATE POLICY tour_tasks_select ON tour_tasks FOR SELECT TO authenticated USING (
  get_user_role(auth.uid()) = 'admin'
  OR assigned_to = auth.uid() OR assigned_by = auth.uid()
  OR EXISTS (SELECT 1 FROM tours t WHERE t.id = tour_tasks.tour_id AND t.agent_id = auth.uid())
);
CREATE POLICY tour_tasks_insert ON tour_tasks FOR INSERT TO authenticated WITH CHECK (
  assigned_by = auth.uid() AND (
    get_user_role(auth.uid()) = 'admin'
    OR EXISTS (SELECT 1 FROM tours t WHERE t.id = tour_tasks.tour_id AND t.agent_id = auth.uid())
  )
);
CREATE POLICY tour_tasks_update ON tour_tasks FOR UPDATE TO authenticated USING (
  get_user_role(auth.uid()) = 'admin'
  OR assigned_to = auth.uid() OR assigned_by = auth.uid()
  OR EXISTS (SELECT 1 FROM tours t WHERE t.id = tour_tasks.tour_id AND t.agent_id = auth.uid())
);

CREATE POLICY tour_task_events_select ON tour_task_events FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM tour_tasks k WHERE k.id = tour_task_events.task_id)
);
CREATE POLICY tour_task_comments_select ON tour_task_comments FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM tour_tasks k WHERE k.id = tour_task_comments.task_id)
);
CREATE POLICY tour_task_comments_insert ON tour_task_comments FOR INSERT TO authenticated WITH CHECK (
  author_id = auth.uid() AND EXISTS (SELECT 1 FROM tour_tasks k WHERE k.id = tour_task_comments.task_id)
);
CREATE POLICY tour_task_watchers_select ON tour_task_watchers FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY points_select ON task_points_ledger FOR SELECT TO authenticated USING (true);
CREATE POLICY badges_read ON task_badges FOR SELECT TO authenticated USING (true);
CREATE POLICY user_badges_read ON user_task_badges FOR SELECT TO authenticated USING (true);
CREATE POLICY push_subs_own ON push_subscriptions FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 11. Seed ----------------------------------------------------------------
INSERT INTO task_categories (name, color, sort_order) VALUES
  ('Suppliers', '#f59e0b', 1), ('Customer', '#10b981', 2),
  ('Logistics', '#3b82f6', 3), ('Finance', '#8b5cf6', 4)
ON CONFLICT (name) DO NOTHING;

INSERT INTO task_templates (title, description, step_key, category_id, default_priority, due_offset_days, due_offset_basis, points)
SELECT v.title, v.description, v.step_key, c.id, v.prio, v.days, v.basis, v.pts
FROM (VALUES
  ('Call hotel and negotiate rates','Negotiate final contracted rate with the hotel.','hotel-selection','Suppliers','high',-30,'tour_start',15),
  ('Send PO to supplier and get acceptance','Send the purchase order and obtain written acceptance.','po-creation','Suppliers','medium',-21,'tour_start',10),
  ('Confirm activity booking with vendor','Confirm date, time and pax with the activity vendor.','activity','Suppliers','medium',-14,'tour_start',10),
  ('Confirm restaurant reservation','Confirm reservation, menu and head count.','restaurant','Suppliers','medium',-7,'tour_start',10),
  ('Confirm vehicle and driver','Confirm vehicle, driver and pickup details.','transport','Logistics','high',-7,'tour_start',10),
  ('Brief the tour guide','Share itinerary and guest notes with the guide.','guide','Logistics','medium',-3,'tour_start',10),
  ('Call customer to quote invoice number when paying','Ask the customer to include the invoice number in the payment reference.','payment-receive','Customer','medium',2,'creation',10),
  ('Collect customer advance payment','Follow up and confirm the advance payment is received.','payment-receive','Customer','high',7,'creation',15),
  ('Upload supplier payment slip','Upload the payment slip after paying the supplier.','finance-controlling','Finance','medium',3,'creation',10),
  ('Review profit and loss before closing','Check P&L and settle outstanding items.','profit-loss','Finance','medium',3,'creation',10),
  ('Review AI builder itinerary with customer','Confirm itinerary and preferences with the customer.','ai-builder','Customer','medium',2,'creation',10),
  ('Confirm concierge services','Confirm concierge items and costs.','concierge-config','Customer','low',3,'creation',5)
) AS v(title, description, step_key, cat, prio, days, basis, pts)
JOIN task_categories c ON c.name = v.cat
WHERE NOT EXISTS (SELECT 1 FROM task_templates t WHERE t.title = v.title);

INSERT INTO task_badges (code, name, description, icon, criteria_type, criteria_value) VALUES
  ('first_task','First Step','Completed your first task','🚀','tasks_completed',1),
  ('ten_tasks','Getting Rolling','Completed 10 tasks','⚡','tasks_completed',10),
  ('fifty_tasks','Workhorse','Completed 50 tasks','🏆','tasks_completed',50),
  ('streak_5','5-Day Streak','Completed tasks 5 days in a row','🔥','streak_days',5),
  ('on_time_20','Punctual','20 tasks completed on time','⏰','on_time_count',20)
ON CONFLICT (code) DO NOTHING;
