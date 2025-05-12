from rest_framework import generics, serializers
from .models import PackingSession, PackingInventory
from finished_product.models import FinishedProduct
from .serializers import PackingSessionSerializer, PackingSessionHistorySerializer, PackingInventorySerializer

class PackingSessionCreateView(generics.CreateAPIView):
    queryset = PackingSession.objects.all()
    serializer_class = PackingSessionSerializer

    def perform_create(self, serializer):
       try:
        session_data = serializer.validated_data
        product = session_data['finished_product']

        total_to_pack = (
            session_data['number_of_6_packs'] * 6 +
            session_data['number_of_12_packs'] * 12 +
            session_data['extra_items']
        )

        if product.available_quantity < total_to_pack:
            raise serializers.ValidationError(
                f"Cannot pack {total_to_pack} items. Only {product.available_quantity} available."
            )

        session = serializer.save()
        product.available_quantity -= total_to_pack
        product.save()

        inventory, _ = PackingInventory.objects.get_or_create(finished_product=product)
        inventory.update_from_session(session)

       except serializers.ValidationError as ve:
        print("❌ Validation error:", ve)
        raise ve
       except Exception as e:
        print("❌ Other error:", e)
        raise serializers.ValidationError("Unexpected error: " + str(e))

class PackingSessionListView(generics.ListAPIView):
    """
    Returns a list of all packing sessions with history, ordered by date.
    """
    queryset = PackingSession.objects.all().order_by('-date')
    serializer_class = PackingSessionHistorySerializer


class PackingInventoryListView(generics.ListAPIView):
    """
    Returns a list of all packing inventory items with product details.
    """
    queryset = PackingInventory.objects.all()
    serializer_class = PackingInventorySerializer

    def get_queryset(self):
        """
        Optionally filter by product name or minimum quantity.
        """
        queryset = PackingInventory.objects.all().select_related('finished_product__cutting_record')

        # Filter by product name if provided
        product_name = self.request.query_params.get('product_name', None)
        if product_name:
            queryset = queryset.filter(finished_product__cutting_record__product_name__icontains=product_name)

        # Filter by minimum quantity if provided
        min_quantity = self.request.query_params.get('min_quantity', None)
        if min_quantity and min_quantity.isdigit():
            # This is a bit complex since total_quantity is a property
            # We'll filter in Python instead
            min_qty = int(min_quantity)
            filtered_queryset = []
            for item in queryset:
                if item.total_quantity >= min_qty:
                    filtered_queryset.append(item)
            return filtered_queryset

        return queryset


class ProductPackingSessionsView(generics.ListAPIView):
    """
    Returns a list of packing sessions for a specific product.
    """
    serializer_class = PackingSessionHistorySerializer

    def get_queryset(self):
        """
        Filter packing sessions by product ID.
        """
        product_id = self.kwargs.get('product_id')
        if not product_id:
            return PackingSession.objects.none()

        return PackingSession.objects.filter(
            finished_product_id=product_id
        ).order_by('-date')


class ProductPackingInventoryView(generics.RetrieveAPIView):
    """
    Returns the packing inventory for a specific product.
    """
    serializer_class = PackingInventorySerializer

    def get_object(self):
        """
        Get the packing inventory for a specific product.
        """
        product_id = self.kwargs.get('product_id')
        if not product_id:
            return None

        try:
            # Try to get the inventory for this product
            inventory = PackingInventory.objects.get(finished_product_id=product_id)
            return inventory
        except PackingInventory.DoesNotExist:
            # If no inventory exists, create a default response
            # We'll handle this in the serializer
            return {
                'finished_product_id': product_id,
                'number_of_6_packs': 0,
                'number_of_12_packs': 0,
                'extra_items': 0,
                'total_quantity': 0
            }
