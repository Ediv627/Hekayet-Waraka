
-- RPC: Track order by id + phone (returns order + items)
CREATE OR REPLACE FUNCTION public.get_order_tracking(_order_id uuid, _phone text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _order public.orders%ROWTYPE;
  _items jsonb;
BEGIN
  SELECT * INTO _order
  FROM public.orders
  WHERE id = _order_id AND customer_phone = _phone;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT COALESCE(jsonb_agg(to_jsonb(oi.*) ORDER BY oi.created_at), '[]'::jsonb)
  INTO _items
  FROM public.order_items oi
  WHERE oi.order_id = _order.id;

  RETURN jsonb_build_object(
    'id', _order.id,
    'customer_name', _order.customer_name,
    'customer_phone', _order.customer_phone,
    'governorate', _order.governorate,
    'city', _order.city,
    'full_address', _order.full_address,
    'payment_method', _order.payment_method,
    'subtotal', _order.subtotal,
    'delivery_fee', _order.delivery_fee,
    'total', _order.total,
    'status', _order.status,
    'notes', _order.notes,
    'created_at', _order.created_at,
    'updated_at', _order.updated_at,
    'items', _items
  );
END;
$$;

-- RPC: Cancel order by id + phone, only if status = pending
CREATE OR REPLACE FUNCTION public.cancel_order_by_phone(_order_id uuid, _phone text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _current_status public.order_status;
BEGIN
  SELECT status INTO _current_status
  FROM public.orders
  WHERE id = _order_id AND customer_phone = _phone;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_found');
  END IF;

  IF _current_status <> 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_cancellable', 'status', _current_status);
  END IF;

  UPDATE public.orders
  SET status = 'cancelled', updated_at = now()
  WHERE id = _order_id AND customer_phone = _phone AND status = 'pending';

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Grants
GRANT EXECUTE ON FUNCTION public.get_order_tracking(uuid, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_order_by_phone(uuid, text) TO anon, authenticated;
