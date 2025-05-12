# finished_product/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.generics import ListAPIView
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from finished_product.serializers import (
    FinishedProductApprovalSerializer,
    FinishedProductImageSerializer,
    FinishedProductReportSerializer,
    SalesProductSerializer,
    ProductImageSerializer
)
from finished_product.models import FinishedProduct, ProductImage
from packing_app.models import PackingInventory
from django.shortcuts import get_object_or_404

class ApproveFinishedProductView(APIView):
    """
    Owner approval endpoint: Allows provisional approval of a finished product.
    """
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request, format=None):
        serializer = FinishedProductApprovalSerializer(data=request.data)
        if serializer.is_valid():
            finished_product = serializer.save()
            return Response({
                "message": "Product approved provisionally.",
                "finished_product_id": finished_product.id
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class FinishedProductReportView(ListAPIView):
    queryset = FinishedProduct.objects.all()
    serializer_class = FinishedProductReportSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context.update({"request": self.request})
        return context

class UpdateFinishedProductView(APIView):
    """
    This view updates an existing FinishedProduct record. It re-aggregates the daily sewing totals,
    so the total product quantity can change. If new manufacturing or selling prices are provided,
    they are updated; otherwise, the prices remain unchanged.
    """
    def patch(self, request, pk, format=None):
        try:
            finished_product = FinishedProduct.objects.get(pk=pk)
        except FinishedProduct.DoesNotExist:
            return Response({"error": "Finished product not found."}, status=status.HTTP_404_NOT_FOUND)

        # Update prices only if provided in the request data.
        if "manufacture_price" in request.data:
            finished_product.manufacture_price = request.data["manufacture_price"]
        if "selling_price" in request.data:
            finished_product.selling_price = request.data["selling_price"]

        # Re-aggregate totals from the current sewing records.
        finished_product.update_totals()

        finished_product.save()
        return Response({"message": "Finished product updated successfully."}, status=status.HTTP_200_OK)



class FinishedProductStatusView(APIView):
    """
    Returns whether a cutting record has already been approved,
    and if so, the approved price info.
    """
    def get(self, request, cutting_record_id, format=None):
        try:
            product = FinishedProduct.objects.get(cutting_record__id=cutting_record_id)
            response_data = {
                "is_approved": True,
                "manufacture_price": product.manufacture_price,
                "selling_price": product.selling_price
            }

            # Add product image URL if available
            if product.product_image:
                response_data["product_image"] = request.build_absolute_uri(product.product_image.url)

            return Response(response_data, status=status.HTTP_200_OK)
        except FinishedProduct.DoesNotExist:
            return Response({"is_approved": False}, status=status.HTTP_200_OK)


class UpdateProductImageView(APIView):
    """
    Endpoint for updating just the product image of a finished product.
    This is used by owners to add or update product images after approval.
    """
    parser_classes = (MultiPartParser, FormParser)

    def patch(self, request, pk, format=None):
        try:
            finished_product = FinishedProduct.objects.get(pk=pk)
        except FinishedProduct.DoesNotExist:
            return Response({"error": "Finished product not found."}, status=status.HTTP_404_NOT_FOUND)

        # Check if product_image is in the request data
        if 'product_image' not in request.data:
            return Response({"error": "No image provided."}, status=status.HTTP_400_BAD_REQUEST)

        # Update the product image
        finished_product.product_image = request.data['product_image']
        finished_product.save()

        # Return success response with image URL
        image_url = None
        if finished_product.product_image:
            image_url = request.build_absolute_uri(finished_product.product_image.url)

        return Response({
            "message": "Product image updated successfully.",
            "product_image": image_url
        }, status=status.HTTP_200_OK)


class SalesProductListView(ListAPIView):
    """
    API endpoint for the sales team to view products with images, stock levels, and prices.
    """
    serializer_class = SalesProductSerializer

    def get_queryset(self):
        # Return all products that have a selling price, regardless of provisional status
        return FinishedProduct.objects.filter(
            selling_price__isnull=False
        ).order_by('-approval_date')

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context.update({"request": self.request})
        return context


class UploadProductImageView(APIView):
    """
    API endpoint for uploading a single product image.
    """
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request, pk, format=None):
        try:
            # Get the finished product
            finished_product = get_object_or_404(FinishedProduct, pk=pk)

            # Check if image is in the request data
            if 'image' not in request.FILES:
                return Response({"error": "No image provided."}, status=status.HTTP_400_BAD_REQUEST)

            # Get the image file
            image_file = request.FILES['image']

            # Create a new ProductImage instance
            order = ProductImage.objects.filter(finished_product=finished_product).count()
            product_image = ProductImage.objects.create(
                finished_product=finished_product,
                image=image_file,
                order=order
            )

            # Return the image URL
            return Response({
                "message": "Image uploaded successfully.",
                "image_url": request.build_absolute_uri(product_image.image.url)
            }, status=status.HTTP_201_CREATED)

        except FinishedProduct.DoesNotExist:
            return Response({"error": "Finished product not found."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UploadMultipleProductImagesView(APIView):
    """
    API endpoint for uploading multiple product images at once.
    """
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request, pk, format=None):
        try:
            # Get the finished product
            finished_product = get_object_or_404(FinishedProduct, pk=pk)

            # Check if images are in the request data
            if not request.FILES:
                return Response({"error": "No images provided."}, status=status.HTTP_400_BAD_REQUEST)

            # Get the current highest order value
            current_order = ProductImage.objects.filter(finished_product=finished_product).count()

            # Process each image file
            image_urls = []
            for key, image_file in request.FILES.items():
                # Create a new ProductImage instance
                product_image = ProductImage.objects.create(
                    finished_product=finished_product,
                    image=image_file,
                    order=current_order
                )
                current_order += 1

                # Add the image URL to the list
                image_urls.append(request.build_absolute_uri(product_image.image.url))

            # Return the image URLs
            return Response({
                "message": f"{len(image_urls)} images uploaded successfully.",
                "image_urls": image_urls
            }, status=status.HTTP_201_CREATED)

        except FinishedProduct.DoesNotExist:
            return Response({"error": "Finished product not found."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class FinishedProductCuttingRecordView(APIView):
    """
    API endpoint to get the cutting record ID for a finished product.
    """
    def get(self, request, pk, format=None):
        try:
            # Get the finished product
            finished_product = get_object_or_404(FinishedProduct, pk=pk)

            # Return the cutting record ID
            return Response({
                "cutting_record_id": finished_product.cutting_record.id
            }, status=status.HTTP_200_OK)

        except FinishedProduct.DoesNotExist:
            return Response({"error": "Finished product not found."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
