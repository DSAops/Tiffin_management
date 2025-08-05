"""
Simple and Working GUI for Tiffin Management
Rebuilt from scratch to avoid crashes
"""

from kivymd.app import MDApp
from kivymd.uix.screen import MDScreen
from kivymd.uix.screenmanager import MDScreenManager
from kivymd.uix.boxlayout import MDBoxLayout
from kivymd.uix.card import MDCard
from kivymd.uix.label import MDLabel
from kivymd.uix.button import MDRaisedButton, MDFlatButton
from kivymd.uix.textfield import MDTextField
from kivymd.uix.selectioncontrol import MDSwitch
from kivymd.uix.scrollview import MDScrollView
from kivymd.toast import toast
from kivy.clock import Clock
from kivy.metrics import dp
import threading
import asyncio

# Import our modules
from storage import Storage
from api import APIClient

class SimpleAuthScreen(MDScreen):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.build_simple_auth()
        
    def build_simple_auth(self):
        main_layout = MDBoxLayout(
            orientation="vertical",
            spacing=dp(20),
            padding=[dp(20), dp(40), dp(20), dp(20)],
            pos_hint={"center_x": 0.5, "center_y": 0.5}
        )
        
        # Title
        title = MDLabel(
            text="🍛 Tiffin Manager",
            theme_text_color="Primary",
            font_style="H4",
            halign="center",
            size_hint_y=None,
            height=dp(60)
        )
        main_layout.add_widget(title)
        
        # Login Card
        card = MDCard(
            elevation=3,
            padding=dp(20),
            size_hint_y=None,
            height=dp(300)
        )
        
        card_layout = MDBoxLayout(
            orientation="vertical",
            spacing=dp(15)
        )
        
        # Email field
        self.email_field = MDTextField(
            hint_text="Email",
            helper_text="Enter your email address",
            helper_text_mode="on_focus"
        )
        card_layout.add_widget(self.email_field)
        
        # Password field
        self.password_field = MDTextField(
            hint_text="Password",
            password=True,
            helper_text="Enter your password",
            helper_text_mode="on_focus"
        )
        card_layout.add_widget(self.password_field)
        
        # Login button
        login_btn = MDRaisedButton(
            text="LOGIN",
            size_hint_y=None,
            height=dp(40),
            on_release=self.login_user
        )
        card_layout.add_widget(login_btn)
        
        # Signup button
        signup_btn = MDFlatButton(
            text="Create New Account",
            size_hint_y=None,
            height=dp(40),
            on_release=self.show_signup
        )
        card_layout.add_widget(signup_btn)
        
        card.add_widget(card_layout)
        main_layout.add_widget(card)
        
        self.add_widget(main_layout)
        
    def login_user(self, *args):
        email = self.email_field.text.strip()
        password = self.password_field.text.strip()
        
        if not email or not password:
            toast("Please enter email and password")
            return
            
        # Run login in thread
        threading.Thread(target=self.do_login, args=(email, password), daemon=True).start()
        toast("Logging in...")
        
    def do_login(self, email, password):
        try:
            from kivy.app import App
            app = App.get_running_app()
            
            # Create async loop for this thread
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            
            result = loop.run_until_complete(app.api.login({
                "email": email,
                "password": password
            }))
            
            if "error" in result:
                Clock.schedule_once(lambda dt: toast(f"Login failed: {result['error']}"), 0)
            else:
                # Save user data
                user_data = {
                    "id": result["user"]["id"],
                    "name": result["user"]["name"],
                    "email": result["user"]["email"]
                }
                app.storage.save_user_data(user_data, result["token"])
                
                # Switch to dashboard
                Clock.schedule_once(lambda dt: self.switch_to_dashboard(), 0)
                Clock.schedule_once(lambda dt: toast("Login successful!"), 0)
                
        except Exception as e:
            Clock.schedule_once(lambda dt: toast(f"Login error: {str(e)}"), 0)
            
    def show_signup(self, *args):
        # Simple signup - just show a message for now
        toast("Signup: Use email/password. Account will be created on first login.")
        
    def switch_to_dashboard(self):
        from kivy.app import App
        app = App.get_running_app()
        app.root.current = "dashboard"

