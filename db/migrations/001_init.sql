CREATE TABLE apps (
  id                    bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name                  text NOT NULL UNIQUE,
  repo                  text NOT NULL,
  branch                text NOT NULL,
  auto_deploy           boolean NOT NULL DEFAULT true,
  build_command         text,
  start_command         text,
  release_command       text,
  database_name         text,
  database_password     text,
  last_seen_sha         text,
  github_etag           text,
  poll_error            text,
  current_deployment_id bigint,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT apps_name_format CHECK (name ~ '^[a-z0-9]([a-z0-9-]{0,38}[a-z0-9])?$')
);

CREATE TABLE env_vars (
  app_id bigint NOT NULL REFERENCES apps (id) ON DELETE CASCADE,
  key    text NOT NULL,
  value  text NOT NULL,
  PRIMARY KEY (app_id, key),
  CONSTRAINT env_vars_key_format CHECK (key ~ '^[A-Za-z_][A-Za-z0-9_]*$')
);

CREATE TABLE deployments (
  id             bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  app_id         bigint NOT NULL REFERENCES apps (id) ON DELETE CASCADE,
  commit_sha     text NOT NULL,
  commit_message text,
  commit_author  text,
  trigger        text NOT NULL,
  status         text NOT NULL DEFAULT 'queued',
  image          text,
  container_name text,
  host_port      integer,
  error          text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  started_at     timestamptz,
  finished_at    timestamptz,
  CONSTRAINT deployments_trigger_check
    CHECK (trigger IN ('initial', 'push', 'webhook', 'manual', 'redeploy', 'config')),
  CONSTRAINT deployments_status_check
    CHECK (status IN ('queued', 'cloning', 'building', 'releasing', 'starting', 'live', 'failed', 'superseded', 'cancelled'))
);

ALTER TABLE apps
  ADD CONSTRAINT apps_current_deployment_fk
  FOREIGN KEY (current_deployment_id) REFERENCES deployments (id) ON DELETE SET NULL;

CREATE INDEX deployments_app_idx ON deployments (app_id, id DESC);
CREATE INDEX deployments_queued_idx ON deployments (id) WHERE status = 'queued';
CREATE UNIQUE INDEX deployments_one_live_per_app ON deployments (app_id) WHERE status = 'live';

CREATE TABLE deployment_logs (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  deployment_id bigint NOT NULL REFERENCES deployments (id) ON DELETE CASCADE,
  kind          text NOT NULL DEFAULT 'build',
  line          text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT deployment_logs_kind_check CHECK (kind IN ('step', 'build', 'error'))
);

CREATE INDEX deployment_logs_deployment_idx ON deployment_logs (deployment_id, id);

-- Single row the runner refreshes every few seconds, so the dashboard knows it is alive.
CREATE TABLE runner_heartbeat (
  id               integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  seen_at          timestamptz NOT NULL,
  apps_port        integer NOT NULL,
  poll_interval_ms integer NOT NULL,
  github_user      text
);
