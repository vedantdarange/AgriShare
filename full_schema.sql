-- --- Extensions --- --
CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; 


-- --- Profiles --- --

      create table if not exists public.profiles(
    id uuid references auth.users not null primary key,
    full_name text,
    phone text,
    role text check(role in ('buyer', 'seller')),
    address text,
    verified_farmer boolean default false,
    created_at timestamp with time zone default timezone('utc':: text, now()) not null
      );
      alter table public.profiles enable row level security;
      drop policy if exists "Public profiles are viewable by everyone." on profiles;
      create policy "Public profiles are viewable by everyone." on profiles for select using(true);
    drop policy if exists "Users can insert their own profile." on profiles;
      create policy "Users can insert their own profile." on profiles for insert with check(auth.uid() = id);
      drop policy if exists "Users can update own profile." on profiles;
      create policy "Users can update own profile." on profiles for update using(auth.uid() = id);
    


-- --- Products --- --

      create table if not exists public.products(
      id uuid primary key default gen_random_uuid(),
      seller_id uuid references public.profiles(id) on delete cascade not null,
      title text not null,
      description text,
      price numeric not null,
      unit text not null,
      category text,
      image_url text,
      stock_quantity integer default 0,
      is_organic boolean default false,
      total_reviews integer default 0,
      avg_rating numeric(2, 1) default 0.0,
      created_at timestamp with time zone default timezone('utc':: text, now()) not null
      );
      alter table public.products enable row level security;
      drop policy if exists "Products are viewable by everyone." on products;
      create policy "Products are viewable by everyone." on products for select using(true);
    drop policy if exists "Sellers can insert their own products." on products;
      create policy "Sellers can insert their own products." on products for insert with check(auth.uid() = seller_id);
      drop policy if exists "Sellers can update their own products." on products;
      create policy "Sellers can update their own products." on products for update using(auth.uid() = seller_id);
    drop policy if exists "Sellers can delete their own products." on products;
      create policy "Sellers can delete their own products." on products for delete using(auth.uid() = seller_id);
    


-- --- Orders --- --

      create table if not exists public.orders(
      id uuid primary key default gen_random_uuid(),
      user_id uuid references public.profiles(id) on delete cascade not null,
      seller_id uuid references public.profiles(id) on delete cascade not null,
      total_amount numeric not null,
      status text default 'pending',
      delivery_address jsonb,
      payment_method text,
      created_at timestamp with time zone default timezone('utc':: text, now()) not null,
        updated_at timestamp with time zone default timezone('utc':: text, now()) not null
      );
      alter table public.orders enable row level security;
      drop policy if exists "Users can view their own orders." on orders;
      create policy "Users can view their own orders." on orders for select using(auth.uid() = user_id or auth.uid() = seller_id);
    drop policy if exists "Users can insert their own orders." on orders;
      create policy "Users can insert their own orders." on orders for insert with check(auth.uid() = user_id);
      drop policy if exists "Sellers can update orders." on orders;
      create policy "Sellers can update orders." on orders for update using(auth.uid() = seller_id);
    drop policy if exists "Users can update orders." on orders;
      create policy "Users can update orders." on orders for update using(auth.uid() = user_id);
    


-- --- OrderItems --- --

      create table if not exists public.order_items(
      id uuid primary key default gen_random_uuid(),
      order_id uuid references public.orders(id) on delete cascade not null,
      product_id uuid references public.products(id) on delete restrict not null,
      quantity integer not null,
      price_per_unit numeric not null,
      unit text not null,
      product_snapshot jsonb,
      created_at timestamp with time zone default timezone('utc':: text, now()) not null
      );
      alter table public.order_items enable row level security;
      drop policy if exists "Users view order items." on order_items;
      create policy "Users view order items." on order_items for select using(
        exists(
          select 1 from orders 
          where orders.id = order_items.order_id 
          and(orders.user_id = auth.uid() or orders.seller_id = auth.uid())
        )
      );
    drop policy if exists "Users can insert order items." on order_items;
      create policy "Users can insert order items." on order_items for insert with check(
      exists(
        select 1 from orders 
          where orders.id = order_items.order_id and orders.user_id = auth.uid()
      )
    );
  