class SimpleDashboardScreen(MDScreen):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.build_simple_dashboard()
        
    def build_simple_dashboard(self):
        main_layout = MDBoxLayout(
            orientation="vertical",
            spacing=dp(10),
            padding=dp(20)
        )
        
        # Title
        title = MDLabel(
            text="📊 Tiffin Dashboard",
            theme_text_color="Primary",
            font_style="H5",
            halign="center",
            size_hint_y=None,
            height=dp(50)
        )
        main_layout.add_widget(title)
        
        # Stats Card
        stats_card = MDCard(
            elevation=2,
            padding=dp(20),
            size_hint_y=None,
            height=dp(150)
        )
        
        self.stats_label = MDLabel(
            text="Loading stats...",
            theme_text_color="Secondary",
            halign="center"
        )
        stats_card.add_widget(self.stats_label)
        main_layout.add_widget(stats_card)
        
        # Buttons
        btn_layout = MDBoxLayout(
            orientation="horizontal",
            spacing=dp(10),
            size_hint_y=None,
            height=dp(50)
        )
        
        refresh_btn = MDRaisedButton(
            text="Refresh",
            size_hint_x=0.5,
            on_release=self.refresh_stats
        )
        btn_layout.add_widget(refresh_btn)
        
        settings_btn = MDFlatButton(
            text="Settings",
            size_hint_x=0.5,
            on_release=self.go_to_settings
        )
        btn_layout.add_widget(settings_btn)
        
        main_layout.add_widget(btn_layout)
        
        # Logout button
        logout_btn = MDFlatButton(
            text="Logout",
            size_hint_y=None,
            height=dp(40),
            on_release=self.logout_user
        )
        main_layout.add_widget(logout_btn)
        
        self.add_widget(main_layout)
        
        # Load initial stats
        Clock.schedule_once(lambda dt: self.refresh_stats(), 1)
        
    def refresh_stats(self, *args):
        threading.Thread(target=self.load_stats, daemon=True).start()
        toast("Refreshing...")
        
    def load_stats(self):
        try:
            from kivy.app import App
            app = App.get_running_app()
            
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            
            result = loop.run_until_complete(app.api.get_dashboard_stats())
            
            if "error" in result:
                Clock.schedule_once(lambda dt: self.update_stats(f"Error: {result['error']}"), 0)
            else:
                stats_text = f"""📈 Statistics:
Total Users: {result.get('total_users', 0)}
Today's Scheduled: {result.get('today_scheduled', 0)}
Today's Delivered: {result.get('today_delivered', 0)}
Week Total: {result.get('week_total', 0)}
Week Delivered: {result.get('week_delivered', 0)}"""
                Clock.schedule_once(lambda dt: self.update_stats(stats_text), 0)
                
        except Exception as e:
            Clock.schedule_once(lambda dt: self.update_stats(f"Error loading stats: {str(e)}"), 0)
            
    def update_stats(self, text):
        self.stats_label.text = text
        
    def go_to_settings(self, *args):
        from kivy.app import App
        app = App.get_running_app()
        app.root.current = "settings"
        
    def logout_user(self, *args):
        from kivy.app import App
        app = App.get_running_app()
        app.storage.clear_user_data()
        app.root.current = "auth"
        toast("Logged out")

