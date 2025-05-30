

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics
from django.contrib.auth.models import User
from .models import Role
from django.contrib.auth import authenticate
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from django.conf import settings


from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import CustomTokenObtainPairSerializer, UserSerializer

from rest_framework.permissions import IsAuthenticated, AllowAny
from .permissions import IsOwner, IsInventoryManager, IsOrderCoordinator, IsSalesTeam

User = get_user_model()

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class SomeView(APIView):
    permission_classes = [IsAuthenticated, IsOwner]  # Only owners can access this view

    def get(self, request):
        return Response({"message": "You are an owner!"}, status=status.HTTP_200_OK)

class InventoryView(APIView):
    permission_classes = [IsAuthenticated, IsInventoryManager]  # Only Inventory Managers can access this view

    def get(self, request):
        return Response({"message": "You are an inventory manager!"}, status=status.HTTP_200_OK)

# Generate JWT Token
def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }

class RegisterView(APIView):
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        role_name = request.data.get('role')  # Expecting a role from frontend

        if not username or not password or not role_name:
            return Response({
                'data': None,
                'error': 'Username, password, and role are required'
            }, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username=username).exists():
            return Response({
                'data': None,
                'error': 'User already exists'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Fetch the role from the database
        try:
           role = Role.objects.get(name=role_name)  # Use "name" instead of "role_name"
# Assuming Role model has role_name field
        except Role.DoesNotExist:
            return Response({
                'data': None,
                'error': 'Invalid role specified'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Create user with assigned role
        user = User.objects.create_user(username=username, password=password)
        user.role = role  # Assuming your User model has a foreign key to Role
        user.save()

        return Response({
            'data': {'message': 'User created successfully', 'role': role_name}
        }, status=status.HTTP_201_CREATED)

class LoginView(APIView):
    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")

        # Authenticate user
        user = authenticate(username=username, password=password)
        if user is None:
            return Response(
                {"error": "Invalid credentials"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Generate JWT token
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)

        # Get the user's role (Assuming role is saved in CustomUser)
        role = user.role.name  # This assumes the role is a field in your CustomUser model

        return Response(
            {
                "access": access_token,
                "role": role,  # Send the role to the frontend
            },
            status=status.HTTP_200_OK,
        )

class UserListView(generics.ListAPIView):
    """
    API endpoint that allows users to be viewed.
    Only accessible by users with Owner role.
    """
    permission_classes = [IsAuthenticated, IsOwner]
    serializer_class = UserSerializer
    queryset = User.objects.all().order_by('-date_joined')

class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    API endpoint that allows a user to be viewed, updated, or deleted.
    Only accessible by users with Owner role.
    """
    permission_classes = [IsAuthenticated, IsOwner]
    serializer_class = UserSerializer
    queryset = User.objects.all()

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()

        # Handle password separately if provided
        password = request.data.get('password', None)
        if password:
            instance.set_password(password)

        # Handle role if provided
        role_name = request.data.get('role', None)
        if role_name:
            try:
                role = Role.objects.get(name=role_name)
                instance.role = role
            except Role.DoesNotExist:
                return Response(
                    {"error": "Invalid role specified"},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Handle other fields
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        # Save the instance with password if it was changed
        if password or role_name:
            instance.save()

        return Response(serializer.data)


class HealthCheckView(APIView):
    """
    Simple health check endpoint to verify the API is working.
    This endpoint is public and does not require authentication.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({
            "status": "ok",
            "message": "Pri Fashion API is running",
            "version": "1.0.0",
            "environment": "production" if not settings.DEBUG else "development"
        }, status=status.HTTP_200_OK)