-- --- Reviews --- --

      drop table if exists reviews cascade;
      create table reviews(
    id uuid default gen_random_uuid() primary key,
    product_id uuid references products(id) on delete cascade not null,
    buyer_id uuid references auth.users(id) on delete cascade not null,
    seller_id uuid references profiles(id) on delete cascade not null,
    rating integer not null check(rating >= 1 and rating <= 5),
    comment text,
    created_at timestamp with time zone default timezone('utc':: text, now()) not null,
      unique(product_id, buyer_id)
      );
      alter table reviews enable row level security;
      drop policy if exists "Reviews are viewable by everyone." on reviews;
      create policy "Reviews are viewable by everyone." on reviews for select using(true);
    drop policy if exists "Buyers can insert their own reviews." on reviews;
      create policy "Buyers can insert their own reviews." on reviews for insert with check(auth.uid() = buyer_id);
      drop policy if exists "Buyers can update their own reviews." on reviews;
      create policy "Buyers can update their own reviews." on reviews for update using(auth.uid() = buyer_id);
    drop policy if exists "Buyers can delete their own reviews." on reviews;
      create policy "Buyers can delete their own reviews." on reviews for delete using(auth.uid() = buyer_id);

    create or replace function update_product_rating()
      returns trigger as $$
  begin
  if (TG_OP = 'INSERT' or TG_OP = 'UPDATE') then
          update products
  set
  total_reviews = (select count(*) from reviews where product_id = NEW.product_id),
  avg_rating = (select coalesce(avg(rating), 0) from reviews where product_id = NEW.product_id)
          where id = NEW.product_id;
  return NEW;
  elsif(TG_OP = 'DELETE') then
          update products
  set
  total_reviews = (select count(*) from reviews where product_id = OLD.product_id),
  avg_rating = (select coalesce(avg(rating), 0) from reviews where product_id = OLD.product_id)
          where id = OLD.product_id;
  return OLD;
        end if;
  end;
      $$ language plpgsql;
      
      drop trigger if exists on_review_changed on reviews;
      create trigger on_review_changed
      after insert or update or delete on reviews
  for each row execute function update_product_rating();
  


-- --- Returns Enum Types --- --

      DO $$ BEGIN CREATE TYPE return_reason AS ENUM('quality_issue', 'wrong_item', 'less_quantity', 'changed_mind'); EXCEPTION WHEN duplicate_object THEN null; END $$;
      DO $$ BEGIN CREATE TYPE return_status AS ENUM('pending', 'approved', 'rejected', 'pickup_scheduled', 'refunded'); EXCEPTION WHEN duplicate_object THEN null; END $$;
      DO $$ BEGIN CREATE TYPE refund_method AS ENUM('original_payment', 'wallet'); EXCEPTION WHEN duplicate_object THEN null; END $$;
  