class SimpleSettingsScreen(MDScreen):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.build_simple_settings()
        
    def build_simple_settings(self):
        scroll = MDScrollView()
        main_layout = MDBoxLayout(
            orientation="vertical",
            spacing=dp(15),
            padding=dp(20),
            size_hint_y=None,
            height=dp(600)
        )
        
        # Title
        title = MDLabel(
            text="⚙️ Tiffin Settings",
            theme_text_color="Primary",
            font_style="H5",
            halign="center",
            size_hint_y=None,
            height=dp(50)
        )
        main_layout.add_widget(title)
        
        # User Info Card
        user_card = MDCard(
            elevation=2,
            padding=dp(15),
            size_hint_y=None,
            height=dp(100)
        )
        
        self.user_info = MDLabel(
            text="Loading user info...",
            theme_text_color="Secondary",
            halign="center"
        )
        user_card.add_widget(self.user_info)
        main_layout.add_widget(user_card)
        
        # Weekly Schedule Card
        schedule_card = MDCard(
            elevation=2,
            padding=dp(15),
            size_hint_y=None,
            height=dp(300)
        )
        
        schedule_layout = MDBoxLayout(
            orientation="vertical",
            spacing=dp(10)
        )
        
        schedule_title = MDLabel(
            text="📅 Weekly Tiffin Schedule",
            theme_text_color="Primary",
            font_style="Subtitle1",
            halign="center",
            size_hint_y=None,
            height=dp(30)
        )
        schedule_layout.add_widget(schedule_title)
        
        # Day switches
        days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        self.day_switches = {}
        
        for day in days:
            day_layout = MDBoxLayout(
                orientation="horizontal",
                size_hint_y=None,
                height=dp(30)
            )
            
            day_label = MDLabel(
                text=day,
                theme_text_color="Secondary",
                size_hint_x=0.7
            )
            day_layout.add_widget(day_label)
            
            day_switch = MDSwitch(
                size_hint_x=0.3,
                pos_hint={"center_y": 0.5}
            )
            self.day_switches[day.lower()] = day_switch
            day_layout.add_widget(day_switch)
            
            schedule_layout.add_widget(day_layout)
            
        schedule_card.add_widget(schedule_layout)
        main_layout.add_widget(schedule_card)
        
        # Buttons
        btn_layout = MDBoxLayout(
            orientation="horizontal",
            spacing=dp(10),
            size_hint_y=None,
            height=dp(50)
        )
        
        save_btn = MDRaisedButton(
            text="Save Schedule",
            size_hint_x=0.6,
            on_release=self.save_schedule
        )
        btn_layout.add_widget(save_btn)
        
        back_btn = MDFlatButton(
            text="Back",
            size_hint_x=0.4,
            on_release=self.go_back
        )
        btn_layout.add_widget(back_btn)
        
        main_layout.add_widget(btn_layout)
        
        scroll.add_widget(main_layout)
        self.add_widget(scroll)
        
        # Load initial data
        Clock.schedule_once(lambda dt: self.load_user_data(), 1)
        
    def load_user_data(self):
        try:
            from kivy.app import App
            app = App.get_running_app()
            user_data = app.storage.get_user_data()
            
            if user_data:
                user_text = f"👤 {user_data.get('name', 'User')}\n📧 {user_data.get('email', 'No email')}"
                Clock.schedule_once(lambda dt: setattr(self.user_info, 'text', user_text), 0)
                
        except Exception as e:
            Clock.schedule_once(lambda dt: setattr(self.user_info, 'text', f"Error: {str(e)}"), 0)
            
    def save_schedule(self, *args):
        toast("Schedule saved! (Feature coming soon)")
        
    def go_back(self, *args):
        from kivy.app import App
        app = App.get_running_app()
        app.root.current = "dashboard"

class SimpleTiffinApp(MDApp):
    def build(self):
        self.title = "🍛 Tiffin Manager"
        
        # Set theme
        self.theme_cls.theme_style = "Light"
        self.theme_cls.primary_palette = "DeepPurple"
        self.theme_cls.material_style = "M3"
        
        # Initialize storage and API
        self.storage = Storage()
        self.api = APIClient(self.storage)
        
        # Create screen manager
        sm = MDScreenManager()
        
        # Add screens
        sm.add_widget(SimpleAuthScreen(name="auth"))
        sm.add_widget(SimpleDashboardScreen(name="dashboard"))
        sm.add_widget(SimpleSettingsScreen(name="settings"))
        
        # Check if user is logged in
        if self.storage.is_logged_in():
            sm.current = "dashboard"
        else:
            sm.current = "auth"
            
        return sm

if __name__ == "__main__":
    print("🎨 Starting Simple Tiffin Management GUI...")
    try:
        SimpleTiffinApp().run()
    except Exception as e:
        print(f"❌ GUI failed: {e}")
        import traceback
        traceback.print_exc()
