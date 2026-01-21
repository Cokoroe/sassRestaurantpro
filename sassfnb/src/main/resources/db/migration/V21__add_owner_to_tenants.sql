-- V21_add_owner_to_tenants.sql

ALTER TABLE tenants
    ADD COLUMN owner_user_id uuid;

ALTER TABLE tenants
    ADD CONSTRAINT fk_tenants_owner_user
        FOREIGN KEY (owner_user_id) REFERENCES users(id);

CREATE INDEX idx_tenants_owner_user ON tenants(owner_user_id);
