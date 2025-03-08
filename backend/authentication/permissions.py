from rest_framework.permissions import BasePermission

class IsOwner(BasePermission):
    def has_permission(self, request, view):
        return request.user.role.name == 'Owner'

class IsInventoryManager(BasePermission):
    def has_permission(self, request, view):
        return request.user.role.name == 'Inventory Manager'

class IsOrderCoordinator(BasePermission):
    def has_permission(self, request, view):
        return request.user.role.name == 'Order Coordinator'

class IsSalesTeam(BasePermission):
    def has_permission(self, request, view):
        return request.user.role.name == 'Sales Team'
