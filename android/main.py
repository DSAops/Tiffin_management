"""
Professional Tiffin Management System
A modern Android app built with KivyMD for managing daily tiffin deliveries
"""

import sys
import os

# Check if Kivy/KivyMD are available
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

# Try to import our modules
try:
    from storage import Storage
    from api import APIClient
    MODULES_AVAILABLE = True
    print("✅ Core modules available")
except ImportError as e:
    print(f"❌ Core modules missing: {e}")

# Try to import screen modules (only if Kivy is available)
if KIVY_AVAILABLE:
    try:
        from screens.auth import AuthScreen
        from screens.dashboard import DashboardScreen
        from screens.settings import SettingsScreen
        print("✅ Screen modules available")
    except ImportError as e:
        print(f"❌ Screen modules missing: {e}")
        KIVY_AVAILABLE = False

if KIVY_AVAILABLE:
    class TiffinManagerApp(MDApp):
        def build(self):
            self.title = "Tiffin Manager"
            
            # Professional theme
            self.theme_cls.theme_style = "Light"
            self.theme_cls.primary_palette = "DeepPurple"
            self.theme_cls.accent_palette = "Amber"
            self.theme_cls.material_style = "M3"
            
            # Initialize storage and API
            self.storage = Storage()
            self.api = APIClient(self.storage)
            
            # Screen manager
            self.sm = MDScreenManager()
            self.register_screens()
            return self.sm

        def register_screens(self):
            self.sm.add_widget(AuthScreen(name="auth"))
            self.sm.add_widget(DashboardScreen(name="dashboard"))
            self.sm.add_widget(SettingsScreen(name="settings"))

        def on_start(self):
            # Check if user is logged in
            if self.storage.has_user():
                self.sm.current = "dashboard"
            else:
                self.sm.current = "auth"
        
        def logout(self):
            """Logout user and return to auth screen"""
            self.storage.clear()
            self.sm.current = "auth"
else:
    # Dummy class for when Kivy is not available
    TiffinManagerApp = None

def main():
    """Main entry point - chooses between GUI and console interface"""
    if not MODULES_AVAILABLE:
        print("❌ Required modules are not available!")
        print("Please install dependencies: pip install httpx python-dotenv")
        return
        
    if KIVY_AVAILABLE:
        print("🎨 Starting Professional Tiffin Management GUI...")
        try:
            import traceback
            app = TiffinManagerApp()
            app.run()
        except Exception as e:
            print(f"❌ GUI failed to start: {e}")
            print("Full error details:")
            traceback.print_exc()
            print("\n🔄 Falling back to console interface...")
            from console_app import main as console_main
            console_main()
    else:
        print("📱 Starting console interface...")
        print("💡 To use the GUI version, install Kivy: pip install kivy kivymd")
        
        # Import and run console version
        from console_app import main as console_main
        console_main()

if __name__ == "__main__":
    main()
