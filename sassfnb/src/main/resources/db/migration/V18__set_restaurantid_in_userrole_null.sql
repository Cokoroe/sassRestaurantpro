ALTER TABLE user_roles
    ALTER COLUMN restaurant_id DROP NOT NULL;

ALTER TABLE user_roles
    ALTER COLUMN outlet_id DROP NOT NULL;