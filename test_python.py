import sys
print("Python executable:", sys.executable)
print("Python version:", sys.version)
print("Python path:", sys.path[:3])

try:
    import django
    print("Django version:", django.get_version())
    print("Django location:", django.__file__)
except ImportError as e:
    print("Django import error:", e)