-- --- Returns Tables --- --

      drop table if exists return_photos cascade;
      drop table if exists return_items cascade;
      drop table if exists returns cascade;

      CREATE TABLE returns(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    seller_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    reason return_reason NOT NULL,
    description TEXT,
    status return_status DEFAULT 'pending',
    refund_method refund_method NOT NULL,
    pickup_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc':: text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc':: text, now()) NOT NULL
  );

      CREATE TABLE return_items(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    return_id UUID REFERENCES returns(id) ON DELETE CASCADE,
    order_item_id UUID REFERENCES order_items(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK(quantity > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc':: text, now()) NOT NULL
  );

      CREATE TABLE return_photos(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    return_id UUID REFERENCES returns(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc':: text, now()) NOT NULL
  );

      ALTER TABLE returns ENABLE ROW LEVEL SECURITY;
      ALTER TABLE return_items ENABLE ROW LEVEL SECURITY;
      ALTER TABLE return_photos ENABLE ROW LEVEL SECURITY;

      CREATE OR REPLACE FUNCTION update_modified_column()
      RETURNS TRIGGER AS $$
  BEGIN
  NEW.updated_at = now();
          RETURN NEW;
  END;
      $$ language 'plpgsql';

      DROP TRIGGER IF EXISTS update_returns_modtime ON returns;
      CREATE TRIGGER update_returns_modtime
      BEFORE UPDATE ON returns FOR EACH ROW EXECUTE FUNCTION update_modified_column();
  


-- --- Returns RLS --- --

      drop policy if exists "Users can view their returns" on returns;
      drop policy if exists "Users can insert returns" on returns;
      drop policy if exists "Sellers can view returns" on returns;
      drop policy if exists "Sellers can update returns" on returns;
      create policy "Users can view their returns" on returns for select using(auth.uid() = user_id);
    create policy "Users can insert returns" on returns for insert with check(auth.uid() = user_id);
      create policy "Sellers can view returns" on returns for select using(auth.uid() = seller_id);
    create policy "Sellers can update returns" on returns for update using(auth.uid() = seller_id);

    drop policy if exists "Users can view return items" on return_items;
      drop policy if exists "Users can insert return items" on return_items;
      drop policy if exists "Sellers can view return items" on return_items;
      create policy "Users can view return items" on return_items for select using(
      exists(select 1 from returns where returns.id = return_id and returns.user_id = auth.uid())
    );
    create policy "Users can insert return items" on return_items for insert with check(
      exists(select 1 from returns where returns.id = return_id and returns.user_id = auth.uid())
    );
      create policy "Sellers can view return items" on return_items for select using(
      exists(select 1 from returns where returns.id = return_id and returns.seller_id = auth.uid())
    );

    drop policy if exists "Users can view return photos" on return_photos;
      drop policy if exists "Users can insert return photos" on return_photos;
      drop policy if exists "Sellers can view return photos" on return_photos;
      create policy "Users can view return photos" on return_photos for select using(
      exists(select 1 from returns where returns.id = return_id and returns.user_id = auth.uid())
    );
    create policy "Users can insert return photos" on return_photos for insert with check(
      exists(select 1 from returns where returns.id = return_id and returns.user_id = auth.uid())
    );
      create policy "Sellers can view return photos" on return_photos for select using(
      exists(select 1 from returns where returns.id = return_id and returns.seller_id = auth.uid())
    );
    


-- --- Farms --- --

      CREATE TABLE IF NOT EXISTS public.farms(
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
      name TEXT,
      area TEXT,
      soil_type TEXT,
      description TEXT,
      photos TEXT[] DEFAULT '{}',
      crops_growing TEXT[] DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
      ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;
      drop policy if exists "Farms are viewable by everyone." on public.farms;
      CREATE POLICY "Farms are viewable by everyone." ON public.farms FOR SELECT USING(true);
      drop policy if exists "Sellers can create their own farm." on public.farms;
      CREATE POLICY "Sellers can create their own farm." ON public.farms FOR INSERT WITH CHECK(auth.uid() = seller_id);
      drop policy if exists "Sellers can update their own farm." on public.farms;
      CREATE POLICY "Sellers can update their own farm." ON public.farms FOR UPDATE USING(auth.uid() = seller_id);

      CREATE OR REPLACE FUNCTION public.update_updated_at_column()
      RETURNS TRIGGER AS $$
  BEGIN
  NEW.updated_at = NOW();
          RETURN NEW;
  END;
      $$ language 'plpgsql';

      DROP TRIGGER IF EXISTS handle_farms_updated_at ON public.farms;
      CREATE TRIGGER handle_farms_updated_at
          BEFORE UPDATE ON public.farms
          FOR EACH ROW
          EXECUTE FUNCTION public.update_updated_at_column();
  


-- --- Saved Searches --- --

      CREATE TABLE IF NOT EXISTS public.saved_searches(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    filters JSONB DEFAULT '{}':: jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
      ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;
      drop policy if exists "Users can view their own saved searches." on public.saved_searches;
      CREATE POLICY "Users can view their own saved searches." ON public.saved_searches FOR SELECT USING(auth.uid() = user_id);
      drop policy if exists "Users can insert their own saved searches." on public.saved_searches;
      CREATE POLICY "Users can insert their own saved searches." ON public.saved_searches FOR INSERT WITH CHECK(auth.uid() = user_id);
      drop policy if exists "Users can delete their own saved searches." on public.saved_searches;
      CREATE POLICY "Users can delete their own saved searches." ON public.saved_searches FOR DELETE USING(auth.uid() = user_id);
  


-- --- Wishlist --- --

      create table if not exists saved_products(
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    product_id uuid references products(id) on delete cascade not null,
    created_at timestamp with time zone default timezone('utc':: text, now()) not null,
      unique(user_id, product_id)
      );
      alter table saved_products enable row level security;
      drop policy if exists "Users can view their own saved products" on saved_products;
      create policy "Users can view their own saved products" on saved_products for select using(auth.uid() = user_id);
    drop policy if exists "Users can insert their own saved products" on saved_products;
      create policy "Users can insert their own saved products" on saved_products for insert with check(auth.uid() = user_id);
      drop policy if exists "Users can delete their own saved products" on saved_products;
      create policy "Users can delete their own saved products" on saved_products for delete using(auth.uid() = user_id);

    create table if not exists saved_sellers(
      id uuid default gen_random_uuid() primary key,
      user_id uuid references auth.users(id) on delete cascade not null,
      seller_id uuid references profiles(id) on delete cascade not null,
      created_at timestamp with time zone default timezone('utc':: text, now()) not null,
        unique(user_id, seller_id)
      );
      alter table saved_sellers enable row level security;
      drop policy if exists "Users can view their own saved sellers" on saved_sellers;
      create policy "Users can view their own saved sellers" on saved_sellers for select using(auth.uid() = user_id);
    drop policy if exists "Users can insert their own saved sellers" on saved_sellers;
      create policy "Users can insert their own saved sellers" on saved_sellers for insert with check(auth.uid() = user_id);
      drop policy if exists "Users can delete their own saved sellers" on saved_sellers;
      create policy "Users can delete their own saved sellers" on saved_sellers for delete using(auth.uid() = user_id);
    


-- --- Storage --- --

      insert into storage.buckets(id, name, public)
  values('product_images', 'product_images', true)
      on conflict(id) do nothing;
      
      insert into storage.buckets(id, name, public)
  values('return_proofs', 'return_proofs', true)
      on conflict(id) do nothing;

      insert into storage.buckets(id, name, public)
  values('farm_photos', 'farm_photos', true)
      on conflict(id) do nothing;
    
