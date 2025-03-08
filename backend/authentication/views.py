

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken


from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import CustomTokenObtainPairSerializer

from rest_framework.permissions import IsAuthenticated
from .permissions import IsOwner, IsInventoryManager, IsOrderCoordinator, IsSalesTeam

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

        # Check if username or password is missing
        if not username or not password:
            return Response({
                'data': None,
                'error': 'Username and password are required'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Check if the user already exists
        if User.objects.filter(username=username).exists():
            return Response({
                'data': None,
                'error': 'User already exists'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Create the user if they don't exist
        user = User.objects.create_user(username=username, password=password)
        
        return Response({
            'data': {'message': 'User created successfully'}
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