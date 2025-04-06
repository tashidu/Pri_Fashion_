from rest_framework import generics, serializers
from .models import PackingSession, PackingInventory
from finished_product.models import FinishedProduct
from .serializers import PackingSessionSerializer

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

    
    