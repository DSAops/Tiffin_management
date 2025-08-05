from kivymd.app import MDApp
from kivymd.uix.screenmanager import MDScreenManager
from storage import Storage
from api import APIClient
from screens.onboarding_new import OnboardingScreen
from screens.dashboard_new import DashboardScreen
from screens.settings_new import SettingsScreen

class TiffinManagerApp(MDApp):
    def build(self):
        self.title = "Tiffin Manager"
        self.theme_cls.theme_style = "Light"
        self.theme_cls.primary_palette = "Blue"
        
        # Initialize storage and API
        self.storage = Storage()
        self.api = APIClient(self.storage)
        
        # Screen manager
        self.sm = MDScreenManager()
        self.register_screens()
        return self.sm

    def register_screens(self):
        self.sm.add_widget(OnboardingScreen(name="onboarding"))
        self.sm.add_widget(DashboardScreen(name="dashboard"))
        self.sm.add_widget(SettingsScreen(name="settings"))

    def on_start(self):
        # Check if user is logged in
        if self.storage.has_user():
            self.sm.current = "dashboard"
        else:
            self.sm.current = "onboarding"

if __name__ == "__main__":
    TiffinManagerApp().run()
