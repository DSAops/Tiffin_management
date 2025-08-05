# Test import availability
KIVY_AVAILABLE = False
MODULES_AVAILABLE = False

try:
    from kivymd.app import MDApp
    from kivymd.uix.screenmanager import MDScreenManager
    from kivymd.theming import ThemableBehavior
    KIVY_AVAILABLE = True
    print("✅ Kivy/KivyMD available")
except ImportError as e:
    print(f"❌ Kivy/KivyMD not available: {e}")

try:
    from storage import Storage
    from api import APIClient
    MODULES_AVAILABLE = True
    print("✅ Core modules available")
except ImportError as e:
    print(f"❌ Core modules missing: {e}")

if KIVY_AVAILABLE:
    try:
        from screens.auth import AuthScreen
        from screens.dashboard import DashboardScreen
        from screens.settings import SettingsScreen
        print("✅ Screen modules available")
    except ImportError as e:
        print(f"❌ Screen modules missing: {e}")
        KIVY_AVAILABLE = False

print(f"Final status - KIVY_AVAILABLE: {KIVY_AVAILABLE}, MODULES_AVAILABLE: {MODULES_AVAILABLE}")
