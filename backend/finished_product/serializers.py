# finished_product/serializers.py
from rest_framework import serializers
from finished_product.models import FinishedProduct, ProductImage
from cutting.models import CuttingRecord
from packing_app.models import PackingInventory

class ProductImageSerializer(serializers.ModelSerializer):
    """
    Serializer for the ProductImage model.
    """
    class Meta:
        model = ProductImage
        fields = ['id', 'image', 'order']


class FinishedProductApprovalSerializer(serializers.ModelSerializer):
    # Allow the owner to provide a cutting record ID.
    cutting_record = serializers.IntegerField(write_only=True)
    product_images = serializers.ListField(
        child=serializers.ImageField(max_length=None, allow_empty_file=False, use_url=False),
        write_only=True,
        required=False
    )
    firebase_image_urls = serializers.ListField(
        child=serializers.URLField(),
        write_only=True,
        required=False
    )
    product_image_url = serializers.URLField(write_only=True, required=False)
    notes = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = FinishedProduct
        fields = [
            'cutting_record', 'manufacture_price', 'selling_price',
            'product_image', 'product_images', 'notes',
            'firebase_image_urls', 'product_image_url'
        ]

    def create(self, validated_data):
        cutting_record_id = validated_data.pop('cutting_record')
        try:
            cutting_record = CuttingRecord.objects.get(pk=cutting_record_id)
        except CuttingRecord.DoesNotExist:
            raise serializers.ValidationError("Cutting record not found.")

        if hasattr(cutting_record, 'finished_product'):
            raise serializers.ValidationError("This batch has already been approved.")

        # Extract product images if provided (traditional file upload)
        product_images = validated_data.pop('product_images', [])

        # Extract Firebase image URLs if provided
        firebase_image_urls = validated_data.pop('firebase_image_urls', [])

        # Extract single product image if provided (for backward compatibility)
        product_image = validated_data.pop('product_image', None)

        # Extract single product image URL if provided (for Firebase)
        product_image_url = validated_data.pop('product_image_url', None)

        # Create the finished product
        finished_product = FinishedProduct.objects.create(
            cutting_record=cutting_record,
            manufacture_price=validated_data.get('manufacture_price'),
            selling_price=validated_data.get('selling_price'),
            product_image=product_image if not product_images and not firebase_image_urls else None,  # Only use if no multiple images
            notes=validated_data.get('notes', ''),
            is_provisional=True  # Mark as provisional.
        )

        # If we have a product_image_url but no firebase_image_urls, create a ProductImage for it
        if product_image_url and not firebase_image_urls:
            ProductImage.objects.create(
                finished_product=finished_product,
                external_url=product_image_url,
                order=0
            )

        # Create ProductImage instances for each uploaded image (traditional file upload)
        for i, image in enumerate(product_images):
            ProductImage.objects.create(
                finished_product=finished_product,
                image=image,
                order=i
            )

        # Create ProductImage instances for each Firebase URL
        for i, url in enumerate(firebase_image_urls):
            # Create a ProductImage with the external URL
            ProductImage.objects.create(
                finished_product=finished_product,
                external_url=url,  # This assumes you've added an external_url field to ProductImage
                order=i + len(product_images)  # Continue numbering after file uploads
            )

        finished_product.update_totals()  # Aggregate the sewing totals.
        return finished_product


class FinishedProductReportSerializer(serializers.ModelSerializer):
    total_clothing = serializers.SerializerMethodField()
    product_name = serializers.SerializerMethodField()
    product_image = serializers.SerializerMethodField()

    class Meta:
        model = FinishedProduct
        fields = [
            'id',
            'product_name',
            'manufacture_price',
            'selling_price',
            'total_sewn_xs',
            'total_sewn_s',
            'total_sewn_m',
            'total_sewn_l',
            'total_sewn_xl',
            'approval_date',
            'total_clothing',
            'product_image'
        ]

    def get_total_clothing(self, obj):
        return (
            (obj.total_sewn_xs or 0) +
            (obj.total_sewn_s or 0) +
            (obj.total_sewn_m or 0) +
            (obj.total_sewn_l or 0) +
            (obj.total_sewn_xl or 0)
        )

    def get_product_name(self, obj):
        # Derive the product name from the linked cutting record.
        if obj.cutting_record.product_name:
            return obj.cutting_record.product_name
        else:
            return f"{obj.cutting_record.fabric_definition.fabric_name} cut on {obj.cutting_record.cutting_date}"

    def get_product_image(self, obj):
        # Return the image URL if available
        request = self.context.get('request')
        if obj.product_image and request:
            return request.build_absolute_uri(obj.product_image.url)
        return None


class FinishedProductImageSerializer(serializers.ModelSerializer):
    """
    Serializer for updating just the product image of a finished product.
    """
    class Meta:
        model = FinishedProduct
        fields = ['product_image']


class SalesProductSerializer(serializers.ModelSerializer):
    """
    Serializer for the sales team product view.
    Includes product images, stock levels, and selling price.
    """
    product_name = serializers.SerializerMethodField()
    product_image = serializers.SerializerMethodField()
    product_images = serializers.SerializerMethodField()
    packing_inventory = serializers.SerializerMethodField()
    available_quantity = serializers.IntegerField(read_only=True)

    class Meta:
        model = FinishedProduct
        fields = [
            'id',
            'product_name',
            'selling_price',
            'product_image',
            'product_images',
            'available_quantity',
            'packing_inventory',
            'notes'
        ]

    def get_product_name(self, obj):
        if obj.cutting_record.product_name:
            return obj.cutting_record.product_name
        else:
            return f"{obj.cutting_record.fabric_definition.fabric_name} cut on {obj.cutting_record.cutting_date}"

    def get_product_image(self, obj):
        """
        Returns the primary product image URL (first image or legacy image).
        """
        request = self.context.get('request')

        # First try to get images from the ProductImage model
        images = obj.images.all()
        if images.exists():
            first_image = images.first()
            if first_image.external_url:
                # External URLs (like Firebase) don't need to be built with request
                return first_image.external_url
            elif first_image.image and request:
                return request.build_absolute_uri(first_image.image.url)

        # Fall back to the legacy product_image field
        if obj.product_image and request:
            return request.build_absolute_uri(obj.product_image.url)

        return None

    def get_product_images(self, obj):
        """
        Returns a list of all product image URLs.
        """
        request = self.context.get('request')
        if not request:
            return []

        # Get images from the ProductImage model
        image_urls = []
        for img in obj.images.all():
            if img.url:  # Use the url property which handles both image and external_url
                if img.external_url:
                    # External URLs (like Firebase) don't need to be built with request
                    image_urls.append(img.external_url)
                else:
                    image_urls.append(request.build_absolute_uri(img.image.url))

        # If no ProductImage instances, fall back to the legacy product_image
        if not image_urls and obj.product_image:
            image_urls.append(request.build_absolute_uri(obj.product_image.url))

        return image_urls

    def get_packing_inventory(self, obj):
        try:
            inventory = PackingInventory.objects.get(finished_product=obj)
            return {
                'number_of_6_packs': inventory.number_of_6_packs,
                'number_of_12_packs': inventory.number_of_12_packs,
                'extra_items': inventory.extra_items,
                'total_quantity': inventory.total_quantity
            }
        except PackingInventory.DoesNotExist:
            return {
                'number_of_6_packs': 0,
                'number_of_12_packs': 0,
                'extra_items': 0,
                'total_quantity': 0
            }
