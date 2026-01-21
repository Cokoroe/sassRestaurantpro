create table if not exists order_item_option_selections (
    id uuid primary key,
    tenant_id uuid not null,
    order_id uuid not null,
    order_item_id uuid not null,

    menu_item_id uuid not null,
    menu_option_id uuid not null,
    menu_option_value_id uuid not null,

    option_name varchar(150),
    value_name varchar(150),

    extra_price numeric(12,2) not null default 0,

    created_at timestamptz not null default now()
);

create index if not exists idx_oios_tenant on order_item_option_selections(tenant_id);
create index if not exists idx_oios_order on order_item_option_selections(order_id);
create index if not exists idx_oios_item on order_item_option_selections(order_item_id);

-- đảm bảo 1 option chỉ có 1 value trên 1 order_item
create unique index if not exists ux_oios_item_option
on order_item_option_selections(order_item_id, menu_option_id);
