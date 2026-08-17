--

-- Create unique index on packages for courier + tracking_number + customer_id
-- This prevents duplicate packages with the same courier and tracking number
-- when using customerId. The customerName case is handled at application level
-- via the PACKAGE_DUPLICATE check in jastipin-service.ts.
--
CREATE UNIQUE INDEX packages_unique_courier_tracking_customer_id ON public.packages
(
  courier,
  tracking_number,
  customer_id
) WHERE customer_id IS NOT NULL;

--
-- Add comment documenting the constraint
--
COMMENT ON INDEX packages_unique_courier_tracking_customer_id IS
'Unique constraint on (courier, tracking_number, customer_id) to prevent duplicate packages. ' ||
'Duplicate check for customerName is handled at application level.';